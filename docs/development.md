# Development Guide

[Documentation index](README.md) · [Known limitations](known-limitations.md)

## Before running the project

This version is suitable for local learning and source review. It has unresolved authentication, payment, data-integrity, and test-isolation issues. Use a disposable database, development email accounts, and Midtrans sandbox credentials.

The instructions below describe the checked-in scripts and configuration. They were not verified by starting this snapshot against external services.

## Requirements

- Node.js and npm satisfying the dependency engines in [package-lock.json](../package-lock.json).
- A running MySQL database, with credentials allowed to apply the checked-in migrations.
- Outbound network access for the integrations you exercise.
- A writable repository directory for generated code and local uploads.

The lockfile records Express 5.1.0, Prisma CLI 6.13.0, Prisma client 6.12.0, and Faker 10.0.0. Faker requires Node.js `^20.19.0 || ^22.13.0 || ^23.5.0 || >=24.0.0` and npm `>=10`. There is no `.nvmrc`, `.node-version`, or package-level engine declaration. These are recorded dependency requirements, not a tested runtime matrix.

## Install and configure

From the repository root:

```bash
npm ci
cp .env.example .env
```

Edit `.env` before proceeding. The application loads dotenv from [env.js](../src/application/env.js), and Prisma reads `DATABASE_URL`. `.env` is ignored by Git. Do not place real secrets in Markdown, source code, or `.env.example`.

| Variable | Use and current behavior |
| --- | --- |
| `PORT` | HTTP listener port; no application default is defined. The template uses `3000` |
| `DATABASE_URL` | MySQL connection string, for example `mysql://user:password@localhost:3306/cyclefy_dev` |
| `JWT_SECRET` | Signing/verification secret for seven-day access tokens |
| `SESSION_SECRET` | Secret for Express sessions used with Passport |
| `MAIL_HOST`, `MAIL_PORT` | SMTP server and port |
| `MAIL_USER`, `MAIL_PASS` | SMTP credentials |
| `MAIL_FROM` | Email sender value |
| `MAIL_SECURE` | Passed directly from the environment to Nodemailer, without boolean parsing; verify the resulting transport configuration |
| `CLIENT_ID`, `CLIENT_SECRET`, `CALLBACK_URL` | Google OAuth configuration |
| `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `FACEBOOK_CALLBACK_URL` | Facebook OAuth configuration |
| `TWITTER_CONSUMER_KEY`, `TWITTER_CONSUMER_SECRET`, `TWITTER_CALLBACK_URL` | Twitter OAuth configuration |
| `MIDTRANS_SERVER_KEY` | Server credential for the charge request; also referenced by the currently disabled signature check |
| `MIDTRANS_CLIENT_KEY` | Used by the initialized Snap client; the active Axios charge flow uses the server key |
| `MIDTRANS_IS_PRODUCTION` | Only the exact string `true` selects the production charge URL; keep `false` for local work |
| `MIDTRANS_IS_SANITIZED`, `MIDTRANS_IS_3DS` | Read into configuration but not applied by the active charge flow |
| `UNSPLASH_API_KEY` | Legacy configuration; the active application flow does not use it |
| `APP_NAME` | Present in the template but not read by the environment module |

Use separate, unpredictable values for the two application secrets. OAuth strategies are registered unconditionally when the app is imported. Valid configuration is needed for startup; supplying only a database and JWT secret may not be enough. Provider-side callback registration must match the configured URL.

The implemented callback paths are:

```text
/api/auth/google/callback
/api/auth/facebook/callback
/api/auth/twitter/callback
```

There is no OpenStreetMap API-key variable. The geocoder has a fixed provider and user-agent configuration in source.

## Prepare the database and start

Check that `DATABASE_URL` points to the intended disposable database, then run:

```bash
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Generation creates `src/generated/prisma/`, which is excluded from Git. The application imports this path directly. `migrate deploy` applies the existing migrations; it is useful for reproducing this schema locally without creating a new migration.

With `PORT=3000`, open `http://localhost:3000/api/docs`. `/` returns the normal unmatched-route response. `npm start` starts the same app without Nodemon.

Run from the repository root because uploads, dotenv, and other relative paths depend on the working directory. The API expects category/location/price data for several workflows; use the seed notes below before adding sample data.

## Seed data

The optional command is:

```bash
npx prisma db seed
```

The [seed runner](../prisma/seed.js) creates banks, five categories, five demo users, phones, addresses, donations, recycling locations, repair prices, recycling submissions, repairs/payments, and news. It does not create barter or borrowing listings.

Important behavior:

