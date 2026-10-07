# Verification evidence — 6 October 2026

## Marketing and first-customer improvements — 7 October 2026

The homepage now explains the Gujarati/English offer, shows the configured price in the hero, and places full pricing before the feature and theme galleries. Three additional themes expand on demand. Setup inquiries use the user-provided public support email. Demo and guest pages include explicit creation links; guest referral links carry campaign parameters, without adding attribution storage.

Homepage search/social metadata, a generated 1200 × 630 social image, and a marketing-only sitemap are implemented. `docs/marketing/` contains an exported PNG and a fictional demo recording; `docs/FIRST_CUSTOMERS.md` and the blank CSV support manual acquisition.

Validation: isolated production build including TypeScript passed; full repository ESLint passed, followed by targeted lint after final edits. Two production-browser tests passed: the marketing/theme/Gujarati journey and desktop/mobile stationery/sign-in accessibility. The older journey assertion was updated to match the existing removal of the redundant story screen. Ad hoc browser checks verified expanded themes, demo-to-sign-in navigation, support mail link, PNG response, sitemap, and horizontal overflow at 320/390/1440px. The final 320px Gujarati demo creation link was also exercised. Screenshots and the exported social card were visually inspected.

Tests used local providers and the production server at `127.0.0.1:3002`. No deployment, live purchase, outreach, or external email was performed. Operator identity, refund eligibility, financial-record retention, and live-provider verification remain open. The user supplied only the public support email; no business identity or commercial promises were invented.

All synthetic data is isolated in PostgreSQL on `127.0.0.1:55432/wedding`. Browser checks use the Next.js production build at `127.0.0.1:3001`, local mail/object storage, and a guarded local payment adapter. No live charge or external email was made.

| Check | Evidence and scope |
| --- | --- |
| Production build and TypeScript | `node scripts/local-run.mjs build` succeeds, compiling the application including protected APIs and public social images. |
| Lint | `pnpm exec eslint .` passes without errors or warnings. |
| Automated domain/database tests | 45 tests across five files pass, including SMTP delivery/error contracts and backward-compatible ceremony selection. Includes schema compatibility with installed Better Auth, valid calendars, six-month hosting, safe CSV, signature/capture contracts, tenant denial, concurrent autosave, frozen checkout revision, capture replay, publication edits, RSVP capabilities/idempotency, composite wedding/event FKs, decoded media, concurrent quota, refund/dispute replay, lease recovery, expiry/grace, and purge retaining financial records. |
| Browser journey | **Five Playwright tests pass** against the production build. Chromium verifies all three themes and scene progression, Gujarati public content, mobile overflow/reduced-motion rendering, actual magic-link sign-in, persistent workspace language, reload/resume, local verified payment, public RSVP, private-link edit, CSV export, changed venue publication, and unauthorized export denial. Dedicated tests verify expired/single-use links and session revocation after sign-out. |
| Accessibility | axe WCAG 2 A/AA + 2.1 AA checks pass on the tested desktop marketing and mobile invitation surfaces. Keyboard/reduced-motion styles are implemented. This is not a complete accessibility certification. |
| Screenshots | `docs/screenshots/` contains marketing desktop/mobile, three Gujarati themes, editor, checkout, public RSVP success, and responses. Review artifacts are generated from synthetic data. |
| Runtime dependency audit | `pnpm audit --prod --json` reports zero known advisories. An esbuild transitive override removes the outdated version. shadcn CLI is a build-time dependency; its currently unpatched `braces` advisory concerns CLI glob parsing, not the deployed runtime. Do not feed untrusted glob patterns to build tooling. |
| Neon migration | Direct-endpoint migration succeeded against the supplied empty Neon database; follow-up read verified 21 public tables. No provider account/environment/backup configuration was inferred from connection success. |
| Operational access | `/api/health` returned 200; unauthenticated `/api/jobs` and `/api/ops` returned 401. External alert delivery and scheduled invocation remain unverified. |
| Performance | Published details fixture: median LCP **1.480 seconds**, CLS **0.0010**, and total transfer **428,968 bytes** including the navigation response. Three cold mobile runs use 4x CPU, 150ms network latency, 1.6Mbps down. This meets the local 2.5s / 0.1 / 500KB targets. Reproduce with `node scripts/performance.mjs` after the browser journey; raw results are in `docs/evidence/performance.json`. These are synthetic measurements, not field INP or production-region latency. |

## Fixes driven by verification

