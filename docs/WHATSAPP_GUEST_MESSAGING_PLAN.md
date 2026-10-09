# Guest lists and WhatsApp reminders

Status: implementation plan; no messaging integration or live sends performed.
Date: 8 October 2026.

## Outcome and agreed decisions

Couples can manage the people invited to their wedding, communicate changed arrangements, and schedule reminders without manually messaging every household. Guests receive relevant event details and can stop updates easily.

- Sender: one shared Nyota WhatsApp Business number, as selected by the owner.
- Defaults: 10 days and 1 day before each selected event; 5 minutes before is optional.
- Proposed first release: Meta WhatsApp Cloud API, English and Gujarati, manual entry and CSV import, event-specific audiences, structured updates, delivery history, and a capped messaging allowance.
- Messages identify Nyota, the couple, and the event. They do not appear to come from the couple's personal number.
- Build in stages. Provider setup and template approval can proceed while the guest-management code is developed.

## Platform requirements and external dependencies

Recipients must opt in, and opt-outs must be respected. Scheduled business-initiated messages need approved templates; free-form replies are allowed within the 24-hour window following a guest's message. Importing contacts does not establish permission. These requirements come from the [WhatsApp Business Messaging Policy](https://whatsappbusiness.com/policy/).

Provision a Meta business portfolio/app, WhatsApp Business Account, registered Nyota sender number, display name, payment method, production credentials, webhook subscriptions, and any verification required by the account. Verify the account's actual messaging limits before sizing the launch. No fixed approval timeline is assumed.

Submit separate English and Gujarati templates for event details, reminders, time/venue changes, and cancellation. Request the appropriate category for each use case; do not assume every wedding message will qualify as utility. The approved category and current account/template status determine eligibility and cost. General invitation announcements may receive a different category from requested logistical updates.

