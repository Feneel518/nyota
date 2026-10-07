# Interactive Wedding Invitations — Product Requirements Document

Version: 1.1 · 6 October 2026 · Status: implementation-ready draft with proposed defaults

Implementation companion: [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md). Visual direction: [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). Release evidence: [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md).

Confirmed direction from the owner: Neon for the database, Better Auth for authentication, and a premium luxury interface developed using Emil design engineering, shadcn/ui, and frontend design guidance. Other vendor selections in the implementation plan are proposed defaults.

Source: the wedding invitation micro-SaaS concept supplied by Feneel. This document specifies the first release; it does not validate market demand or competitor pricing. “Wedding Adventure” is a working product name.

## 1. Product brief

**Promise:** Create a personalized wedding adventure and share it with guests through one link.

**Problem:** Couples want a memorable digital invitation that feels personal without commissioning a custom website. Guests need clear, current event information and a quick way to respond, including on modest phones and without navigating an interactive experience.

**Primary customer:** Indian couples organizing a wedding, initially focused on Gujarati- and English-speaking families in Valsad, Vapi, and Surat. Photographers, planners, and invitation designers are potential referral partners; they do not need a partner portal in this release.

**Guest users:** Friends and family with varied ages, languages, devices, and comfort with technology. Guests do not create accounts.

**First-release outcome:** A couple can choose a theme, enter wedding details, personalize and preview an invitation, pay once, publish it, share a stable link and QR code, edit it later, and privately review RSVPs.

**Product constraint:** Customize content and approved presets within one reusable adventure. Do not build a general website editor or bespoke game for each wedding.

## 2. Decisions and assumptions

These defaults resolve gaps in the concept so implementation can begin. They are proposed product decisions, not previously confirmed user preferences.

| Area | First-release decision |
| --- | --- |
| Experience | One Wedding Adventure with five reusable scenes and no required game completion |
| Visual selection | Three coordinated themes: Royal Maroon, Marigold, and Garden Ivory |
| Languages | English, Gujarati, or both; bilingual support is included in the base plan |
| Monetization | One proposed ₹1,999 one-time plan per wedding with six calendar months of public hosting |
| Premium offerings | Signature tier, assisted-setup checkout, custom domains, renewals, and referral payouts are deferred |
| Owner access | One authenticated owner per wedding; an owner can create multiple weddings and pays separately for each |
| Authentication | Better Auth running in the application, with email magic links and users/sessions persisted in Neon; no custom password system |
| Database | Neon Postgres, with Drizzle schema and migrations |
| Interface | Premium Indian invitation atelier direction; shadcn/ui primitives, custom design tokens, and restrained motion |
| Publication | Payment automatically publishes the validated version reviewed at checkout |
| Editing | Changes save to a draft; the owner explicitly publishes updates to the live invitation |
| Guest privacy | Published invitations are accessible to anyone with the link and excluded from search indexing |
| Hosting expiry | Six calendar months after first successful publication, with the exact date visible before payment |
| Time zone | Asia/Kolkata for this release; every event has a local date, time, and displayed time zone |

The source proposed bilingual presentation as a premium benefit while also describing it as core launch scope. This PRD includes it in the base plan to keep the first release focused. Prices are hypotheses to test, not validated willingness to pay.

## 3. Success measures

Targets below are initial validation goals, not forecasts. Report sample sizes alongside percentages.

| Measure | Definition and initial target |
| --- | --- |
| Paid validation | Five paid pilot weddings within the first month after the pilot is ready |
| Self-service usability | At least four of five observed couples reach a personalized preview in 15 minutes, with prepared details and photos |
| Guest utility | At least nine of ten test guests find venue directions within 30 seconds without completing the adventure |
| Publishing reliability | Every verified paid pilot order produces one live invitation or a visible, recoverable publishing error |
| Mobile usability | Complete the guest journey and RSVP on the agreed Android and iPhone test matrix without blocking defects |
| Support burden | Record setup/support minutes per wedding and the reason help was needed |
| Business funnel | Measure demo → draft → preview → checkout → paid → published; establish a baseline before setting conversion targets |

