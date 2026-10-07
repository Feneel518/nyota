# Asset and dependency inventory

| Asset | Location/source | License/use |
| --- | --- | --- |
| Courtyard, garden, garlands, trees, characters, outfits, ornament | `src/components/illustration.tsx`, original code created for this application | Original project artwork; no third-party image source or stock dependency. |
| Animated ceremony stages, turmeric, henna hand and cone, dhol, baraat horse, varmala, petals | `src/features/invitations/ceremony-art.tsx` and `ceremony.module.css` | Original SVG artwork and CSS choreography created for this application; no remote animation assets or motion-library dependency. |
| Courtyard melody; Garden at dusk | `src/features/invitations/music.ts`, original synthesized scores | CC0 declaration in source; no sampled recordings. Audio begins only after an explicit guest action. |
| Manrope | `@fontsource/manrope` 5.3.0 | SIL Open Font License 1.1; bundled notice in `docs/licenses/manrope.txt`. |
| Cormorant Garamond | `@fontsource/cormorant-garamond` 5.3.0 | SIL Open Font License 1.1; bundled notice in `docs/licenses/cormorant-garamond.txt`. |
| Noto Sans Gujarati | `@fontsource/noto-sans-gujarati` 5.3.0 | SIL Open Font License 1.1; bundled notice in `docs/licenses/noto-sans-gujarati.txt`. |
| Noto Serif Gujarati | `@fontsource/noto-serif-gujarati` 5.3.0 | SIL Open Font License 1.1; bundled notice in `docs/licenses/noto-serif-gujarati.txt`. |
| Lucide icons | `lucide-react` | ISC license distributed with package. |
| shadcn UI source | Official registry-generated Radix components in `src/components/ui` | MIT; upstream notice distributed with shadcn package. |
| Demo names, venue, date, wording | `src/lib/content.ts` | Fictional example, not customer information. |

Font files are self-hosted; rendering does not contact Google Fonts. Only required Latin and Gujarati subsets/weights are imported. Uploaded owner photos are private customer content, subject to the final terms and lifecycle policy. Font and dependency notices must remain with distributions.

No third-party photos, commercial music, or external wedding designs were incorporated.
