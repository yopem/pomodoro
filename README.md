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
./node_modules/.bin/lefthook install
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

The application sends its own callback as `redirect_uri` to the existing
OpenAuth issuer. The local callback for the default origin is:

```text
http://127.0.0.1:13001/auth/callback
```

Real account QA also passed with `http://localhost:13001/auth/callback` and the
existing issuer. OpenAuth's default redirect policy accepts the exact
`localhost` and `127.0.0.1` hosts, but an issuer can replace that policy. For
production, confirm the actual client, token contract, and permitted application
origin with the issuer operator. Do not infer permission for another domain from
the default client value.

The application's callback is not the Google provider callback. Google returns
to the issuer; the issuer returns to this application. Do not add the
application callback to Google configuration. The issuer uses OAuth; do not
assume OpenID Connect support. Use the configured browser origin consistently.
`localhost` and `127.0.0.1` are different cookie hosts.

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
Keep an app window open for new timer alarms and reminders. On supported
browsers, the active service worker displays persistent notifications. A
notification returns to an existing timer window or opens the same-origin timer
without replacing another open form. Desktop notifications remain a fallback.
This does not add server push or schedule alarms after all app windows close.
Failed delivery is reported in the timer without stopping its saved completion.

Start and Resume request sound through the user gesture. After a reload, use
Enable sound for a recovered run. Sound readiness describes the current tab, not
the device volume. A missed alarm is not replayed on a later click. Only the tab
that saves completion attempts its sound; a sleeping tab or another completing
tab can prevent an audible alarm. Supported platform notifications can provide a
separate notice; neither path guarantees background delivery.

## Static checks

Git hooks use isolated snapshots. Commit checks use the staged tree; pushes to
`origin` check each distinct pushed commit, including new branches and tags. The
current snapshot runner needs Linux `/proc`, a POSIX shell and process groups.
It fails closed on unsupported platforms, refs, source formats, or missing
tooling. A separate worker owns temporary data and checks. Parent loss, signals
and output errors cancel its work. A killed outer hook can return before the
worker finishes cleanup; hard kills of the worker do not guarantee cleanup.
Native snapshot checks do not start application services or replace runtime QA.
Run this command from the repository root to check the current committed tree:

```sh
bun scripts/check-snapshot.ts --commit "$(git rev-parse HEAD)"
```

Individual existing checks:

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

## Production containers

`compose.production.yaml` defines separate Linux amd64 API and Bun SSR images.
It does not create a database or a public edge. Prepare an approved external
HTTPS edge and an isolated existing container network before deployment. Do not
publish the API or web ports. Give the edge access to the network and route
`/api`, `/auth`, `/openapi.json`, `/health`, and `/ready`, including applicable
subpaths, to `api:18001` before routing other paths to `web:13001`. Preserve
methods, paths, cookies, and response headers. Unknown backend paths must reach
the API, not SSR.

The edge must overwrite `X-Forwarded-For` with exactly one verified client IP.
Set `TRUSTED_PROXY_IPS` to the exact private socket IP addresses used by that
edge, not a subnet. Reject direct public access to both services. Use an
explicit, non-overlapping private subnet and fixed edge addresses in the
external network. Do not trust incoming forwarded headers at the edge. Verify
the network's actual peer addresses and the edge behavior before release. Build
only from a reviewed commit with the trusted-proxy implementation.

Prepare the context from a reviewed commit, not the live working tree. From the
repository root on a Linux amd64 host, with the trusted installed Bun on `PATH`.
Stop if any command fails:

```sh
REPO=$(pwd -P)
CONTAINER_CONTEXT=$(mktemp -d /tmp/pomodoro-context.XXXXXXXX)
chmod 700 "$CONTAINER_CONTEXT"
git archive HEAD -o "$CONTAINER_CONTEXT/source.tar" &&
  tar -xf "$CONTAINER_CONTEXT/source.tar" -C "$CONTAINER_CONTEXT" &&
  rm "$CONTAINER_CONTEXT/source.tar"
mkdir -m 700 "$CONTAINER_CONTEXT/.container"
cp -L "$(command -v bun)" "$CONTAINER_CONTEXT/.container/bun"
chmod 755 "$CONTAINER_CONTEXT/.container/bun"
printf '%s  %s\n' \
  14f268816e1b6a412d3715d8b9820bdb3030386ffdd35c46da1446898e0091c4 \
  "$CONTAINER_CONTEXT/.container/bun" | sha256sum -c -
```

