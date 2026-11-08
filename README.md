# Pomodoro

A focus timer with tasks, projects, reusable templates, and reports. Use it
without an account, or sign in to save work in PostgreSQL and sync devices.

## Features

- Focus, short-break, and long-break timers with pause, reset, and skip.
- Task estimates, notes, ordering, completion, and finish-time estimates.
- Projects with color choices, focus totals, and history-safe removal.
- Reusable task templates without a paid tier. Resource limits still apply.
- Daily, weekly, monthly, and yearly reports with streaks and project totals.
- Manual history entries and CSV downloads with date and format controls.
- Timer automation, sounds, reminders, notifications, themes, and phase colors.
- Fullscreen controls, a compact focus window, and a live timer title.
- JSON backup export and confirmed restore, including damaged-cache recovery.
- Explicit guest import, automatic account saves, and conflict choices.
- PWA manifest, offline fallback, and an update prompt.

Guest work stays in browser storage. Account reports and streaks use saved focus
history, not a separate browser-only counter. Import does not silently delete
its guest source. External task integrations, webhooks, payments, and public
rankings are not included.

## Stack

- Bun workspaces and Turborepo.
- React 19, TanStack Start, Router, Query, and Form.
- Source-owned Yopem UI components and StyleX.
- Rust, Axum, Tokio, SeaORM, PostgreSQL, and utoipa OpenAPI.
- Generated TypeScript contracts and an `openapi-fetch` client.

## Prerequisites

Use the pinned toolchains:

- Bun package version `1.4.4-canary.20261104.1`, revision `a8fcd319b`. See
  `bun-toolchain.json`. Native lint, format, and check need this build.
- Rust `1.97.1` with rustfmt and Clippy. See `rust-toolchain.toml`.
- Docker Compose v2, or compatible Podman Compose, for the local database.

Do not change a global toolchain or replace an existing service without review.
The commands below use the repository root as their working directory.

## Install and configure

```sh
bun install --frozen-lockfile
test -e .env || cp .env.example .env
chmod 600 .env
```

Keep existing `.env` values. Never commit that file or print its secrets.

| Setting                   | Use                                                    |
| ------------------------- | ------------------------------------------------------ |
| `NODE_ENV`                | `development`, `test`, or `production`                 |
| `PUBLIC_ORIGIN`           | Browser origin; local default `http://127.0.0.1:13001` |
| `DATABASE_URL`            | Confirmed PostgreSQL target; required by the API       |
| `BIND_ADDR`               | API listener; local default `127.0.0.1:18001`          |
| `LOCAL_POSTGRES_PASSWORD` | Local Compose database password only                   |
| `AUTH_ISSUER`             | Existing issuer `https://auth.yopem.com`               |
| `AUTH_CLIENT_ID`          | Client approved by the issuer operator                 |
| `AUTH_SESSION_KEY`        | Base64 encoding of 32 cryptographically random bytes   |

Use your secret manager to generate `AUTH_SESSION_KEY`. An empty key disables
account authentication; guest use does not need a key. Keep a configured key
stable across API instances. Changing it invalidates sealed session data and can
require users to sign in again.

Only `PUBLIC_` settings may enter browser configuration. Database credentials
and `AUTH_*` values are server-only. `PUBLIC_ANALYTICS_*`, `PUBLIC_GA_*`, and
`PUBLIC_UMAMI_*` placeholders do not enable an analytics implementation.

### Local PostgreSQL

Inspect existing services before starting another database. Confirm that local
port 5432 is free and that the target is isolated from production.

Set `LOCAL_POSTGRES_PASSWORD` in `.env`. Set `DATABASE_URL` to the same
password, user `pomodoro`, database `pomodoro`, and host `127.0.0.1:5432`.
URL-encode the password when it contains characters with special meaning in a
URL.

The following commands create a local service and apply migrations. Run them
only after target approval:

```sh
docker compose up -d postgres
bun run db:migrate
```

The image is pinned by version and digest. Its named volume mounts at
`/var/lib/postgresql`, as required by PostgreSQL 18. The published port binds
only to loopback. Migrations do not run automatically at API startup.

A normal stop keeps the volume:

```sh
docker compose stop postgres
```

Do not remove volumes or change an existing target to fix a setup error.

### Account sign-in

Before using sign-in, confirm the client, supported token claims, and callback
permission with the existing issuer operator. The local callback is:

```text
http://127.0.0.1:13001/auth/callback
```

The default client value is not proof that this callback is registered. The
issuer uses OAuth; do not assume OpenID Connect support. Use the configured
browser origin consistently. `localhost` and `127.0.0.1` are different cookie
hosts.

## Development

After approved database setup and migrations, start the web and API:

```sh
bun run dev
```

Bun loads the root `.env`; Turborepo forwards the declared settings. Open
`http://127.0.0.1:13001`. The web server proxies backend paths to port 18001.
Use the web origin for application requests, not a separate cross-origin API.

For guest-only work without an API process:

```sh
bun run --cwd apps/web dev
```

Guest storage remains available. Account controls report that the backend is
unavailable until it is configured and running. Do not start duplicate servers
or change ports to avoid an existing process.

## Use the app

1. Add tasks on Timer. Select a task and start a focus interval.
2. Use Projects to group tasks. Existing history keeps its recorded details when
   you remove a task or project.
3. Save task sets in Templates and apply them when needed.
4. Open Reports for period totals, streaks, history edits, and CSV downloads.
5. Open Settings for timer behavior, sounds, themes, and JSON backups.
6. Sign in from the header for account storage. Import guest work only through
   the explicit confirmation. Review conflicts instead of assuming that the last
   visible version is the correct version.

Browser audio, notifications, fullscreen, and popup windows require browser
support and may need user activation or permission. The timer uses deadlines;
background timer callbacks do not create invented chains of completed sessions.

## Static checks

```sh
bun run lint
bun run format:check
bun run typecheck
```

The typecheck task also checks the locked Rust workspace. Rust checks are:

```sh
cargo fmt --all -- --check
cargo check --workspace --all-targets --locked
cargo clippy --workspace --all-targets --locked -- -D warnings
```

Runtime QA is separate. `QA.md` contains the shared acceptance cases and actual
results. A static pass does not prove browser, database, authentication, or
production behavior.

### Update the HTTP contract

Export from Rust without starting services. Replace the tracked specification
only after a successful export:

```sh
mkdir -p docs
cargo run --locked -p pomodoro-server --bin export-openapi > docs/openapi.json &&
  cp docs/openapi.json packages/api/openapi.json &&
  bun run --cwd packages/api generate
```

Do not edit generated types or `routeTree.gen.ts` by hand.

## Release constraints

Use HTTPS and a clean `PUBLIC_ORIGIN` in production. Route `/api`, `/auth`,
`/openapi.json`, `/health`, and `/ready` to Axum before the SSR fallback. Keep
web SSR and the API as separate processes behind one browser origin.

Application builds, service startup, database migrations, live issuer
compatibility, and browser QA have not been validated in this implementation
pass. Complete their cases in `QA.md` before release.

Uncertain save and import facts survive in-memory account changes, not a full
page reload. A reload can require a fresh conflict review. Browser storage is
not a backup service; export important guest work before clearing site data.