Invitation opens, submitted responses, and confirmed people are separate metrics. Page views are not attendance confirmations.

## 4. Scope boundaries

**Included:** Marketing page, working fictional demo, owner authentication, saved drafts, setup wizard, live preview, three themes, preset character personalization, photo upload, optional preset music, editable events, English/Gujarati copy, payment, automatic publishing, stable URLs, WhatsApp sharing, QR download, RSVP, response dashboard, CSV export, and hosting expiry.

**Excluded:** Drag-and-drop editing, user-written code, AI-generated custom art, per-couple game mechanics, multiplayer, free movement/physics, guest login, seating plans, gifts or payments from guests, invitation delivery campaigns, automated WhatsApp messages, partner dashboards, commissions, multi-owner collaboration, custom domains, additional adventure templates, downloadable keepsakes, and automatic translation.

No production launch depends on the deferred Signature tier or a full administrative console.

## 5. Main journeys and screens

### Couple journey

1. Open the marketing page, understand the offer and hosting period, and try the fictional demo without signing in.
2. Select “Create your invitation,” authenticate, and create a wedding draft.
3. Complete a resumable wizard: couple and families → functions and venues → appearance and languages → preview and review.
4. Preview the actual guest renderer, including mobile layout and the direct details page. Incomplete drafts show placeholders; publishing requires valid details.
5. Review the frozen invitation version, proposed URL, amount, hosting dates, and expiry behavior; complete payment.
6. Receive a publishing status and, when successful, the public URL, copy/share controls, and a downloadable QR code.
7. Return to edit drafts, publish updates, review RSVPs, or export responses.

### Guest journey

1. Open `/w/{slug}` from WhatsApp, a browser, or a QR code.
2. Immediately see the couple’s names and equally clear “Explore our wedding” and “View invitation details” choices.
3. Explore a short, optional adventure or jump straight to events, directions, contact details, and RSVP.
4. Submit a family response and receive confirmation with a private response-edit link.

### Required routes

| Route | Purpose |
| --- | --- |
| `/` | Product proposition, demo, proposed pricing, FAQs, create action |
| `/demo` | Fully functional fictional invitation; no real RSVP writes or checkout |
| `/sign-in` | Authentication and return to the intended owner screen |
| `/dashboard` | Owner’s wedding drafts, live invitations, hosting dates, and responses |
| `/dashboard/weddings/{id}/edit` | Wizard, save status, validation, and preview |
| `/dashboard/weddings/{id}/checkout` | Order review and payment status |
| `/dashboard/weddings/{id}/responses` | Private response list, event totals, and CSV export |
| `/w/{slug}` | Public invitation and adventure entry |
| `/w/{slug}/details` | Lightweight event details and RSVP |

Owner preview must be authenticated and private. Use the fictional demo for unrestricted previews.

## 6. Functional requirements and acceptance criteria

### R1. Draft creation and persistence

- Each wedding belongs to the authenticated owner. All owner reads and writes enforce ownership on the server.
- Autosave after edits, show Saving/Saved/Failed states, and provide retry. Do not indicate success before persistence succeeds.
- Reloading restores saved content. Warn before leaving with unsaved changes following a save failure.
- Reject stale updates using a revision/version check; show a refresh/retry message instead of silently overwriting another tab’s work.

**Accepted when:** A couple can create, partially complete, leave, and resume a draft; another owner cannot read, change, preview, or export it through guessed IDs.

### R2. Wedding details and event editing

- Required for publishing: two display names, enabled/default languages, one designated main wedding event, and at least one complete event.
- Optional: family names, welcome message, invitation wording, couple photos, and up to two host contacts explicitly marked for public display.
- Support 1–10 events with preset labels such as Haldi, Sangeet, Wedding, Reception, and a custom label. No ritual is mandatory beyond the owner-designated main event.
- Each event contains a stable ID, title, start date/time, optional end date/time, venue name, address, optional HTTPS directions link, optional notes, and display order.
- Validate that end time follows start time, required text is nonblank, and links are safe. Show past-date warnings without blocking legitimate corrections.
- Allow reordering and archiving events. Once published, retain event IDs and historical response references; an archived event is hidden publicly and labeled in exports.
- Suggested limits: names 80 characters, event titles 100, venue names 150, addresses 500, welcome/notes 1,000. All text is Unicode plain text with visible limits.

