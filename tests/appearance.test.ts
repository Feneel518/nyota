import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Character, Courtyard } from "../src/components/illustration";
import {
  contentSchema,
  demoContent,
  publicationSchema,
  themes,
} from "../src/lib/content";
import { characterOptions, outfitOptions } from "../src/lib/appearance";

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
          expect(svg).toContain(
            `fill="${occasion === "sangeet" ? outfitOptions[outfit].sangeet : occasion === "baraat" ? "#f1c67e" : outfitOptions[outfit].color}"`,
          );
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
});
