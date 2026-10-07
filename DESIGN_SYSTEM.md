# Wedding Adventure — Design System and Art Direction

Version 1.0 · 6 October 2026 · Companion to PRD.md and IMPLEMENTATION_PLAN.md

## 1. The creative direction

**A contemporary Indian invitation atelier.** The experience should evoke opening a beautifully made wedding invitation: substantial paper, confident typography, precise printing, rich color, and an illustrated world made for the occasion.

The memorable element is an invitation that opens into a miniature illustrated wedding journey. The surrounding product is disciplined and legible. Luxury comes from the quality of composition, artwork, pacing, and details.

“Wedding Adventure” remains a working name. Keep brand name, logo, domain, and support address configurable until final branding is chosen. Do not invent testimonials, partner logos, awards, or sales counts.

### Design critique before implementation

An initial cream-and-gold layout with evenly sized feature cards would feel interchangeable with many wedding builders. Replace that composition with a deep wine opening spread, an oversized invitation object, and an actual playable moment. Keep warm paper for the invitation and working surfaces, where it has a material purpose. Use section layouts appropriate to the content instead of repeating card grids.

No visual competitor copy is required. Develop original motifs grounded in stationery, courtyard architecture, floral garlands, and celebration. Avoid assuming a particular religion or forcing ritual imagery into every wedding.

## 2. Color and materials

These are starting design tokens, to be checked for contrast in rendered components. Hex values belong in the theme definition; components consume semantic tokens.

| Material/color | Value | Role |
| --- | --- | --- |
| Wine lacquer | `#4A1728` | Brand stage, primary action, selected state |
| Warm paper | `#FBF6EF` | Invitation surface and main workspace background |
| Ink | `#291F24` | Body copy and headings on light surfaces |
| Antique brass | `#AE8B51` | Small ornaments, illustration accents, separators; not small body copy |
| Rose lining | `#EAD6D5` | Secondary surfaces, selected previews, quiet supporting color |
| Garden green | `#315448` | Garden theme and botanical illustration accents |

Define paired semantic variables for background/foreground, surface/foreground, primary/foreground, secondary/foreground, muted/foreground, border, input, ring, destructive/foreground, success, and warning. Verify normal text at 4.5:1 and large text/essential control boundaries at 3:1 where applicable. Select deeper functional status shades when necessary; decorative brass is not a universal accessible accent.

Use warm paper with ink for reading. Use warm paper text on wine for the hero and major actions. Use texture sparingly: one small static paper texture, no full-screen noise filter, and no visual texture behind dense form copy.

Shadows should explain layering: a soft physical shadow under the invitation, subtle elevation for floating menus, and no repeated shadow on every section. Choose component radii by purpose: approximately 8 px controls, 14 px dialogs, 18 px preview surfaces. Arches belong to illustrated architectural framing, not all form fields.

## 3. Typography

Proposed font selection; obtain official font files and preserve license files during implementation:

| Script/use | Typeface | Treatment |
| --- | --- | --- |
| Latin display and couple names | Cormorant Garamond | Medium/semibold, generous size, careful line breaks |
| Latin UI and body | Manrope | Regular/medium/semibold; clear numbers and dates |
| Gujarati display | Noto Serif Gujarati | Comfortable line height; visual weight matched to Latin display |
| Gujarati UI/body | Noto Sans Gujarati | Readable at mobile sizes; no forced letter spacing |

Use language-aware font stacks. Load only the subsets and weights used by the route; avoid downloading every font on every page. Preserve Gujarati shaping and test mixed-script names.

Suggested responsive scale: hero 44–80 px, couple names 38–72 px, section titles 30–48 px, subsection titles 22–28 px, body and form inputs 16–18 px, supporting labels 14 px. Use at least 1.5 line height for body text and more vertical room where Gujarati requires it. Dense desktop tables may use 14 px text if legibility survives device testing.

Keep body lines around 55–70 characters. Names wrap naturally; never truncate the names on a public invitation. Do not shrink a long name into unreadable type to preserve an ornamental layout. Use sentence case, plain labels, and tabular numerals for attendance counts.

## 4. Three invitation themes

All themes share content, navigation, accessibility behavior, and the five-scene engine. Each has its own composition details, art pack, event decoration, and palette.

| Theme | Visual story | Artwork and motion |
| --- | --- | --- |
| Royal Maroon | An intimate palace courtyard invitation | Wine arches, restrained brass linework, paper panels; doors open once when Explore is selected |
| Marigold | A sunlit courtyard celebration | Garlands, saffron flowers, warm stone, wine ink; a short garland/route reveal on scene entry |
| Garden Ivory | A garden pavilion invitation | Botanical framing, ivory paper, garden green, soft rose flowers; a restrained foliage reveal |

The product shell retains one coherent brand across these themes. Theme selection changes the guest invitation and its preview, not the appearance of every dashboard control.

### Asset production list