**Accepted when:** Editing a live wedding’s venue and publishing updates changes both its details page and adventure at the same public URL; no response becomes orphaned when an event is archived.

### R3. Personalization and assets

- Offer the three named themes as complete, coordinated palettes and illustration sets; no arbitrary color editor.
- Each partner independently selects from at least four preset character appearances and three outfit presets. Do not force gendered roles or pairings.
- Allow up to five JPEG, PNG, or WebP photos, maximum 10 MB each. Validate actual file content, normalize orientation, remove metadata, and create optimized display variants.
- Provide usable illustrated fallbacks when no photos are uploaded or an image fails to load.
- Offer None plus two properly licensed music tracks. Sound is off on entry, starts only after a guest action, and has a persistent toggle.
- Use original or appropriately licensed illustrations, characters, fonts, and audio. Keep an asset-license inventory; do not copy reference-site artwork.

**Accepted when:** Every theme and preset works with long names, no photos, Gujarati text, and reduced motion. Invalid uploads receive useful errors without losing draft content.

### R4. Reusable adventure

The interaction is a lightweight, scene-based sequence, not a platform game:

| Scene | Guest action and content |
| --- | --- |
| Welcome | See personalized names; choose Explore or Details |
| Meet the couple | See the configured characters and optional photo/message; tap Continue |
| Journey | Advance a short illustrated procession or route with a tap; reduced-motion mode uses a static transition |
| Celebrations | Browse cards generated from the owner’s active events, with details and directions |
| Invitation finale | See the main wedding invitation, RSVP action, share action, and discreet product attribution |

- Every scene has Details and skip/next navigation. The guest can go back; there are no scores, timers, unlocks, or precision gestures.
- The experience must remain understandable without animation, sound, or photos.
- Lazy-load adventure assets so public details are readable before those assets finish loading. A failed adventure load offers direct access to details.

**Accepted when:** All supported event counts render through the same engine, and guests can reach details/RSVP from every scene without completing the sequence.

### R5. English and Gujarati

- Ship reviewed translations for fixed public and owner-facing UI labels; user-entered wedding content has separate English and Gujarati fields.
- Let the owner enable either language or both and choose the default. Show the public language switch only when both are enabled.
- Require event/content fields in the default language; missing translations fall back to that content. Explain fallback in the editor and show untranslated fields for review.
- Do not claim automatic translation. Preserve names and numerals accurately, and use fonts that render Gujarati correctly.
- Remember guest language for the browsing session and update date formatting when it changes.

**Accepted when:** Gujarati text renders without broken glyphs, mixed-language content has predictable fallback, and both language modes expose all critical actions.

### R6. Free preview, payment, and publishing

- Draft creation and private personalized preview are free; preview cannot create real RSVPs or public links.
- The initial proposed price is ₹1,999 per wedding, configured server-side. The final total and any applicable charge breakdown must be clear before checkout; commercial/tax treatment is a launch configuration decision.
- Create an order tied to owner, wedding, immutable content revision, currency, server-calculated amount, and hosting term. A client cannot supply the authoritative price or paid status.
- At checkout freeze the validated revision. Later edits remain draft changes and do not alter the paid publication snapshot.
- Verify payment server-side using the provider’s authenticated mechanism and match its order, amount, currency, and success/capture status. Browser redirects alone do not authorize publication.
- Handle repeated and out-of-order provider events idempotently. Reconcile successful payments when callbacks are delayed; show a pending state while verification is incomplete.
- Publish only once after verified payment. If publication fails, keep payment recorded and allow safe retry without charging again.
- Cancelled/failed payments preserve the draft. Prevent parallel duplicate orders from causing duplicate entitlements; flag any duplicate captured payment for support resolution.
- First successful publication establishes the hosting start and expiry. Before checkout show expected dates; if publication is delayed, grant the full term from actual publication.

