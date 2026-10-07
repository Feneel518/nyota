import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { sql } from "drizzle-orm";
import { ZodError } from "zod";
import { env } from "./env";
import { db } from "./db";
import { isInvitationOrigin } from "@/lib/invitation-url";
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
export function signature(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}
export function equal(a: string, b: string) {
  const left = Buffer.from(a),
    right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
export function verifySignature(
  body: string,
  supplied: string,
  secret: string,
) {
  return (
    /^[a-f0-9]{64}$/.test(supplied) && equal(signature(body, secret), supplied)
  );
}
export function checkOrigin(request: Request, invitationSlug?: string) {
  const origin = request.headers.get("origin");
  const base = new URL(env().APP_URL);
  if (origin === base.origin) return;
  if (
    invitationSlug &&
    origin &&
    isInvitationOrigin(
      origin,
      env().APP_URL,
      invitationSlug,
      env().INVITATION_DOMAIN,
    )
  )
    return;
  if (origin !== base.origin)
    throw new AppError(
      403,
      "This request came from an untrusted page. Reload and try again.",
    );
}
export async function body(request: Request, max = 64000) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new AppError(415, "Send JSON content.");
  const bytes = await boundedBody(request, max);
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new AppError(400, "Invalid request content.");
  }
}
export async function boundedBody(request: Request, max: number) {
  if (Number(request.headers.get("content-length")) > max)
    throw new AppError(413, "This upload is too large.");
  const reader = request.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const r = await reader.read();
    if (r.done) break;
    size += r.value.length;
    if (size > max) {
      await reader.cancel();
      throw new AppError(413, "This upload is too large.");
    }
    chunks.push(r.value);
  }
  return Buffer.concat(chunks);
}
export function response(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
export async function endpoint(fn: () => Promise<Response>) {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof AppError) return response({ error: e.message }, e.status);
    if (e instanceof ZodError)
      return response(
        {
          error: e.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join(" "),
          issues: e.issues,
        },
        400,
      );
    const id = crypto.randomUUID();
    console.error(
      JSON.stringify({
        code: "REQUEST_FAILED",
        correlationId: id,
        type: e instanceof Error ? e.name : "Unknown",
      }),
    );
    return response(
      {
        error:
          "We could not complete that request. Your changes have not been confirmed. Please retry.",
        reference: id,
      },
      500,
    );
  }
}
export async function rateLimitRequest(
  request: Request,
  route: string,
  limit = 30,
  subject?: string,
) {
  const identity =
    subject ||
    (process.env.VERCEL
      ? request.headers.get("x-vercel-forwarded-for")
      : "local") ||
    "unknown";
  const key = signature(
    `${route}:${identity}:${Math.floor(Date.now() / 60000)}`,
    env().HASH_SECRET || "development-rate-limit-only",
  );
  const r = await db().execute(
    sql`INSERT INTO rate_limit_buckets (key, count, expires_at) VALUES (${key}, 1, now() + interval '2 minutes') ON CONFLICT (key) DO UPDATE SET count = rate_limit_buckets.count + 1 RETURNING count`,
  );
  if (Number(r.rows[0].count) > limit)
    throw new AppError(
      429,
      "Too many requests. Please wait a minute and try again.",
    );
}
