import { z } from "zod";
import { requireUser } from "@/server/auth";
import { ownerWedding } from "@/server/weddings";
import {
  AppError,
  body,
  checkOrigin,
  endpoint,
  rateLimitRequest,
  response,
} from "@/server/security";
import { translateGujarati } from "@/server/translation";
import type { TranslationResult } from "@/lib/gujarati-translation";
export const maxDuration = 60;

const requestSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().max(100),
        text: z.string().trim().min(1).max(1000),
      }),
    )
    .min(1)
    .max(40),
});
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return endpoint(async () => {
    checkOrigin(request);
    const user = await requireUser();
    const { id } = await context.params;
    z.uuid().parse(id);
    await ownerWedding(user.id, id);
    await rateLimitRequest(request, "gujarati-translation", 3, user.id);
    const { items } = requestSchema.parse(await body(request));
    if (items.reduce((total, item) => total + item.text.length, 0) > 4000)
      throw new AppError(
        400,
        "Select fewer fields. Translate up to 4,000 English characters at a time.",
      );
    const signal = AbortSignal.any([
      request.signal,
      AbortSignal.timeout(45000),
    ]);
    const results: TranslationResult[] = [];
    const cache = new Map<string, Promise<string>>();
    let cursor = 0;
    async function worker() {
      while (cursor < items.length) {
        const item = items[cursor++];
        try {
          let translation = cache.get(item.text);
          if (!translation) {
            translation = translateGujarati(item.text, signal);
            cache.set(item.text, translation);
          }
          results.push({ id: item.id, text: await translation });
        } catch (error) {
          results.push({
            id: item.id,
            error: signal.aborted
              ? "Translation timed out. Please try again."
              : error instanceof Error
                ? error.message
                : "Translation failed. Please try again.",
          });
        }
      }
    }
    await Promise.all([worker(), worker(), worker()]);
    return response({ translations: results });
  });
}