**Accepted when:** Successful payment publishes the reviewed revision; failed payment and forged browser success do not. Duplicate callbacks, callback-before-redirect, redirect-before-callback, and publish retries do not cause duplicate publication or a second charge.

### R7. Stable links, publication updates, and sharing

- Generate a unique, readable slug and allow editing before first checkout. Reserve it for the order; uniqueness is enforced by the database. Lock it after first publication.
- “Publish updates” atomically replaces the public content revision after validation. Autosaved or invalid drafts never leak into the live invitation.
- Provide Copy link, an explicit WhatsApp share action, native sharing when supported, and a downloadable PNG QR code encoding the permanent public URL.
- Serve public social metadata and a 1200 × 630 preview image containing the couple’s names and main wedding date. Photo inclusion is optional; RSVP or contact data is never in the preview.
- Update metadata on publication changes, while explaining that external apps may cache an earlier preview.
- Sharing opens the guest/owner’s chosen application; the product never automatically sends messages or uploads address books.

**Accepted when:** The QR decodes to the correct URL; a unique slug cannot be taken by another wedding; published edits preserve the URL; metadata is available to link-preview crawlers without client rendering.

### R8. RSVP

- RSVP is available on the details page and finale without guest login.
- Collect family/group name, overall Attending/Not attending status, and, for attending groups, selected events with a separate headcount of 1–20 for each event. No phone/email is required.
- Require at least one event for attending responses. A decline stores zero attendees and no selected events. A phone/contact field is out of scope.
- Allow an optional plain-text note up to 500 characters. Explain that only the couple can see responses.
- On success provide a private, unguessable edit link and retain it on that device. Store a hash of its token; never include tokens in analytics, exports, or public lists.
- A token holder may edit only that response until invitation expiry. Without the token, a returning guest cannot retrieve a response by guessing a family name. Cross-device duplicate detection is not guaranteed.
- Make retrying the same submission idempotent. Rate-limit submissions and edits; add basic automated-spam controls with accessible error handling.
- For later-added events, existing families are “No response” until they choose them. Archived events retain historical counts separately.

**Accepted when:** Submitting, retrying, editing, declining, adding events, and archiving events produce correct per-event totals. Guests cannot enumerate or read other families’ responses.

### R9. Owner response dashboard

- Show response count, attending family count, declines, and confirmed people per active event, plus searchable response rows and CSV export.
- Do not sum event headcounts into a supposed unique guest count; the same people may attend multiple events.
- Show approximate invitation opens separately, labeled as approximate visits rather than unique guests. Do not imply crawler filtering is perfect.
- Allow owners to delete duplicate or unwanted responses with confirmation; do not silently merge similarly named families.
- CSV contains family name, status, event counts, note, submission/update timestamps, and archived-event labels. Escape spreadsheet formula prefixes safely and preserve Gujarati text.

**Accepted when:** Dashboard and export match the same saved responses, deletion updates totals, and downloads require owner authorization.

### R10. Expiry and lifecycle

- Use lifecycle states Draft → Payment pending → Published → Expired. A failed payment returns to an editable draft; publishing failure remains a recoverable paid order. Keep payment state separate from invitation state.
- Compute six calendar months in the wedding time zone, clamping to the last valid day where necessary. Display the expiry date/time in checkout, confirmation, and dashboard.
- At expiry, stop serving invitation content and accepting RSVP, including at direct details, metadata, and asset-delivery paths. Show a neutral expired page without names or venue information.
- The owner retains read/export access for a 30-day grace period. Show the scheduled deletion date. After that period delete wedding content, uploaded assets, and responses; retain only minimum financial records under the launch retention policy.
- Apply expiry checks on requests as well as scheduled cleanup so a delayed job cannot keep an invitation active. Public cache lifetimes must not extend beyond expiry; revoke or purge derived images and assets.
- Renewal and self-service refunds are out of scope. Launch needs a visible support route and a documented manual refund procedure; financial records must reflect provider refund events.

