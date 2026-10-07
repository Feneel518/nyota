import { cookies } from "next/headers";
import { z } from "zod";
import {
  body,
  checkOrigin,
  endpoint,
  rateLimitRequest,
  response,
  AppError,
} from "@/server/security";
import { responseFromToken, saveResponse } from "@/server/rsvp";
import { env } from "@/server/env";
import { publicWedding } from "@/server/weddings";
export async function POST(req: Request) {
  return endpoint(async () => {
    await rateLimitRequest(req, "rsvp-edit", 15);
    const input = await body(req, 5000);
    const jar = await cookies();
    if (input.token) {
      const token = z
        .string()
        .regex(/^[a-f0-9]{64}$/)
        .parse(input.token);
      const data = await responseFromToken(token);
      checkOrigin(req, data.slug);
      jar.set("rsvp-capability", token, {
        httpOnly: true,
        secure: env().APP_URL.startsWith("https:"),
        sameSite: "strict",
        path: "/api/rsvp/edit",
        maxAge: 3600,
      });
      const wedding = await publicWedding(data.slug);
      if (!wedding) throw new AppError(410, "Invitation expired.");
      const active = new Set(wedding.content.events.map((event) => event.id));
      return response({
        ...data,
        counts: Object.fromEntries(
          Object.entries(data.counts).filter(([id]) => active.has(id)),
        ),
        content: wedding.content,
      });
    }
    const token = jar.get("rsvp-capability")?.value;
    if (!token) throw new AppError(401, "Open your private edit link again.");
    const current = await responseFromToken(token);
    checkOrigin(req, current.slug);
    return response(
      await saveResponse(
        current.slug,
        input.response,
        token,
        z.uuid().parse(input.key),
        z.number().int().positive().parse(input.version),
      ),
    );
  });
}
