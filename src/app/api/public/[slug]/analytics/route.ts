import { z } from "zod";
import { db } from "@/server/db";
import { analytics } from "@/server/db/schema";
import { publicWedding } from "@/server/weddings";
import {
  body,
  checkOrigin,
  endpoint,
  rateLimitRequest,
  response,
} from "@/server/security";
export async function POST(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  return endpoint(async () => {
    const { slug } = await ctx.params;
    checkOrigin(req, slug);
    await rateLimitRequest(req, "analytics", 60);
    const input = z
      .object({
        kind: z.enum([
          "invitation_opened",
          "adventure_started",
          "adventure_completed",
        ]),
        key: z.uuid(),
      })
      .parse(await body(req, 1000));
    const w = await publicWedding(slug);
    if (w)
      await db()
        .insert(analytics)
        .values({
          key: `${input.kind}:${input.key}`,
          kind: input.kind,
          weddingId: w.id,
        })
        .onConflictDoNothing();
    return response({ accepted: true });
  });
}