**Accepted when:** Boundary-time checks block new responses and public content at expiry, owner exports work during the grace period, and cleanup is safe to retry.

## 7. Experience and quality requirements

- Design for phones first: warm, celebratory, readable, and coherent across marketing, editor, and guest invitation. The three themes should feel intentionally art-directed rather than color swaps alone.
- Avoid mandatory splash screens, long intros, autoplay sound, or full-screen motion blocking useful content.
- Support 360 px mobile through desktop widths without horizontal scrolling. Use practical touch targets of at least 44 × 44 px for primary controls.
- Support keyboard navigation, visible focus, accessible labels, meaningful image alternatives, readable contrast, and reduced-motion preferences. Convey essential information outside illustrations.
- Verify current Chrome on Android, Safari on iPhone, desktop Chrome/Edge/Safari, and WhatsApp in-app browsers where devices are available. Record any untested device/browser combinations.
- Performance acceptance scenario: production build, cold cache, throttled mobile connection, four-times CPU slowdown. Target details-page LCP ≤2.5 seconds and CLS ≤0.1 across the median of three runs. Target initial compressed details transfer ≤500 KB; defer music and adventure art. Collect interaction latency in the pilot, targeting p75 INP ≤200 ms once sufficient real traffic exists.
- Essential public details render server-side. Directions remain normal links when client JavaScript fails; RSVP failure gives a retry path rather than a false confirmation.
- Show useful empty, saving, offline/network-error, payment-pending, upload-error, unavailable, and expired states. Every visible action must work or clearly explain its unavailable state.

## 8. Implementation outline

Neon and Better Auth are confirmed technology requirements. The companion implementation plan selects the remaining defaults. At implementation time, inspect the repository and current provider documentation before selecting package versions or writing integrations.

- One Next.js application using TypeScript for marketing, editor, owner dashboard, server endpoints, and all public invitations.
- Neon Postgres with Drizzle for durable data; private object storage for uploads and generated share images; Better Auth for verified email sign-in and session management.
- A reusable scene renderer consumes a validated invitation snapshot. Details and adventure read the same published revision to prevent inconsistent venues or dates.
- Keep payment, authentication, storage, and transactional email integrations behind narrow adapters. Select an Indian-payment-capable provider after checking merchant eligibility and supported payment methods; do not hardcode vendor assumptions into product logic.
- Use SVG/HTML/CSS and a lightweight animation library where useful. A full game engine is unnecessary for the specified interactions.
- Use protected server endpoints for order creation, publication, response exports, asset uploads, provider callbacks, and cleanup/reconciliation jobs.
- Local development must run without paid credentials: include fictional seeds and clearly labeled development adapters. Production must fail closed when real auth/payment/storage configuration is absent. Test payment controls must never authorize production publication.

### Minimum data model

| Entity | Essential data and constraints |
| --- | --- |
| User | Auth provider subject, verified email, timestamps |
| Wedding | Owner ID, unique slug, draft version, published revision ID, main event ID, languages, theme/presets, hosting dates, lifecycle |
| Event | Wedding ID, stable ID, localized text, start/end, time zone, venue/address/link, order, archived status |
| Invitation revision | Immutable validated content snapshot, referenced asset IDs, schema version, created timestamp |
| Asset | Owner/wedding ID, private storage key, media type, dimensions, processing state, license/source where relevant |
| Order/payment | Wedding/owner ID, revision ID, provider IDs, amount in paise, currency, hosting term, verification/refund state, idempotency keys |
| RSVP | Wedding ID, family name, attendance status, note, edit-token hash, submission idempotency key, timestamps |
| RSVP event response | RSVP ID + stable event ID, headcount; unique pair |
| Analytics event | Minimal event name, nonpersonal identifiers, timestamp; bounded retention |

Use migrations, foreign keys, transactions, server-side validation, and database uniqueness constraints. Do not rely solely on hidden UI controls for access restrictions.

## 9. Privacy, security, and operations

