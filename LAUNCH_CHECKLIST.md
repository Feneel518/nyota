# Wedding Adventure — Launch Evidence Checklist

Status: implemented and locally verified; public launch pending · 6 October 2026

Checked items have local evidence described below and in [docs/VERIFICATION.md](docs/VERIFICATION.md). Unchecked items require further or external verification. Local provider simulations do not satisfy live payment, delivery, storage, or deployment checks.

## Product and design

- [x] Complete couple journey persists across sessions. Local production-build browser journey includes reload/resume, publish, RSVP, export, and republish.
- [ ] All five scenes, three themes, avatar/outfit choices, and licensed audio work.
- [ ] English and Gujarati UI/content fallback reviewed; native-language review recorded.
- [x] Final art, fonts, and music have a license/source inventory. See `docs/ASSETS.md` and bundled font notices.
- [x] Mobile/desktop screenshots demonstrate the intended premium design. See `docs/screenshots/`.
- [ ] Long names, no photos, 1/10 events, loading, empty, and error states reviewed.
- [ ] Keyboard, focus, contrast, reduced motion, and large text checks pass.
- [ ] Pricing, six-month hosting, exact expiry, grace period, and public-link visibility are clear.

## Identity and data

- [ ] Neon production, staging, development, and CI isolation verified.
- [x] Better Auth magic links, expiry, single use, safe return-path validation, sessions, and logout verified in local domain/browser tests. Real email delivery remains separate.
- [ ] Email domain verified and real delivery tested; rate limits work across instances.
- [ ] Cross-owner API, preview, uploads, responses, and export attempts fail.
- [ ] Migration SQL reviewed and rehearsed; runtime credentials have appropriate scope.
- [x] Concurrent autosaves, publication, RSVP, and upload quotas preserve invariants in local PostgreSQL integration tests.
- [ ] Secrets excluded from source, client bundles, logs, and telemetry.

## Payments and publishing

- [ ] Merchant activated; real price and commercial terms finalized.
- [x] Server order/signature/capture checks pass; browser success cannot publish. Contract and database tests cover mismatches and replay; live Razorpay verification remains pending.
- [ ] Duplicate/out-of-order events and missing redirects are handled safely.
- [ ] Paid-but-unpublished recovery and duplicate capture runbooks rehearsed.
- [x] Publication preserves the reviewed snapshot, slug, and full hosting term in integration tests.
- [x] Publishing edits uses the shared published revision; venue republishing verified in the browser. External preview cache refresh remains outside app control.
- [ ] Refund/dispute handling records payment state and an explicit entitlement decision.
- [ ] QR scans, copy link, WhatsApp share, and social previews verified.

## Responses and lifecycle

- [x] RSVP submit/retry/edit and validation tests pass with correct per-event counts; owner/guest browser journey passes.
- [ ] Capability links remain private; guests cannot enumerate responses.
- [ ] Archived/added events and stale guest forms behave correctly.
- [ ] Owner search, pagination, delete, and safe Gujarati CSV export verified.
- [ ] Expiry blocks pages, metadata, media, RSVP, and updates at the boundary.
- [x] Owner export grace period, asset cleanup, and data deletion verified against local PostgreSQL and local object storage. Real bucket deletion remains pending.
- [ ] Abandoned draft and financial-record retention policies finalized.
- [ ] External preview caching/download limitations are accurately disclosed.

## Operations and release

- [ ] Production build, types, tests, and dependency/security review pass.
- [ ] Throttled performance budgets and realistic load tests have recorded results.
- [ ] Android/iPhone and WhatsApp tests are recorded; unavailable combinations listed.
- [x] Protected job route, retry/backoff implementation, idempotent fulfillment, and expired-lease recovery tested locally; deployed scheduler cadence remains pending.
- [ ] CSP and other headers allow necessary integrations without broad exceptions.
- [ ] Error reporting, redaction, health checks, and actionable alerts verified.
- [ ] Backup retention configured; restore drill and post-restore payment reconciliation completed.
- [ ] App rollback, forward migration repair, and incident contacts documented.
- [ ] Final domain, production origins, sender, support, and policies configured.
- [ ] Production test adapters disabled; production seeds prevented.
- [ ] Authorized controlled live purchase and complete owner/guest journey verified.

## External input register

| Input | Current state | Evidence or next action |
| --- | --- | --- |
| Final brand/domain/support contact | Not selected | Use working brand locally; configure before launch |
| Neon project and region | Supplied connection verified and schema migrated | Database had no public tables before migration; 21 application/auth tables now present. Account isolation, role scope, backups, and region remain unverified |
| Hosting account and scheduler capacity | Not inspected | Verify production runtime and job cadence |
| Private storage | Local adapter verified; real bucket absent | Configure S3/R2 and test signed upload, privacy, CORS, expiry, and deletion |
| Email sender | Local mail adapter verified; live delivery not tested | Verify sender domain and real delivery |
| Payment merchant | Not configured | Test integration; activate merchant before live payments |
| Pricing, tax, refund, retention wording | Proposed defaults only | Finalize commercial decisions before live checkout |
| Artwork/audio/fonts | Implemented and inventoried | Original SVG artwork and synthesized music; self-hosted OFL fonts |
| Gujarati review | Not performed | Obtain language review of complete UI and content |
| Real-device tests | Not performed | Record devices, browser versions, and results |

## Evidence log

| Date | Environment/build | Check | Result | Evidence/limitations |
| --- | --- | --- | --- | --- |
| 6 October 2026 | Planning documents | Scope, design direction, stack, build phases | Documented | Application not built or deployed |
| 6 October 2026 | Local PostgreSQL + Next production build | Build/types, lint, transactional tests, browser journeys | Passing core checks | Details and limitations in `docs/VERIFICATION.md` |
| 6 October 2026 | Supplied Neon database | Empty-database migration | Passed | No synthetic customer or payment data inserted into Neon |

Release conclusion: **application implemented; not approved for public production launch yet**. Live provider setup, production operations/restore/load evidence, policy finalization, native Gujarati review, and physical-device checks remain required. These are release gates, not claims satisfied by local simulation.