- Three five-scene illustration packs using shared silhouettes and a consistent hand-drawn vector language.
- A modular avatar system: at least four appearances and three outfit choices independently selectable for each partner. Layer garments onto shared character geometry instead of hand-exporting every combination.
- Responsive crops for mobile and desktop; meaningful subjects must survive both.
- One static fallback per scene and a zero-photo invitation variant.
- Three social-image compositions and the matching QR presentation treatment.
- Two licensed instrumental audio tracks with no automatic playback.
- An inventory recording author/source, license, permitted use, attribution, and file location.

Avoid unlicensed wedding photography or copied characters. Required Gujarati copy and final assets remain release gates if placeholders are used during implementation.

## 5. Page composition

### Marketing home

Open with the wedding invitation itself. Use a wine background, a quiet navigation line, a clear proposition, and an oversized interactive invitation on paper. Keep the primary action visible before the first scroll.

```text
Desktop
┌──────────────────────────────────────────────────────────────┐
│ Wordmark              The experience   Pricing       Sign in │
│                                                              │
│ A wedding invitation       ┌─────────────────────────────┐   │
│ worth exploring.           │ Original illustrated invite │   │
│                            │      Aarya & Dev             │   │
│ Your celebration, brought  │      [Explore the demo]      │   │
│ to life in one link.       └─────────────────────────────┘   │
│ [Create your invitation]                                    │
├──────────────────────────────────────────────────────────────┤
│ Three themes, shown as generous invitation samples            │
│ A short, real setup sequence                                 │
│ One clear price and hosting term                             │
│ Useful FAQs and support                                      │
└──────────────────────────────────────────────────────────────┘
```

On mobile, keep the headline concise, then the invitation sample, then the create action within a compact opening composition. Do not auto-download all adventure packs for the landing page. The demo launches the real renderer with fictional data.

### Invitation editor

On desktop: steps at left, the current form in the middle, and a sticky preview at right. The preview is a real renderer in an isolated frame, not a screenshot. Keep preview updates lightweight and local while a draft save is in progress.

```text
┌────────────────────────────────────────────────────────────────┐
│ Back to weddings      Aarya & Dev       Saved       Preview     │
├────────────┬────────────────────────┬──────────────────────────┤
│ Couple     │ Couple details         │ Guest preview            │
│ Functions  │ Names, families        │                          │
│ Appearance │ Message, photos        │ The actual invitation    │
│ Review     │                        │                          │
│            │ [Back]       [Continue]│ Language / viewport      │
└────────────┴────────────────────────┴──────────────────────────┘
```

On mobile: a single form column, compact step progress, and a full-height preview view opened explicitly. Do not squeeze a phone mockup alongside tiny fields. The keyboard must not cover the active control or the save/error status.

Show persistent save state near the wedding name. Inline validation explains the exact correction. Review lists only publish blockers and meaningful optional omissions; it does not overwhelm with implementation details.

### Public invitation

The opening feels like a personal invitation. Both Explore and View invitation details are visible at once. Language and sound controls are plainly discoverable. Details, Back, and Next remain reachable during the adventure.

The details page is a readable invitation: couple names, main date, event list, directions, optional hosts, RSVP. Use chronological event rows with generous spacing; use cards only when they help group each function. A mobile RSVP action may stick to the bottom with safe-area padding and must not obscure content.

### Owner dashboard and checkout

Show wedding previews, publication state, hosting dates, and clear next actions. An empty dashboard invites the first wedding creation. Response pages emphasize event totals and a readable family table, not decorative charts.

Checkout has one invitation summary, one total, the hosting dates, and one payment action. Payment pending, paid/publishing, published, and recoverable failure have distinct messages. A successful payment is never presented as failed solely because publishing is still running.

## 6. shadcn/ui composition

Use shadcn/ui source components and semantic tokens as the application foundation. Theme through variables and intentional shared variants; keep per-instance classes focused on layout. This follows shadcn's [CSS-variable theming model](https://ui.shadcn.com/docs/theming).

| Need | Components and composition |
| --- | --- |
| Forms | FieldGroup, Field, FieldLabel, FieldDescription, Input, Textarea, Select |
| Related settings | FieldSet/FieldLegend, Checkbox, Switch, ToggleGroup |
| Theme and appearance choice | ToggleGroup with accessible preview content and a clear selected indicator |
| Responsive editing overlays | Dialog/Sheet; accessible title, focus return, Escape support |
| Wedding collection | Card with its complete header/content/footer structure |
| Responses | Table, Pagination, Badge, InputGroup for search |
| Feedback | Alert, Empty, Skeleton, Spinner; base-compatible toast component |
| Destructive actions | AlertDialog with explicit action wording |

Choose a single primitive base at scaffold time and document it; proposed default is Radix with Sonner. Inspect generated APIs rather than assuming Radix and Base UI are interchangeable. Use the official shadcn registry as the planned source; no third-party blocks are needed for this design.

Before adding components, inspect project configuration, retrieve their current CLI documentation, and review generated files. Icons are from one configured library, with text labels for essential actions. Avoid nesting buttons in buttons and use the primitive's documented custom-trigger mechanism.

## 7. Emil-inspired motion specification

