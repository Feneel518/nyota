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
  ["Wedding carnival", "", "carnival"],
  ["", "કાર્નિવલ", "carnival"],
  ["Pool Party", "", "pool-party"],
  ["", "પૂલ પાર્ટી", "pool-party"],
  ["Grah Santak", "", "grah-shanti"],
  ["Griha Shanti", "", "grah-shanti"],
  ["", "ગ્રહ શાંતિ", "grah-shanti"],
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
it.each(["carnival", "pool-party", "grah-shanti"] as const)(
  "saves the %s scene and honors it over the title",
  (animation) => {
    const content = structuredClone(demoContent);
    content.events[0].animation = animation;
    expect(contentSchema.safeParse(content).success).toBe(true);
    expect(eventCeremony(content.events[0])).toBe(animation);
  },
);