- Corrected initial foreign-key migration ordering and local database encoding to UTF-8; Gujarati round trips now pass.
- Darkened muted text after axe found a contrast failure on tinted paper.
- Serialized editor navigation during pending autosaves.
- Preserved private RSVP capability across React development effect replay while removing it from the visible URL.
- Required the magic-link plugin's JSON session result before redirecting, so a followed failure redirect cannot masquerade as successful verification.
- Preserved historical RSVP event counts when a guest edits active events.
- Reserved photo quota transactionally, retained removed revision photos, and serialized cleanup against saves.
- Prevented image workers from restoring objects after lifecycle purge.
- Suspended reversal-related entitlement separately from original hosting timestamps; replayed captures cannot reactivate it.
- Added server-only import boundaries and startup validation, protected operational metrics, redacted error instrumentation, and a CI verification workflow.

## Release limitations

The application is not deployed. The workflow is committed but has not run on GitHub. External email delivery, private S3/R2 permissions, real Razorpay capture/reversal, production origins/CSP enforcement, scheduler capacity, alert delivery, role restrictions, backup retention and restore, five-minute production-like concurrency testing, physical iPhone/Android/WhatsApp behavior, QR scanning, and social scraper caching remain unverified.

Gujarati fixed UI copy is implemented with content fallback; it still needs native editorial review. Final merchant identity, support contact, price/tax/refund/retention policy wording, and incident ownership must be finalized before launch. On-demand exports support up to 10,000 family responses and explicitly request support beyond that limit rather than silently generating a partial file.

The initial local setup had provider placeholders. Test runners preserve user environment files and force local adapters. Startup in production requires complete HTTPS/live-provider configuration, preventing a simulated checkout from being mistaken for a live purchase.

## Ceremony animation and Nodemailer update

The production build and repository lint pass. All 45 unit/database tests pass against the isolated local database. SMTP tests cover STARTTLS versus port 465, transport reuse, Unicode messages, stable retry IDs, missing credentials, rejected recipients, and redaction of provider failures. Real SMTP delivery remains unverified because SMTP credentials are not configured.

The ceremony browser check covers Haldi, Mehendi, Sangeet, and the wedding baraat/varmala sequence in all three themes. It verifies running motion, pause/resume, mobile overflow, Gujarati labels, keyboard navigation, reduced motion, and axe accessibility on the ceremony screen. Review images are saved as `docs/screenshots/{theme}-{ceremony}-animated.png`, including a separate varmala frame and a mobile reduced-motion capture. Motion uses SVG transforms/opacity and CSS keyframes; offscreen ceremony artwork pauses automatically. Custom titles can select an explicit animation, while older invitation content is inferred from English/Gujarati event names.

All five Playwright tests pass against the updated production build, including persistence of the selected wedding animation through reload, local publication, RSVP/edit/export, republishing, and magic-link lifecycle checks.


## Full-screen invitation update ? 7 October 2026

Production build (including TypeScript) and repository ESLint pass. Three focused Playwright tests pass against the production server: all ceremony themes and pause/reduced-motion behavior; viewport framing at 320?740, 844?390, and 1920?1080 with working details navigation; and the existing marketing/theme/Gujarati/mobile accessibility journey. The 390px ceremony screen passes axe WCAG 2 A/AA and 2.1 AA. The production ceremony test reports no page errors or hydration console errors. An initial development check hit a Next.js HMR/router initialization error; the clean production run passed.

Screenshots named `fullscreen-*` and `*-fullscreen-cover.png` capture viewport composition. The foreground flowers, hanging lights, and petals are original SVG/CSS layers, with pause controls and offscreen suspension. Screenshots were inspected for ceremony visibility and text/control placement. Browser automation covers Chromium emulation; physical-device motion feel has not been tested.

The requested reference at https://vidisha-siddharth.wedding was reachable through HTTP and its public page/CSS/JavaScript assets were inspected. No interactive browser connection to the reference was available. The implementation follows the requested full-screen illustrated direction using this project's own artwork, without importing reference-site assets.


## Ceremony wardrobe and transitions ? 7 October 2026

Production build including TypeScript and lint for the changed components/tests pass. Five focused browser tests pass against the production build: ceremony/theme/pause/reduced-motion coverage, narrow/landscape framing, the existing marketing/Gujarati journey, all nine invitation screens with eight verified chapter animations, and the older-browser animation fallback on mobile. Keyboard and reduced-motion navigation bypass the full-screen movement. The test checks actual `chapter-arrive` browser animations, not just chapter state.

Rendered screenshots inspected: `sangeet-disco-outfits.png`, `sangeet-disco-mobile.png`, `baraat-brocade-outfit.png`, and the refreshed `fullscreen-sangeet.png`. Sangeet now has sequined jewel-tone clothing, a mirror ball, sweeping colored beams, speaker stacks, and glowing dance-floor tiles. Baraat has a gold sherwani, stole, pearls, and feathered turban. The desktop SVG edge is feathered directly with an alpha mask.

Chapter snapshots use the browser [View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition); browsers without it use a 280 ms opacity/transform entrance. No live email, payment, or external publishing was performed for this visual update.
