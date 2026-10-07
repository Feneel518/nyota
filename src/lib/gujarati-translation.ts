import type { InvitationContent } from "./content";

export type TranslationCandidate = {
  id: string;
  label: string;
  text: string;
  maxLength: number;
};
export type TranslationResult = { id: string; text?: string; error?: string };

export function missingGujarati(
  content: InvitationContent,
  scope: "couple" | "events",
): TranslationCandidate[] {
  const items: TranslationCandidate[] = [];
  const add = (
    id: string,
    label: string,
    value: { en: string; gu: string },
    maxLength: number,
  ) => {
    if (value.en.trim() && !value.gu.trim())
      items.push({ id, label, text: value.en, maxLength });
  };
  if (scope === "couple") {
    content.names.forEach((value, i) =>
      add(`name:${i}`, `Partner ${i + 1}’s name`, value, 80),
    );
    content.motherNames?.forEach((value, i) =>
      add(`mother:${i}`, `Partner ${i + 1}’s mother’s name`, value, 80),
    );
    add("families", "Family line", content.families, 200);
    add("welcome", "Your welcome message", content.welcome, 1000);
    add("wording", "Invitation wording", content.wording, 1000);
  } else {
    content.events
      .filter((event) => !event.archived)
      .forEach((event, i) => {
        for (const [key, label, max] of [
          ["title", "Event title", 100],
          ["venue", "Venue name", 150],
          ["address", "Address", 500],
          ["notes", "Event notes", 1000],
        ] as const)
          add(
            `event:${event.id}:${key}`,
            `Function ${i + 1}: ${label}`,
            event[key],
            max,
          );
      });
  }
  return items;
}

// Apply only to an unchanged English source with an empty Gujarati destination.
// Editing while the translation dialog is open must never overwrite newer work.
export function applyGujarati(
  content: InvitationContent,
  items: TranslationCandidate[],
  results: TranslationResult[],
) {
  const next = structuredClone(content);
  for (const item of items) {
    const result = results.find((value) => value.id === item.id);
    if (!result?.text?.trim() || result.text.length > item.maxLength) continue;
    const [kind, index, key] = item.id.split(":");
    let value: { en: string; gu: string } | undefined;
    if (kind === "name") value = next.names[Number(index)];
    else if (kind === "mother") value = next.motherNames?.[Number(index)];
    else if (kind === "event") {
      const event = next.events.find(
        (event) => event.id === index && !event.archived,
      );
      if (event && ["title", "venue", "address", "notes"].includes(key))
        value = event[key as "title" | "venue" | "address" | "notes"];
    } else if (["families", "welcome", "wording"].includes(kind))
      value = next[kind as "families" | "welcome" | "wording"];
    if (value && value.en === item.text && !value.gu.trim())
      value.gu = result.text.trim();
  }
  return next;
}
