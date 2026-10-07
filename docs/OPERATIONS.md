# Deployment and recovery

## Environment and release

1. Use separate Neon databases/branches for development, staging, and production. Never clone real guest or auth data into public previews. Use a least-privilege runtime role and a separate migration role. The supplied connection works; production role scope, branch isolation, region selection, and backup retention still need account-level verification.
2. Configure `.env.example` entries through the host's secret store. Use HTTPS `APP_URL`, independent random 32-byte auth/hash/cron secrets, `sslmode=verify-full` database URLs, a verified email sender, private storage, and an activated payment merchant. Never prefix server secrets with `NEXT_PUBLIC_`.
3. Set `APP_MODE=production`, `EMAIL_ADAPTER=smtp`, `STORAGE_ADAPTER=s3`, `PAYMENT_ADAPTER=razorpay`. Live production requires `rzp_live_` keys. For staging use `APP_MODE=test` with real email/storage adapters and Razorpay test keys. Local adapters explicitly reject hosted deployments.
4. Review migration SQL, rehearse on an isolated branch, back up, then run `pnpm db:migrate` once from the release job before routing traffic to the new application. Do not migrate inside request handlers. Initial migration applied successfully to local UTF-8 PostgreSQL and the supplied empty Neon database.
5. Build with `pnpm build`. Deploy with a Node runtime supporting Sharp and a scheduler capable of a one-minute cadence. No deployment/account was provisioned by this implementation.
6. Run signed test-mode webhooks and the complete staging journey, then an explicitly authorized controlled live purchase. Record capture, publication, email delivery, storage access, expiry, and refund evidence before announcing launch.

## Storage

Keep the bucket private. Grant the server access only to the configured bucket. Permit browser PUT CORS from the exact app origin, with `Content-Type` and any signed request headers allowed by the chosen provider. No anonymous GET access is needed; `/api/media/:id` verifies publication or owner access on every request. Use lifecycle rules to abort incomplete multipart uploads if enabled by your provider.

Uploads reserve one of five slots before transfer. Workers inspect actual decoded bytes, enforce 10 MB / 25 megapixels, reject animated or invalid input, orient images, strip metadata, and produce 480/1200px WebP variants. Removed draft photos remain available to immutable published snapshots; unused photos are cleaned after one day. Object-source signed URLs last five minutes. Test that oversized direct uploads are rejected by finalization and later cleaned.

## Scheduler and monitoring

Invoke `GET /api/jobs` every minute with `Authorization: Bearer <CRON_SECRET>`. Keep the secret in scheduler configuration. Workers claim five jobs per HTTP invocation, recover leases after two minutes, back off with jitter, and dead-letter after twelve attempts. Increase invocation frequency or worker capacity as queues grow, respecting runtime limits. Long retention cleanup batches should be run with `pnpm jobs` from a supervised Node worker if they exceed the hosting request window.

- `/api/health`: public minimal database readiness, 503 on failure.
- `/api/ops`: secret-protected counts for dead/overdue jobs, expired leases, paid-unpublished orders, and payment reviews. It returns 503 for an actionable queue/publication problem.
- Alert on non-200 readiness, any dead job, overdue paid publication over five minutes, or rising queue delay. Review payment-review counts separately; those require a human decision.
- Structured error logs contain codes, correlation/job identifiers, route templates, and error categories. Exclude raw URLs/query strings from host access logging for magic-link endpoints. Never capture cookies, auth tokens, RSVP fragments, form content, provider bodies, email addresses, or database URLs in analytics/error tooling.
- An external error tracker/log drain and alert destinations are **not configured**. Wire the structured events to the selected provider and test an alert before launch.

The CSP is report-only while Razorpay and storage integration origins are verified. Capture reports in staging, replace broad provider origins with observed necessary origins, and enforce the policy after checkout, uploads, fonts, and owner previews pass. Keep inline Next.js requirements in mind; do not claim that report-only CSP blocks attacks.

The application rate limiter trusts Vercel's platform-controlled `x-vercel-forwarded-for` only on Vercel. A different host needs a reviewed trusted-proxy identity configuration before launch; the default development fallback shares a bucket and is not a production proxy configuration.

## Paid but unpublished

Inspect the order and the job whose key is `publish:<order-id>`. Verify the amount, currency, provider order ID, captured payment, and immutable revision. Never ask the owner to pay again. A worker retry is idempotent and grants the full six calendar months from first successful publication. Retry a dead job only after repairing the underlying error, recording the operator and reason in the audit table. Confirm public details, social image, and publication email afterward.

If provider order creation timed out, reconcile by the application's order ID stored as Razorpay receipt. Do not blindly create another provider order. More than one matching order is an explicit support case. The owner's “Check payment status” action uses server reconciliation. Duplicate captured payment IDs are ignored; an additional capture for the same order is logged as `duplicate_capture` and requires merchant review.

## Refunds and disputes

Verified `refund.processed` and `payment.dispute.*` events record a support-review state and suspend public pages, media, and guest response access. This conservative policy includes partial refunds and won/closed disputes; it **does not determine** a final commercial entitlement. Original expiry and purge dates remain unchanged across duplicate or reordered events. A later capture event cannot restore access.

Support must inspect the provider's current payment/refund/dispute status and decide the entitlement under finalized merchant terms. Do not automatically restore on a “won” webhook because older dispute events can arrive afterward. Record the decision in `audit_events`. Restore only after confirming there are no other outstanding reversals, using a transaction to update the order and payment states; replay publication if it never completed. Avoid extending the six-month term accidentally. This procedure requires a merchant operator and has not been rehearsed against live funds.

Provider references: [Razorpay refund webhook payloads](https://github.com/razorpay/markdown-docs/blob/master/webhooks/refunds.md), [Razorpay payment webhook payloads](https://github.com/razorpay/markdown-docs/blob/master/webhooks/payments.md).

## Expiry, deletion, and backups

Public access ends at six calendar months from first publication in Asia/Kolkata. Owner export remains available another 30 days. At the end of grace, maintenance removes drafts, revisions, guest responses, analytics, and photo objects. Unpaid drafts inactive for 90 days are eligible for cleanup. An unresolved financial order prevents automatic abandoned-draft deletion. Financial records and minimal audit references remain; finalize their legal retention schedule before launch.

Enable Neon point-in-time recovery and private object-store backup/version retention appropriate to the agreed policy. Record retention settings. Rehearse restoration into an isolated database and bucket, verify schema and ownership constraints, then reconcile payments received after the backup against Razorpay before restoring traffic. Reconcile object inventory against asset/revision references. Backup retention can outlast live deletion and must match disclosed policy.

App rollback: redeploy the last verified application only if its schema remains compatible. Prefer additive migrations and forward repair. Never drop production data to match an old build. Keep the affected route or checkout unavailable while repairing inconsistent state. Record incident timeline, affected orders, remediation, and follow-up checks without including private content. Final incident contact and operator ownership must be assigned before release.

## Email with Nodemailer

Set `EMAIL_ADAPTER=smtp`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `EMAIL_FROM`. Port 587 requires STARTTLS; port 465 uses TLS immediately. `SMTP_SECURE` can explicitly be `true` or `false`. Use a sender authorized by your SMTP provider. Authentication links, publication notices, and expiry reminders share this transport. See [Nodemailer SMTP settings](https://nodemailer.com/smtp).

Local mode still writes messages to `.local/mail`. The queue retries failed deliveries with stable Message-IDs for tracing; SMTP does not guarantee exactly-once delivery after ambiguous network failures. Test with your own recipient before deployment.