Meta currently charges by delivered message, destination market, and category, with some free-message cases. Fetch current rates when setting prices; do not hard-code an INR estimate into this plan. See [official platform pricing](https://whatsappbusiness.com/products/platform-pricing/). Some developer reference pages were inaccessible during research; verify current Cloud API payloads, template buttons, signatures, and version support during the integration spike.

## User experience

### 1. Guests

Add a Guests tab to each wedding dashboard. One row represents one contact/household, not every person counted in an RSVP.

Fields: name, WhatsApp number with country code, preferred language, optional family/group label, and invited events. Show subscription and RSVP states separately. One family can have five attendees but receive one message.

Support manual entry and CSV upload with a downloadable example. Preview validation errors, event mappings, duplicate numbers, and updates before committing. Normalize to E.164 using a maintained phone-number library; default the input country to India without silently rewriting international numbers. Deduplicate within a wedding, not across all owners. Reimports must never restore revoked consent or overwrite RSVP answers.

Suggested initial limits: 500 contacts per wedding and 1 MB CSV uploads, configurable server-side. Confirm the capacity with a load test before increasing it. Excel users can export CSV; native XLSX import is a later enhancement.

### 2. Guest permission and identity

On the public invitation/RSVP flow, offer an optional “Get this wedding's updates on WhatsApp” action. Explain that Nyota sends event details and scheduled reminders; optional last-minute alerts have their own preference. RSVP remains usable without subscribing.

The preferred confirmation flow is guest-initiated WhatsApp:

1. Guest selects language/events and sees the consent wording.
2. Server issues a short-lived, one-use opaque enrollment code bound to that wedding and the selected preferences.
3. A button opens a prefilled message to Nyota: “Subscribe me to [couple]'s wedding updates. Code: […]”. The guest sends it.
4. The verified inbound webhook supplies the actual sender number. Consume the code and record the consent wording/version, time, scope, and inbound message ID.
5. Match the verified number to that wedding's imported contact. If unmatched, create a pending contact for the owner's review; do not give it access to private guest records or restricted audiences automatically.

Merely opening WhatsApp, clicking the button, or entering someone else's number does not activate a subscription. A shared invitation link cannot authorize messages to another phone. The couple can distribute the initial public invitation manually using the existing Share flow; Nyota does not send a cold opt-in request to every uploaded number.

Support a wedding-specific unsubscribe button/preference page. Generic STOP/UNSUBSCRIBE, including supported Gujarati equivalents, suppresses the number across the shared Nyota sender. Fresh, explicit guest confirmation is required to resubscribe. Process other opt-out requests through Nyota support. Do not expose other weddings associated with the same number to an owner.

Link RSVPs to contacts only through a verified enrollment/response relationship or an explicit owner-reviewed association. Do not match by name alone, and keep existing anonymous RSVPs working.

### 3. Messages and reminders

Add a Messages & Reminders tab with event selection, enabled offsets, language previews, recipient counts, estimated cost, and a single activation action. Defaults are selected in the form; nothing sends until the owner activates the schedule.

| Message | Default audience | Contents |
| --- | --- | --- |
| Event details | Subscribed contacts invited to the selected events | Couple, event date/time, venue, invitation link |
| 10-day reminder | Subscribed invited contacts, excluding declines | Event summary and RSVP/details link |
| 1-day reminder | Subscribed invited contacts, excluding declines | Date/time, address, directions/details link |
| 5-minute reminder | Confirmed attendees with last-minute alerts enabled | Event name, absolute start time, venue |
| Time/venue update | Subscribed affected invitees, excluding declines | Clearly labelled changed fields and current details |
| Cancellation | Subscribed affected invitees previously notified, excluding declines | Cancellation and current invitation link |

“All guests” means all eligible subscribed contacts in the wedding, never the entire uploaded list regardless of permission. Show excluded counts and reasons. Event-specific RSVP declines remove that contact from that event's reminder audience.

Allow an owner to review an update after publishing changed event details, select affected events, preview each language, inspect eligible recipients/cost, and choose Send now or a future time. This creates an auditable campaign. Do not broadcast on every draft save. Version one uses structured approved templates, not an unrestricted bulk text composer.

Display queued, accepted by WhatsApp, delivered, read when reported, failed, suppressed, canceled, and expired states. API acceptance is not delivery; a missing read receipt is not failure. Provide actionable errors and a safe retry action for definite failures.

Example template draft, subject to approval:

> Nyota — Feneel & Dharmi's wedding update. Hello {{guest_name}}, {{event_name}} is on {{date}} at {{time}} IST, at {{venue}}. View the latest invitation and directions below. You subscribed to updates for this wedding.

Use supported template buttons for details and unsubscribe. For “starting soon,” include the absolute start time rather than promising it is exactly five minutes away when the phone receives it. A guest's device can be offline.

## Scheduling rules

- Preserve the application's current India time model: interpret published local event dates using `Asia/Kolkata`, store due times as UTC timestamps, and label the UI IST. Never use the worker host timezone. International event timezones are outside the first release.
- Proposed day-based semantics: send at 10:00 IST on the calendar date 10 days or 1 day before the event. Display this exact schedule to the owner. Five-minute reminders use event start minus five minutes.
- Only schedule future occurrences. Enabling reminders or subscribing late does not backfill earlier offsets.
- A background materializer reads the latest published revision, not draft content. Every message carries a schedule generation and relevant event fingerprint.
- Published start-time changes cancel unsent old occurrences and generate future replacements. Cosmetic edits must not recreate already-sent reminders. Previously sent offsets are not repeated automatically; use the explicit update campaign to communicate the change.
- Archiving an event, canceling a schedule, removing a contact, withdrawing consent, declining attendance, or suspending/expiring the invitation cancels or suppresses affected unsent work. Cancellation notices are separate explicit campaigns.
- Immediately before submission, recheck lifecycle, consent, event membership, RSVP, template availability, schedule generation, and allowance. Use a shared locking/version strategy for worker claims and changes. A message already submitted to the provider cannot be recalled; show that boundary in the UI.
- Suppress late five-minute reminders at event start. Proposed ordinary-reminder expiry: two hours after the planned time, always before event start. Do not release a backlog of stale messages after an outage.
- Ordinary updates observe 09:00–20:00 IST sending hours. Out-of-hours last-minute reminders require the guest's explicit last-minute preference and a visible owner warning when scheduling.

## Fit with the current codebase

The app already has PostgreSQL/Drizzle, immutable invitation revisions, owner authorization, family/event RSVPs, publication hooks, idempotency records, and a leased outbox. Reuse those foundations.

Important gaps found during inspection:

- `src/server/db/schema.ts`: RSVP records have no guest phone, subscription, or contact linkage. Add contacts separately instead of treating RSVPs as the address book.
- Event start/venue data lives in revision content; the `events` table mainly supplies stable event IDs and titles. Schedule against the published revision.
- `src/server/jobs.ts`: jobs use leases and retries, but the worker processes serially. `/api/jobs` claims only five jobs per invocation and also runs maintenance. At one invocation per minute, 500 sends would take at least 100 minutes if one job meant one send.
- `src/lib/content.ts` and `src/lib/domain.ts` already use India time conventions. Centralize conversion for scheduling.
- `publishUpdates` in `src/server/weddings.ts` is the reconciliation hook; first publication happens in `src/server/jobs.ts`.
- Existing Share uses `wa.me`, which hands a message to the user's app. Automated delivery needs a server API integration.

### Data additions

| Model | Minimum purpose and invariants |
| --- | --- |
| `guest_contacts` | Wedding, name, normalized number, language, group, optional verified RSVP association; unique wedding/number |
| `guest_event_invites` | Contact/event membership with composite wedding foreign keys to prevent cross-wedding links |
| `whatsapp_enrollments` | Hashed one-use enrollment tokens, scope, expiry, consumed timestamp |
| `whatsapp_subscriptions` and consent history | Contact/wedding scope, allowed message kinds, status, evidence, version; preserve withdrawal history |
| `whatsapp_suppressions` | Global shared-sender opt-out keyed by a protected number lookup; inaccessible to other owners |
| `reminder_rules` | Wedding/event, offsets, local send time, generation, enabled status |
| `message_campaigns` | Actor, message kind, event/revision scope, template/language mapping, reviewed audience, scheduled time, status |
| `whatsapp_messages` | Recipient, occurrence key, due/expiry times, payload version, provider ID, attempts, state and timestamps; unique logical occurrence |
| `whatsapp_webhook_events` | Deduplicated inbound/status events with processing status; separate namespace from payment webhooks |
| `messaging_usage` | Atomic allowance reservations, releases, delivered usage, and reconciliation references |

Encrypt recoverable phone numbers at rest with managed server keys; use a keyed lookup digest for matching. Mask phone numbers in routine views/logs. Jobs carry IDs, not full contact lists. Keep guest data out of public invitation JSON and social preview images.

Extend wedding purge/expiry handling to cancel work and remove guest/message personal data. Suggested default: retain delivery details through the existing wedding purge date; retain only minimal consent/suppression evidence under a documented privacy/retention policy. Update the public privacy notice before launch.

### Services and endpoints

Proposed modules: `src/server/guests.ts`, `src/server/whatsapp.ts` (local and Cloud API adapters), `src/server/messaging.ts` (campaigns/eligibility), and `src/server/reminders.ts` (pure schedule calculation and reconciliation).

Owner routes under `/api/weddings/[id]/guests`, `/messages`, and `/reminders` use the existing owner authorization, origin checks, bounded bodies, rate limiting, and idempotency pattern. Add dashboard pages at `/dashboard/[id]/guests` and `/dashboard/[id]/messages`.

Add an enrollment endpoint under `/api/public/[slug]/whatsapp` with opaque tokens and abuse controls. Add `/api/webhooks/whatsapp` for provider verification and signature-verified POSTs, durable deduplication, and asynchronous processing. Webhooks must not use browser origin checks as their authentication mechanism.

Use a fixed Nyota template-button URL such as `https://www.nyotaa.app/w/{{slug}}` if required by template review, rather than depending on arbitrary per-couple subdomain prefixes. Validate link targets server-side. Preserve per-wedding preference/RSVP access through separate scoped tokens, never expose existing RSVP edit secrets in bulk templates.

Before writing Next.js route code, read the relevant installed guides under `node_modules/next/dist/docs/` as required by `AGENTS.md`.

## Delivery architecture and reliability

Use the database as the durable source of scheduled work. Introduce a dedicated supervised messaging worker with bounded concurrency and fair scheduling across weddings. Separate messaging from publication, billing, media, and retention queues so bulk sends cannot starve those jobs. Poll due work every 10–15 seconds; use a minute scheduler for reconciliation and recovery. Hosting for this worker is a new deployment dependency.

Keep the existing short-transaction claim/lease pattern, add lease renewal where needed, and perform network calls outside long database transactions. Match concurrency to observed Meta account and recipient limits; back off on throttling. Configure request timeouts shorter than leases.

Use unique business occurrence keys to prevent duplicate scheduling and persist provider message IDs. Retry only definite retryable rejections/failures with bounded exponential backoff and message expiry. A timeout after possible provider acceptance is `unknown`, not an automatic retry: reconcile through callbacks/correlation where supported, or surface it for review. Do not promise exactly-once provider delivery.

Persist webhook events before acknowledging, process duplicates safely, and tolerate out-of-order status updates without regressing a delivered/read message to sent. Treat sent/delivered/read timestamps separately from latest errors. Resolve any webhook-before-send-record race using stored correlation or a pending event reconciler.

Feature flags: guest management, WhatsApp sends, and last-minute reminders. Provide per-wedding pause and global kill switches. Sender/template suspension should pause sends and alert an operator; it must not generate retries indefinitely.

Target for the pilot: at least 99% of eligible scheduled messages submitted within 60 seconds of due time under tested load; track device delivery separately. Load-test 500 recipients due together plus concurrent weddings against a simulated rate-limited provider, then measure a small authorized real pilot. Enable five-minute reminders only after this target and expiry behavior are demonstrated.

## Costs and commercial controls

Treat WhatsApp as a metered add-on or capped allowance, separate from unlimited invitation sharing. Exact bundle pricing is a business decision after template categories, account limits, and current rates are known.

Example volume: 300 subscribed contacts invited to 3 events, with 2 reminders each, creates up to 1,800 messages before updates. Five-minute reminders to all 300 for all 3 events could add 900 more; actual eligible attendance will reduce this.

Show eligible count, message count, and estimated spend before activation/sending. Reserve allowance atomically so concurrent campaigns cannot overspend; reconcile reservations against actual provider outcomes and billing. Distinguish Nyota credits from Meta's actual charges. Do not change the existing one-purchase-per-wedding order flow until the add-on purchase model is specified; start the pilot with an operator-assigned fixed allowance.

## Implementation sequence and acceptance

| Stage | Deliverable | Exit criteria |
| --- | --- | --- |
| 1. Provider spike | Test sender, adapter, webhook, sample EN/GU templates, current rate/category record | Verified inbound message and delivery callback using explicitly authorized test recipients; account/template prerequisites recorded |
| 2. Guest management | Migrations, owner APIs, Guests screen, CSV preview/import, event assignment | Duplicate/reimport handling, international formats, tenant isolation, bounded uploads, and anonymous RSVP compatibility verified |
| 3. Consent and controlled updates | Enrollment, preferences, global STOP, structured campaigns, delivery history | Imported-but-unsubscribed guests excluded; replay/forged enrollment blocked; opt-out suppresses queued work; unknown sends not blindly retried |
| 4. Scheduled reminders | Published-event reconciliation, dedicated worker, default 10-day/1-day rules | Clock-controlled tests for late enrollment, edits, declines, archival, expiry, duplicate workers, outage recovery, and exhausted allowance |
| 5. Last-minute pilot | Optional five-minute rule, monitoring, alerting, support runbook | Capacity target met; no sends at/after start; pause/kill switch tested; real device behavior observed with consent |
| 6. Release | Privacy wording, retention, monitoring, pricing/limits, staged rollout | Approved templates, funded sender, tested worker deployment, rehearsed migration, and documented rollback |

Testing should include signed and invalid webhook requests, repeated/out-of-order events, provider throttling, ambiguous network outcomes, cross-owner authorization, CSV formula-safe export, and concurrent activation/reconciliation. Use local adapter fixtures and synthetic guests for automated tests; never send to real imported lists during development.

Track opt-in conversion, eligible dispatch lateness, provider acceptance/delivery rates, failures by actionable code, opt-outs, cost per wedding, and queue age. Do not count read receipts as universally available or equate message volume with success.

Roll out behind flags to one internal wedding, then a few consenting pilot couples, then broader availability. Rollback disables dispatch and keeps unsent jobs canceled/paused; disabling a UI flag alone is insufficient.

## Remaining launch decisions

The sender model and reminder defaults are settled. Remaining operational decisions are the Nyota sender number/Meta account, worker hosting, approved template categories, final allowance pricing, and support ownership. None prevents building guest management or the local messaging adapter now. This plan does not provision paid services, send invitations, or change production.
