import { expect, it } from "vitest";
import { contentSchema, demoContent, eventCeremony } from "../src/lib/content";

it.each([
  ["Haldi afternoon", "", "haldi"],
  ["", "પીઠી", "haldi"],
  ["Mehendi", "", "mehendi"],
  ["Mahendi", "", "mehendi"],
  ["", "મહેંદી", "mehendi"],
  ["An evening of music", "", "sangeet"],
  ["", "સંગીત સંધ્યા", "sangeet"],
  ["The wedding", "", "wedding"],
  ["", "લગ્ન સમારંભ", "wedding"],
  ["Family dinner", "", "celebration"],
] as const)("chooses a scene for %s / %s", (en, gu, expected) => {
  expect(eventCeremony({ title: { en, gu } })).toBe(expected);
});
it("honors an explicit scene for a custom event title", () => {
  expect(
    eventCeremony({
      title: { en: "Yellow sunshine", gu: "" },
      animation: "haldi",
    }),
  ).toBe("haldi");
});
it("loads old invitations without an animation field", () => {
  const old = structuredClone(demoContent);
  old.events.forEach((event) => delete event.animation);
  expect(contentSchema.safeParse(old).success).toBe(true);
});