Motion explains actions, clarifies transitions, or marks a rare celebratory moment. Frequent editor interactions prioritize immediate response.

| Interaction | Proposed behavior |
| --- | --- |
| Pointer button press | Scale to 0.97 over 100–140 ms; no layout shift |
| Select/popover | 140–180 ms opacity and subtle transform from the trigger origin |
| Dialog | 180–220 ms; opacity with scale from 0.97; centered origin |
| Mobile sheet | Up to 250 ms, interruptible; focus and keyboard behavior remain correct |
| Save status | Stable layout; immediate text/icon update, no repeated celebration |
| Adventure scene | 280–450 ms maximum reveal after a guest action; Details/Skip stay active |
| Published success | One restrained illustration reveal; no perpetual confetti |

Use `cubic-bezier(0.23, 1, 0.32, 1)` for entrances and `cubic-bezier(0.77, 0, 0.175, 1)` for a deliberate scene transition. Exits are shorter. Use CSS transitions for small predetermined effects; use Motion only for the interactive sequence or interruptible transitions that need it.

Animate explicit properties, primarily transform and opacity. Avoid `transition: all`, scale-from-zero entrances, heavy animated blur, scroll hijacking, continuous parallax, and mouse-follow decorations. Gate hover effects behind fine-pointer/hover media queries.

Keyboard-driven operations update immediately. Reduced-motion mode removes travel, scaling, parallax, and ornamental reveals; static states or brief opacity changes retain clarity. Sound always begins from an explicit action and stops appropriately when leaving the experience.

## 8. Visual acceptance

- Capture marketing, editor, details, every adventure scene, checkout, response list, and failure states at 360, 390, 768, and 1440 px widths.
- Review all themes, both scripts, long names, no-photo cases, 10 events, reduced motion, and large text.
- Check typography before decoration: hierarchy, wrap, line height, alignment, date readability, and Gujarati shaping.
- Ensure original artwork feels like a coherent family across scenes and avatars.
- Test interactions quickly and in slow motion; remove timing that delays ordinary work.
- Run keyboard/focus checks and inspect real Android/iPhone behavior where available.
- Record design-engineering reviews using an actual Before / After / Why table, as required by the Emil skill.

The visual milestone passes only when screenshots and working interactions demonstrate this direction. Selecting fonts and installing shadcn is not evidence of a finished aesthetic.


## Full-screen invitation direction ? 7 October 2026

The guest invitation opens into an edge-to-edge illustrated world occupying at least the full viewport. Cover and ceremony chapters use the existing royal, marigold, and garden palettes, with oversized architecture and ceremony characters, foreground botanicals, hanging lights, and falling petals. Keep the editor, marketing page, and details/RSVP view on their established layouts.

On desktop, place the reading area over the quiet left side of the illustration, with the ceremony to the right. On phones, place the heading above the ceremony and reframe the cast so ritual props remain visible. Keep chapter controls near the bottom and allow horizontal chapter scrolling. Large text and short landscape screens must remain scrollable. Never require browser fullscreen permission.

Motion follows the Emil design engineering and animate skills: this is a rare celebration experience, with explanation and delight as its purpose. Predetermined ceremony motion uses transform/opacity loops; navigation uses brief opacity/transform transitions with the existing ease-out token and 40 ms staggering. Keyboard navigation is immediate. Pause controls stop foreground and ceremony motion; offscreen/hidden-tab ambient layers sleep. Reduced motion preserves a readable still scene and gentle opacity changes. No additional animation library or remote illustration assets are required.


### Ceremony wardrobe and chapter motion

Sangeet uses jewel-toned, sequined garments and a dedicated evening stage: mirror ball, sweeping colored beams, speaker stacks, and slowly glowing floor tiles. Keep the light changes gradual, without strobes. Baraat uses its own gold brocade sherwani, wine stole, pearl necklaces, and feathered turban. The couple's selected outfits remain in the varmala ceremony.

Each screen, including the cover, participates in a 280 ms full-scene crossfade with a small horizontal movement. Use the browser View Transition API with an opacity/transform fallback. Paused motion, keyboard navigation, and reduced-motion preference update immediately. Navigation remains usable during a transition. Feather the illustration's own left edge with an alpha mask, in addition to the reading-area gradient, to eliminate a visible rectangular boundary.

Keep the static courtyard separate from the animated cast, and apply the desktop edge mask only to the courtyard. Move foreground flower arrangements and hanging lights as whole layers. Group disco floor lights by row and animate selected sequins while retaining all costume detail. Sangeet characters use small rendering surfaces to isolate arm movement from the full-screen illustration. Keep active Sangeet timelines below 85; do not add one timeline per ornament.

Run `node scripts/animation-performance.mjs` against the local production server on port 3001 to sample steady Sangeet motion. `PERF_CPU=4` enables a stress sample; `PERF_PROBES=1` compares rendering costs. Timing varies with machine load. The normal-speed sample reached a 16.8 ms 95th-percentile frame interval; the 4× slowdown sample improved from 233.3 ms before optimization to 50 ms afterward. This is a measured improvement, not a guarantee of 60 fps on every device.