- Demo accounts have known passwords and verified email flags. The account named Admin has no special permissions.
- Some reference rows use upsert, while many sample records are always inserted.
- Repair prices are randomly updated on every run.
- News assumes author ID 5; other seeders assume category/location IDs in the range 1–5.
- Some sample items choose addresses and phones independently of the owner, bypassing API ownership rules.
- Random repair payments are sample records, not payments verified with Midtrans.
- Re-running seeds can duplicate data or fail when ID assumptions no longer hold.

Use a fresh disposable database for these examples. Seeding is not a safe production bootstrap process.

## Schema changes

When intentionally developing a schema change, edit the appropriate Prisma domain schema and create a migration in a development database:

```bash
npx prisma migrate dev --name describe_your_change
```

To create a migration for inspection before applying it:

```bash
npx prisma migrate dev --create-only --name describe_your_change
```

Inspect the generated SQL and regenerate the client as needed. Development migration commands can require additional database permissions and may prompt to reset a database when drift is detected. Never point them at data you need to preserve without reviewing their effect.

## Testing

The package runs Jest sequentially with Babel and Supertest:

```bash
npm test
```

**Do not run this command against a shared or production database.** [testUtils.js](../test/testUtils.js) performs broad `deleteMany()` operations with no database-name guard. The repository has no automatic `.env.test` loader or dedicated test-database configuration. `NODE_ENV=test` alone does not choose a safe database.

Before running tests:

1. Provision a separate disposable test database and point both Prisma clients to it through `DATABASE_URL`.
2. Apply migrations and resolve the client import mismatch: the app uses `src/generated/prisma/index.js`, but test utilities use `@prisma/client`. The repository does not include a completed fix.
3. Configure the integrations the tests invoke, using development/sandbox accounts, or implement mocks in a separate code change.
4. Review cleanup against the current schema. It omits notification/news tables and can fail on foreign keys.

The 61 cases in 15 files cover registration, login, verification/recovery, profile/contact operations, and basic donation/barter/borrow/recycle/repair requests. They create dummy image files and often register users through real mail/avatar flows. Address tests use geocoding, and a repair test initiates a gateway request.

Coverage gaps include OAuth, notifications, news, webhook authenticity/idempotency, competing acceptance requests, borrowing extension/return, overdue jobs, and many authorization failures. Some tests assert only response shape, accept multiple status codes, or depend on stale fixture values. There is no established passing run or measured coverage result from the documentation review.

## Available scripts

| Script | Implementation |
| --- | --- |
| `start` | `node src/main.js` |
| `dev` | `nodemon src/main.js` |
| `test` | `jest -i` |
| `railwayTest` | `npm install && npx prisma generate && npx prisma migrate deploy && npx prisma db seed` |

`railwayTest` performs installation and database mutations, then seeds demo data. It neither runs tests nor starts the server. Avoid treating its name as evidence of a verified deployment process.

There are no lint, format, build, coverage, or CI scripts. A production dependency-only install also omits Prisma CLI and Faker, which the current generation/seeding workflow needs.

## Local troubleshooting

| Symptom | What to inspect |
| --- | --- |
| Generated Prisma module cannot be found | Run generation from the root and inspect the configured output; check CLI/client version mismatch |
| Startup fails before any request | Check all Passport credentials, session configuration, and generated client availability |
| Registration returns an error but a user exists | Inspect avatar/email calls and the unimported logger in the avatar error branch |
| Discovery says the user has no address | Create an address first; discovery requires saved coordinates |
| Borrow listing created today is missing from discovery | The query requires its start timestamp to be at or after the current time |
| Invalid JWT produces 500 | Known error-status handling defect; this is not necessarily a database failure |
| Images save but response URLs are null or malformed | Known URL-helper argument/external-URL handling defects |
| Test cleanup fails on foreign keys | Notifications/news are missing from cleanup; confirm the database is disposable before changing data |
| Filters fail or return unexpected records | See repair-type/category and borrow-history query defects in the limitations register |

## Deployment considerations

No Dockerfile, Compose file, CI workflow, process-manager configuration, or deployment manifest is included. The repository does not establish that a hosted instance is healthy. CORS contains a Vercel frontend origin and `localhost:3000`, but that is configuration, not deployment verification.

Before any public deployment, address the security and correctness issues in [Known limitations](known-limitations.md). Operational work still includes:

- Separate reference-data setup from demo seeding and remove known demo credentials from deployed data.
- Validate environment variables and pin a compatible Node/Prisma toolchain.
- Configure trusted proxies, HTTPS/session cookies, and an appropriate session store.
- Provide durable shared upload storage and correct public asset URLs.
- Move or coordinate the hourly job so replicas do not run conflicting updates.
- Add graceful shutdown, readiness checks, request logging, backups, and error monitoring.
- Verify signed, idempotent payment callbacks and test retries against a sandbox account.

These are future tasks. The documentation does not add any deployment infrastructure or application fixes.