- Explain before publishing that anyone with the link can view the invitation, including any selected public host contacts. `noindex` is not access control; password-protected invitations are deferred.
- Drafts, source uploads, RSVPs, payments, and owner pages are private. Deliver only published media publicly through controlled URLs whose access/cache behavior respects expiry.
- Sanitize output, reject executable uploads and unsafe links, protect cookie-authenticated mutations against cross-site requests, and keep all provider secrets on the server.
- Exclude personal wedding text, response names/notes, access tokens, and raw payment payloads from product analytics and routine logs.
- Instrument `demo_opened`, `draft_created`, `preview_opened`, `checkout_started`, `payment_verified`, `invitation_published`, `invitation_opened`, `adventure_started`, `adventure_completed`, and `rsvp_submitted`. Avoid counting retries as new conversions.
- Monitor failed verification, paid-but-unpublished orders, asset failures, and cleanup failures. Provide an authenticated operator script or runbook for recovery; a full admin UI is unnecessary.
- Before production, configure backups and test restore, define a support contact, settle refund/privacy/retention wording, and verify production secrets and provider callbacks. These are launch dependencies, not blockers to building locally.

## 10. Delivery milestones

Deliver vertical slices with demonstrable completion, in this order. The original four-week idea is a planning hypothesis; estimate schedule after the first slice and asset review.

| Milestone | Demonstrable completion |
| --- | --- |
| 1. Guest experience | Fictional invitation with all five scenes, three themes, English/Gujarati, direct details, preset art, reduced motion, and mobile layouts |
| 2. Owner workflow | Authentication, persistence, uploads, wizard, validation, and private preview using the same guest renderer |
| 3. Paid publication | Server-verified test checkout, immutable revisions, stable URL, publish updates, QR, social metadata, and expiry enforcement |
| 4. Responses and readiness | RSVP/edit flow, private dashboard, exports, cleanup, monitoring, meaningful tests, and launch runbook |
| 5. Paid pilot | Production credentials and final assets configured; five weddings onboarded; observed setup friction and support effort recorded |

The pilot is a business validation activity after implementation, not something the coding agent can claim from software tests alone.

## 11. Verification and definition of done

Automate high-risk behavior; use manual review for visual quality and device-specific sharing.

| Area | Required verification |
| --- | --- |
| Authorization | Cross-owner read/write/upload/export attempts fail; public endpoints expose only published data |
| Payments | Invalid signatures, amount/order mismatch, duplicate/out-of-order callbacks, failed payment, reconciliation, and publication retry |
| Publication | Snapshot consistency, stale draft protection, slug collision, update without URL change, and asset/cache refresh |
| RSVP | Per-event counts, decline, repeated submit, token-scoped edits, unknown token, archiving, additions, deletion, and CSV injection protection |
| Lifecycle | Calendar-month calculation, month-end cases, expiry during submission, grace-period access, idempotent deletion |
| Guest experience | Direct details with slow/failed assets, keyboard/reduced motion, language fallback, long names, zero photos, and 1/10 events |
| End-to-end | Create wedding → preview → verified test payment → share → guest RSVP → owner export → publish venue update |

Implementation is done when all required journeys work with persisted data, acceptance criteria pass, relevant automated checks pass, mobile/accessibility/performance results are recorded, original/licensed assets are accounted for, and the README documents local setup, environment variables, migrations, seeds, tests, deployment, payment recovery, expiry, and cleanup.

Report local implementation complete separately from production launch ready. Missing provider credentials, unreviewed Gujarati copy, placeholder art, or untested in-app browsers must be identified explicitly; a simulated purchase is not a real paid launch.

## 12. Handoff to the implementation agent

Use this prompt with this file:

> Implement the product described in PRD.md in this repository. Treat its first-release scope and proposed defaults as the implementation baseline. Inspect existing files and repository instructions first, then build the milestones in order. Make routine technical choices autonomously, verify current integration documentation, and keep the app runnable locally with clearly labeled development adapters when credentials are unavailable. Complete real persistence, authorization, publishing, RSVP, and error handling; do not stop at a static mockup. Run the checks appropriate to each milestone, document setup and remaining production dependencies, and report what is working and what is unverified. Do not add deferred features. Do not claim a production launch or paid pilot without evidence.
