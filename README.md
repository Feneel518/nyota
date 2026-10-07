# Wedding Adventure

A complete Next.js application for creating illustrated English/Gujarati wedding invitations, publishing after verified payment, and managing private guest responses.

The implementation includes three original themes, animated chapters for each function, independent character/outfit choices, optional original music, private photo processing, autosaved drafts, magic-link sign-in, Razorpay checkout, immutable publication snapshots, QR sharing, RSVP edit links, CSV export, and lifecycle jobs. Haldi has turmeric tosses, Mehendi has henna application, Sangeet has dancing and dhol, and weddings have a baraat and varmala exchange. The interface uses shadcn/Radix with custom typography, color, pause controls, and reduced-motion support.

## Run on this computer

Use Node.js 22 or newer and pnpm 10.32.1. On Windows, use `npx.cmd --yes pnpm` if PowerShell blocks `pnpm.ps1`.

```sh
pnpm install --frozen-lockfile
pnpm setup:local
pnpm db:local
```

Keep PostgreSQL running in that terminal. In a second terminal, start the isolated local application:

```sh
node scripts/local-run.mjs migrate
node scripts/local-run.mjs dev
```

Open <http://127.0.0.1:3001>. Sign-in emails are written to `.local/mail/`; open the link in the newest message for your address. Local checkout does not charge money. Photo processing and background work can be run in another terminal with `node scripts/local-run.mjs jobs`.

The local runner overrides database and provider configuration for its child process and does **not** rewrite `.env.local`. Test data never goes to the supplied Neon database. `.local/` contains private credentials, mail, uploads, and PostgreSQL data; keep it private and out of source control.

## Use the configured Neon/provider environment

```sh
pnpm db:migrate
pnpm dev
```

This uses `.env.local`, normally at <http://127.0.0.1:3000>. Match `APP_URL` to the browser origin, including its port. Runtime traffic uses `DATABASE_URL`; migrations use `DATABASE_URL_UNPOOLED`. The migration script derives Neon's direct hostname if a pooled hostname was mistakenly supplied as the direct URL. It does not rewrite stored credentials.

Migration `0000_organic_zuras.sql` has been applied to the supplied empty Neon database. Only schema was created there; verification fixtures live in the isolated local database.

## Verification

```sh
pnpm lint
pnpm typecheck
node scripts/local-run.mjs test
node scripts/local-run.mjs build
node scripts/local-run.mjs start
# In another terminal, while the production build runs on port 3001:
pnpm exec playwright install chromium
node scripts/local-run.mjs e2e
```

`pnpm test` runs pure tests and skips database integration tests unless the explicit local guard is set. Use the local runner for all tests. Browser tests create synthetic owners, weddings, and guest responses. They write review screenshots to `docs/screenshots/` and an HTML report to `playwright-report/`.

## Before public launch

See [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md), [operations](docs/OPERATIONS.md), [verification evidence](docs/VERIFICATION.md), and [asset inventory](docs/ASSETS.md). A passing local build is not verification of live payments, email delivery, storage permissions, backups, or physical devices.

Configure a real HTTPS domain, private S3/R2 bucket, an authorized SMTP sender for Nodemailer, activated Razorpay merchant, scheduler, monitoring, and separate staging/production databases. Set `APP_MODE=production` and all provider adapters to their real values. Startup rejects local adapters and missing production secrets. Final commercial policies and native Gujarati review are release requirements.

For real email, set `EMAIL_ADAPTER=smtp` and fill `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `EMAIL_FROM` from `.env.example`. Port 587 requires STARTTLS; port 465 uses TLS immediately. Restart the application after changing these settings. `EMAIL_ADAPTER=local` keeps the local inbox and sends no external email.

In the editor's Functions step, **Ceremony animation** can match the event name automatically in English or Gujarati, or use an explicit scene for a custom title. Existing invitations remain compatible without this optional field. Open `/demo` and choose a celebration chapter to preview all four ceremonies.

## Code map

- `src/lib`: versioned content, validation, calendar hosting dates, CSV safety.
- `src/server`: scoped database services, authentication, payments, media, RSVP, jobs.
- `src/features`: owner editor, guest renderer, checkout, responses.
- `src/components/ui`: generated shadcn primitives.
- `drizzle`: reviewed migration and schema snapshots.
- `tests`: contracts, actual PostgreSQL transactions, browser journeys and accessibility.

Read `AGENTS.md` and the installed Next.js documentation before extending the application.