The archive contains committed files only. It excludes the untracked `.env`, Git
history, local QA artifacts, and `node_modules`. Review the commit and archive
contents before building; do not add secrets or other local files to the
context. The build checks the supplied Bun checksum, version `1.4.4`, and
revision `1.4.4-canary.1+a8fcd319b`. These trusted host bytes do not establish
an independently retrievable official artifact or its provenance. No runtime pin
or global installation is changed. The pinned image digests fix Linux amd64
manifests, but network dependency downloads and system libraries still need
release verification.

Create a private Compose env file outside the repository. Use a secret manager
or a secure editor to set `PUBLIC_ORIGIN`, `DATABASE_URL`, `AUTH_CLIENT_ID`,
`AUTH_SESSION_KEY`, `TRUSTED_PROXY_IPS`, and `PRIVATE_NETWORK`. Set
`PUBLIC_ORIGIN` to the approved HTTPS origin and use the same value for each
build and deployment. Use the approved issuer client and a stable session key.
`PRIVATE_NETWORK` is the name of the existing isolated network. Do not use the
repository `.env` or put secrets in build arguments.

```sh
PRODUCTION_ENV=$(mktemp /tmp/pomodoro-compose-env.XXXXXXXX)
chmod 600 "$PRODUCTION_ENV"
printf 'CONTAINER_CONTEXT=%s\n' "$CONTAINER_CONTEXT" > "$PRODUCTION_ENV"
```

Add the settings above to that file without printing secrets. Shell environment
variables normally override Compose env-file values; the commands below clear
them to prevent accidental overrides. Run them only after approval. They always
select the explicit env file and project directory, so Compose does not load the
repository `.env` implicitly:

```sh
env -i PATH="$PATH" HOME="$HOME" docker compose \
  --project-directory "$CONTAINER_CONTEXT" --env-file "$PRODUCTION_ENV" \
  -f "$REPO/compose.production.yaml" build

env -i PATH="$PATH" HOME="$HOME" docker compose \
  --project-directory "$CONTAINER_CONTEXT" --env-file "$PRODUCTION_ENV" \
  -f "$REPO/compose.production.yaml" up -d
```

The API image also contains `pomodoro-migration`. Migrations never run on
startup. After backup and explicit approval of the database target, invoke
`docker compose` with the same options and
`run --rm --no-deps api pomodoro-migration up`. This changes the database. The
API has a 50-second stop grace period for its 35-second request drain and
10-second database close. Remove the private env file and context when they are
no longer needed.

These recipes and the external edge need the separate `QA-072` runtime pass.
Verify image libraries and CA roots, TLS, read-only operation, listeners,
standalone SSR assets, routing, proxy identity, shutdown, and migration behavior
before release. The env file and container environment contain secrets; protect
both and do not publish `docker compose config` output from real settings.

## Release constraints

Use HTTPS and a clean `PUBLIC_ORIGIN` in production. Route `/api`, `/auth`,
`/openapi.json`, `/health`, and `/ready` to Axum before the SSR fallback. Keep
web SSR and the API as separate processes behind one browser origin.

See `QA.md` for the current release checks and evidence. Successful builds and
isolated local checks do not establish live issuer compatibility or production
readiness. Complete the remaining cases before release.

Account JSON requests have a 20,000,000-byte UTF-8 limit. Merged data must also
fit a conservative client-save budget, including revision and timer-number
formatting space. This can reject data just below the literal request limit.
Existing data and receipt replays remain readable. Oversized legacy saves must
reduce the same size measure; new imports must fit the budget. Browser storage
quotas can be lower.

Account writes require IndexedDB and Web Locks. The app saves request facts
before it sends a write. After a reload, sign in to the same account before
reviewing a saved request. **Review pending import** uses its original snapshot
and import ID, not the current guest contents. Conflict choices refer to the
request and workspace shown when confirmation opens.

Missing local account data is not an empty edit. Restore a backup or use the
account version when recovery requires a choice. Storage errors stop account
writes without deleting saved request facts. Logout does not require a readable
workspace or recovery database; the server still checks the captured account.

These recovery paths need the remaining authenticated checks in `QA.md` before
release. The operation lock coordinates current clients, not older code or other
devices. Review client-version compatibility before a future format change.
Browser storage eviction, profile loss, and cleared site data can remove local
requests. Browser storage is not a backup service; export important work before
clearing it.
