import "server-only";
import {
  familyTemplates,
  invitationTemplates,
  functionSuggestions,
} from "@/content/invitation-templates";

const knownTranslations = new Map([
  ...familyTemplates.map((item) => [item.text.en, item.text.gu] as const),
  ...invitationTemplates.map((item) => [item.text.en, item.text.gu] as const),
  ...functionSuggestions.map((item) => [item.title.en, item.title.gu] as const),
]);

// MyMemory accepts at most 500 UTF-8 bytes in a segment. Preserve whitespace
// between segments and split at word boundaries where possible.
export function translationSegments(text: string): string[] {
  const segments: string[] = [];
  let rest = text;
  while (rest) {
    let end = 0;
    let bytes = 0;
    for (const character of rest) {
      const length = Buffer.byteLength(character, "utf8");
      if (bytes + length > 480) break;
      bytes += length;
      end += character.length;
    }
    if (end < rest.length) {
      const boundary = rest.slice(0, end).search(/\s+\S*$/);
      if (boundary > 0) end = boundary;
    }
    segments.push(rest.slice(0, end));
    rest = rest.slice(end);
  }
  return segments;
}

function decodeEntities(text: string) {
  const named: Record<string, string> = {
    amp: "&",
    quot: '"',
    apos: "'",
    lt: "<",
    gt: ">",
    nbsp: " ",
  };
  return text.replace(
    /&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi,
    (match, entity: string) => {
      if (!entity.startsWith("#")) return named[entity.toLowerCase()] || match;
      const value = entity.toLowerCase().startsWith("#x")
        ? parseInt(entity.slice(2), 16)
        : Number(entity.slice(1));
      return value > 0 && value <= 0x10ffff
        ? String.fromCodePoint(value)
        : match;
    },
  );
}

export async function translateGujarati(
  text: string,
  signal: AbortSignal,
): Promise<string> {
  const known = knownTranslations.get(text.trim());
  if (known) return known;
  let translated = "";
  for (const segment of translationSegments(text)) {
    if (!segment.trim()) {
      translated += segment;
      continue;
    }
    const url = new URL("https://api.mymemory.translated.net/get");
    url.searchParams.set("q", segment.trim());
    url.searchParams.set("langpair", "en|gu");
    const response = await fetch(url, { cache: "no-store", signal });
    if (!response.ok)
      throw new Error("Translation service is unavailable. Please try again.");
    const data = await response.json();
    if (data.quotaFinished || Number(data.responseStatus) === 429)
      throw new Error(
        "The translation service’s daily limit has been reached. Try again tomorrow or use a template.",
      );
    if (
      Number(data.responseStatus) !== 200 ||
      typeof data.responseData?.translatedText !== "string"
    )
      throw new Error(
        "This text could not be translated. Try a shorter sentence or write the Gujarati yourself.",
      );
    const result = decodeEntities(data.responseData.translatedText).trim();
    if (
      !result ||
      result.length > 5000 ||
      (!/[\u0a80-\u0aff]/.test(result) && /[a-z]/i.test(segment))
    )
      throw new Error(
        "No Gujarati translation was returned. Please enter this field yourself.",
      );
    translated +=
      (segment.match(/^\s+/)?.[0] || "") +
      result +
      (segment.match(/\s+$/)?.[0] || "");
  }
  return translated;
}
