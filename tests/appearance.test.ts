import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Character, Courtyard } from "../src/components/illustration";
import {
  contentSchema,
  demoContent,
  publicationSchema,
  themes,
  ceremonyKinds,
} from "../src/lib/content";
import {
  characterOptions,
  outfitOptions,
  ceremonyPartners,
} from "../src/lib/appearance";
import { CeremonyArt } from "../src/features/invitations/ceremony-art";

describe("Invitation appearance choices", () => {
  it.each([1, 3, 5, 7, 9])(
    "keeps a visible beard on men's character %s in both rendering modes",
    (appearance) => {
      for (const composited of [false, true]) {
        const svg = renderToStaticMarkup(
          createElement(Character, { appearance, outfit: 1, composited }),
        );
        expect(svg).toContain('class="character-beard"');
        expect(svg).toContain('data-cut="tailored"');
        expect(svg).toContain('class="tailored-details"');
      }
    },
  );

  it("saves and publishes every choice for both partners without changing its ID", () => {
    expect(characterOptions).toHaveLength(10);
    expect(outfitOptions).toHaveLength(10);
    for (const theme of themes) {
      for (let appearance = 0; appearance < 10; appearance++) {
        const content = {
          ...demoContent,
          theme,
          characters: [appearance, 9 - appearance],
          outfits: [9 - appearance, appearance],
        };
        expect(publicationSchema.parse(content)).toMatchObject(content);
      }
    }
  });

  it.each([-1, 10, 1.5, NaN])(
    "rejects invalid saved choice %s for either partner",
    (invalid) => {
      for (const field of ["characters", "outfits"] as const) {
        for (const pair of [
          [invalid, 0],
          [0, invalid],
        ]) {
          expect(
            contentSchema.safeParse({ ...demoContent, [field]: pair }).success,
          ).toBe(false);
        }
      }
    },
  );

  it("renders every character/outfit combination with valid colors in every occasion", () => {
    for (const occasion of ["everyday", "sangeet", "baraat"] as const) {
      for (let appearance = 0; appearance < 10; appearance++) {
        for (let outfit = 0; outfit < 10; outfit++) {
          const svg = renderToStaticMarkup(
            createElement(Character, { appearance, outfit, occasion }),
          );
          expect(svg).toContain(`fill="${characterOptions[appearance].skin}"`);
          expect(svg).toContain(`fill="${outfitOptions[outfit].color}"`);
          expect(svg).not.toMatch(/undefined|NaN/);
        }
      }
    }
  });

  it.each(themes)("renders the %s world with the newest choices", (theme) => {
    const svg = renderToStaticMarkup(
      createElement(Courtyard, { theme, characters: [8, 9], outfits: [8, 9] }),
    );
    expect(svg).not.toMatch(/undefined|NaN/);
    expect(svg).toContain('role="img"');
  });

  it.each(ceremonyKinds)(
    "keeps both partners' selected clothes in %s",
    (kind) => {
      const svg = renderToStaticMarkup(
        createElement(CeremonyArt, {
          kind,
          content: { ...demoContent, characters: [8, 9], outfits: [6, 7] },
        }),
      );
      expect(svg).toContain('data-outfit="6" data-appearance="8"');
      expect(svg).toContain('data-outfit="7" data-appearance="9"');
      expect(svg).not.toMatch(/data-outfit="(?!6")\d+" data-appearance="8"/);
      expect(svg).not.toMatch(/data-outfit="(?!7")\d+" data-appearance="9"/);
      if (kind === "sangeet") expect(svg).not.toContain("foreignObject");
    },
  );

  it.each([
    { genders: ["female", "male"] as const, arriving: 1, waiting: 0 },
    { genders: ["male", "female"] as const, arriving: 0, waiting: 1 },
    { genders: ["female", "female"] as const, arriving: 1, waiting: 0 },
    { genders: ["male", "male"] as const, arriving: 1, waiting: 0 },
  ])(
    "saves gender choices and assigns ceremony roles for $genders",
    ({ genders, arriving, waiting }) => {
      const content = contentSchema.parse({
        ...demoContent,
        genders,
        outfits: [6, 7],
      });
      expect(content.genders).toEqual(genders);
      expect(publicationSchema.parse(content).genders).toEqual(genders);
      expect(ceremonyPartners(content.genders)).toEqual({ arriving, waiting });
      const svg = renderToStaticMarkup(
        createElement(CeremonyArt, { kind: "wedding", content }),
      );
      expect(svg).toContain(
        `data-wedding-role="arriving" data-partner="${arriving}"`,
      );
      expect(svg).toContain(
        `data-wedding-role="waiting" data-partner="${waiting}"`,
      );
      expect(svg).toContain(
        `data-attire="baraat" data-outfit="${content.outfits[arriving]}" data-appearance="${content.characters[arriving]}"`,
      );
    },
  );

  it("keeps older invitations valid and rejects invalid gender choices", () => {
    const legacy = { ...demoContent, genders: undefined };
    expect(contentSchema.safeParse(legacy).success).toBe(true);
    expect(ceremonyPartners(legacy.genders)).toEqual({
      arriving: 1,
      waiting: 0,
    });
    for (const genders of [
      ["invalid", "female"],
      ["male"],
      ["female", "male", "male"],
    ]) {
      expect(contentSchema.safeParse({ ...demoContent, genders }).success).toBe(
        false,
      );
    }
  });

  it("gives all six themes different building geometry", () => {
    const buildings = themes.map((theme) => {
      const svg = renderToStaticMarkup(
        createElement(Courtyard, { theme }, false),
      );
      expect(svg).toContain(`data-architecture="${theme}"`);
      // Ignore palette changes: the actual paths, windows and rooflines must differ.
      return [...svg.matchAll(/ d="([^"]+)"/g)]
        .map((match) => match[1])
        .join("|");
    });
    expect(new Set(buildings).size).toBe(themes.length);
  });
});
