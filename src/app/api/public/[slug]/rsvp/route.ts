import { z } from "zod";
import { saveResponse } from "@/server/rsvp";
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
    await rateLimitRequest(req, "rsvp", 15);
    const data = z
      .object({ response: z.unknown(), token: z.string(), key: z.uuid() })
      .parse(await body(req, 5000));
    return response(
      await saveResponse(slug, data.response, data.token, data.key),
    );
  });
}
