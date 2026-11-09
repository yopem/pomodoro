# Agent Instructions

| Profile | Choice |
| --- | --- |
| Runtime | Pinned Bun; ESM |
| Package model | Bun workspaces; Turborepo tasks |
| Backend | Rust, Axum, JSON HTTP, and utoipa OpenAPI |
| Validation | Rust boundary validation and Zod; lint, format, and typecheck by default; other QA needs approval |
| Tooling | Native `bun lint`, `bun fmt`, `bun check`; `bunfig.toml` |
| Deployment | Rust API and Bun web SSR containers; separate processes behind one origin |
| Additional apps | React desktop with GPUIX, mobile with Expo, extension with WXT |

## Scope and priority

### Instruction scope

- Read the closest project-specific `AGENTS.md` before changing code.
- If a user asks to update `AGENTS.md` only, edit only `AGENTS.md`. Do not
  change source files, dependencies, lockfiles, or generated files.

### Code discovery

- Before code search, use Code Index MCP (`code-index-mcp`). Select the project
  with `set_project_path` and check `get_settings_info`.
- Keep its file watcher off. Set `enabled: false` with `configure_file_watcher`,
  select the same project again, and verify `active: false` with
  `get_file_watcher_status` before building a deep index.
- Use `search_code_advanced` and `find_files` for code context. Follow pagination
  with `start_index` when `has_more` is true. Use `refresh_index` for a stale
  file index.
- Build a deep index only when symbol data is needed, with `max_workers: 1`.
  Use `get_file_summary` and `get_symbol_body` for focused symbol context.
- If required files are absent from the index or the server is unavailable,
  use native search and state the reason.

### Change and document limits

- Inspect existing callers, types, and configuration before editing.
- Make the smallest complete change. Reuse existing code before adding helpers,
  abstractions, dependencies, or configuration.
- Preserve unrelated user changes. Never reset, delete, or overwrite them.
- Only `AGENTS.md`, `README.md`, `LICENSE.md`, and `QA.md` may be committed as
  Markdown files in application repositories. Keep `QA.md` at the repository
  root. Put other detailed plans and working documents in gitignored `docs/`.
  Keep `README.md` focused on project overview, setup, usage, and license.
- Preserve the project's license. Do not add or change a license without an
  explicit request.

## Readability contract

### Names and workflow structure

- Optimize code for the maintainer who reads it, not for the fewest lines.
  Keep correctness, security, and runtime boundaries intact.
- Use business names for modules, functions, inputs, and results. Avoid broad
  names such as core, manager, processor, or operations when a specific name
  exists.
- Write business workflows in execution order. Use ordinary Rust and
  TypeScript for straightforward calculations and choices. Prefer explicit
  errors and dependencies. Avoid nested callbacks when sequential code is
  easier to follow. Use suitable time types and validate boundary values.
- Use a named input object when several arguments have the same type, or
  when callers cannot tell what each argument means.
- Keep reusable query and mutation definitions in feature query modules.
  Keep rendering components free of transport and persistence details.
  Hooks own focused interactive workflows, not all page responsibilities.

### Contracts and review

- Use Rust DTOs and generated OpenAPI as the canonical HTTP contract. Reuse
  compatible definitions where possible. Frontend Zod schemas provide runtime
  validation where needed and must agree with the contract; Rust and TypeScript
  cannot directly share an executable schema. Keep validation at boundaries.
- Explain non-obvious state transitions, retry rules, and idempotency
  decisions with short comments. Do not comment obvious syntax.
- Before completion, trace one changed workflow from its entrypoint to its
  result. Remove unclear names, needless forwarding, and hidden dependencies
  on that path.
- When the project has a user-approved reference workflow, read its files
  before changing a similar workflow. Follow its naming, dependency, and
  control-flow patterns. Do not call an example approved without user review.
  If none exists, propose one small existing workflow for review; do not
  refactor unrelated code to create an example.

## General scope

- These instructions define a reusable stack, not a product specification.
- Get product requirements, roles, integrations, and release scope from the
  current project and user request. Do not assume a product domain, login
  method, subject fields, or client identifier.
- Add optional services and dependencies only when the requested feature needs
  them. Do not add AI, email, storage, queues, payments, or background jobs in
  advance.

## Standard stack

### Runtime and application layers

- **Frontend runtime and package manager:** pinned Bun, Bun workspaces, and
  ESM for dependency installation, scripts, supported builds, and web SSR.
- **TypeScript:** use `bun check` and compatible `@yopem/typescript-config`
  presets. Verify the pinned Bun version supports the required commands.
- **Backend:** Rust with Axum and Tokio. Use Cargo workspaces for Rust crates;
  Bun workspaces and Turborepo continue to manage the frontend and app targets.
  Pin a Rust toolchain and compatible crate versions. Use typed Rust errors,
  explicit application state, and structured tracing.
- **Frontend:** React 19, TanStack Start, TanStack Router, TanStack Query, and
  TanStack Form (`@tanstack/react-form`). Add TanStack Table and TanStack
  Virtual only when needed. Framework routing and UI state stay in the frontend.
- **PWA:** required for the web app. Use `vite-plugin-pwa` with a web
  manifest, service worker, install icons, and offline fallback.
- **Styling and UI:** StyleX and source-owned Yopem UI components built on
  Base UI. Use `@yopem-ui/cli` to install them. Keep semantic tokens and SSR-safe
  theme handling.
- **HTTP contract:** use ordinary JSON HTTP endpoints in Axum, not RPC.
  Generate OpenAPI from Rust using utoipa, generate frontend types with
  `openapi-typescript`, and use `openapi-fetch` for typed HTTP calls.
  Keep validation on both sides of the network boundary.

### Data and integrations

- **Database:** PostgreSQL with SeaORM as the primary ORM, SeaORM migrations,
  and SQLx for direct SQL only when needed. Use a shared PostgreSQL pool when
  the pinned SeaORM and SQLx versions support it; verify the exact APIs and
  compatible SQLx versions before implementation.
- **Cache:** use the Rust `redis` crate when needed; keep policy in the owning
  service and manage connections for the process lifetime.
- **Queue:** use a Rust-compatible durable job solution when required; verify
  its Redis support, delivery guarantees, lifecycle, and compatibility first.
- **Storage:** use the Rust AWS SDK for S3 with a verified R2 or S3-compatible
  endpoint when needed. Keep credentials server-only.
- **Media:** use the Rust `image` crate when image processing is needed; verify
  formats and resource limits for the task.
- **Authentication:** use the existing `https://auth.yopem.com` OpenAuth issuer
  with a Rust-compatible OAuth client and token verification. Verify issuer
  metadata, token format, claims, and subject contract before implementation.
- **AI:** when requested, use a compatible Rust provider SDK or documented HTTP
  API. Validate structured output and tools on the server.
- **Analytics:** Google Analytics 4 and Umami, loaded by one client module
  and configured through public `.env` values.
- **Payments:** when requested, use Polar hosted checkout, customer portal, and
  signed webhooks. Verify a Rust SDK or documented HTTP integration before use.
  Never collect card data.

### Validation and build tools

- Use Zod for frontend forms, URL state, and public configuration. Validate
  incoming requests, configuration, and external data in Rust using Serde and
  appropriate explicit checks or a verified validation crate. Generated
  TypeScript types do not validate runtime data.
- Use `bun lint`, `bun check`, and `bun fmt` for TypeScript, and Cargo, rustfmt,
  and Clippy for Rust. Use Turborepo for frontend workspace ordering and caching.
  Do not use Vite+. Use Vite for frontend builds required by TanStack Start and
  StyleX. Build the backend with Cargo.

### Runtime and tool compatibility

- `bun lint` currently requires Bun canary. Pin an exact tested Bun version
  and revision for developers, CI, and container images. Verify `bun lint`,
  `bun check`, and `bun fmt` and their options before setup; report gaps.
  Do not change a user's global Bun installation without approval.
- Pin compatible Rust, Axum, Tokio, SeaORM, SQLx, utoipa, Zod, OpenAPI tooling,
  and Turborepo versions. Check their documentation and feature flags before
  selecting APIs. Keep Rust dependencies out of browser bundles.

### Additional app targets

Add these apps only when the project has that target. Use React for each one.
Share platform-neutral frontend logic and generated API types through
`packages/`. Keep platform UI in the owning app; do not import web components or browser routing
into desktop, mobile, or extension apps. Do not create a shared UI package.

- **Desktop:** use GPUIX from https://gpuix.dev. GPUIX renders a React tree with
  GPUI, Zed's GPU UI framework, without Electron or a web view. Add
  `@gpuix/react`, `@gpuix/native`, and `react` to `apps/desktop`. Keep source in
  `apps/desktop/src/`. Pin the adapter and `@gpuix/native` to the same exact
  version; GPUIX is pre-1.0 and can break between releases. Set
  `jsxImportSource` to `@gpuix/react`, call `render()` in `src/app.tsx`, and run
  `bun --hot src/app.tsx` for development. Build a binary
  with `bun build --compile`. Add cargo-packager only when the project ships
  installers. Layout and text use GPUI, not the DOM.
- **Mobile:** use Expo from https://docs.expo.dev with React Native. Add
  `apps/mobile` with Expo Router and file-based routes in `src/app/`. Use the local
  `npx expo` CLI; the global `expo-cli` is deprecated. Keep `app.json` or
  `app.config.ts` as the source of native configuration. Do not commit generated
  `ios/` and `android/` directories; apply native changes through config plugins
  and `npx expo prebuild`. Keep the Hermes and New Architecture defaults. Use
  Expo Build, Expo Submit, and Expo Update for releases.
- **Browser extension:** use WXT from https://wxt.dev. Add `apps/extension` with
  `@wxt-dev/module-react` and `srcDir: 'src'`. Keep `src/entrypoints/` for the
  background service worker, content scripts, popup, options, and side panel.
  Use Manifest V3 unless a required store target does not support it. Run
  `wxt dev`, `wxt build`, `wxt zip`, and `wxt submit` from `apps/extension`.
  Use hash mode for extension pages; their URLs are static files. Keep extension
  APIs in entrypoints or app-only modules.

## Rust version policy

- Follow the [Google Rust Style Guide](https://google.github.io/styleguide/rustguide.html)
  for Rust code and API design. Apply platform-specific rules only when their
  stated scope matches the project. Resolve conflicts with existing project
  requirements and report them; do not silently weaken safety or checks.
- Pin a tested Rust toolchain with `rust-toolchain.toml` and commit `Cargo.lock`
  for applications. Keep Axum, Tokio, SeaORM, SQLx, utoipa, and their features
  compatible with that toolchain and each other.
- Read documentation for pinned releases before selecting APIs. Verify security
  updates and integration support before upgrades. Report unsupported required
  integrations instead of inventing APIs or silently changing the stack.

## Tooling and configuration

### Configuration ownership

- Root `package.json` owns Bun workspaces, the pinned package manager, root
  scripts, and tooling dependencies. Commit one `bun.lock`. Do not add pnpm,
  npm, or Yarn lockfiles.
- `bunfig.toml` owns native lint, format, and supported native check options.
  Use only options documented for the pinned Bun build. Prefer `[lint]`,
  `[lint.rules]`, and `[fmt]` where supported. Do not invent a `[check]` table.
  `tsconfig.json` owns TypeScript compiler options and file selection.
  `vite.config.ts` owns only required frontend plugins and builds. Cargo manifests
  and `rust-toolchain.toml` own Rust dependencies and toolchain. Do not
  install Vite+.
- Verify how the pinned `bun lint` reads existing ESLint or Oxlint configs
  before migration. Move effective rules into the native Bun policy. Do not
  require standalone Oxlint/Oxfmt runners or keep competing config files.
  If a required rule or setting cannot migrate, report a blocker; do not
  silently drop it or add a fallback runner.

### Shared presets and rule support

- Pin compatible shared preset and plugin versions when used.
- Reuse `@yopem/oxlint-config` presets for React and TanStack Start
  only when the pinned Bun linter supports their config and plugin APIs.
  Verify shared type-aware settings, plugin registration, and overrides.
  Do not assume all Oxlint plugins run unchanged in Bun. Missing required
  preset or plugin support blocks setup; do not silently omit it.
- Verify `@yopem-ui/oxlint-plugin`, React Doctor rules, and React Compiler
  diagnostics against Bun's plugin support. Check allowed and rejected examples
  before claiming enforcement. Report unsupported integrations as blockers;
  do not silently run standalone Oxlint or ESLint as a replacement.
- Prohibit `useEffect`, `useCallback`, and `useMemo`. Use the compatible shared
  React policy when available, or a supported import and call restriction.
  Do not assume memoization warnings enforce the hook ban.

### Format and TypeScript policy

- Put no semicolons, double quotes, 80-column lines, trailing commas, and import
  ordering in `[fmt]`. Keep one format policy. Migrate generated formatter
  settings only after confirming equivalent Bun support.
- Extend compatible `@yopem/typescript-config/base` or `/react` presets. Keep
  strict types and browser/server import boundaries. Add `@types/bun` and the
  `bun` type entry only to workspaces that need Bun APIs. Do not give browser
  code server globals merely to suppress errors.
- Use `bun check` for package typecheck scripts and CI. It checks types; it
  does not emit JavaScript or declarations. Do not use `tsc` or `tsrs` as a
  fallback. Report a separate declaration-build need before selecting tooling.
- Read scripts before commands. A script named `check`, `lint`, or `fmt` can
  shadow the native Bun command. Use `--no-script` when native execution is
  required, especially inside Turborepo tasks. Do not create recursive scripts.

### Lint suppression: last resort only

- Read the exact `bun lint` diagnostic and rule requirements. Fix the cause
  first. Try a code change or refactor that preserves behavior and satisfies
  the rule. Do not add a disable comment as the first solution.
- Allow a suppression only when no correct code change or refactor can satisfy
  the rule. State which alternatives failed and why the exception is needed.
- For `bun lint`, use `eslint-disable-next-line <rule-name>` or
  `eslint-disable-line <rule-name>` only. Never use `oxlint-disable` comments.
- Limit each suppression to the exact rule and one affected line. Add a nearby
  comment that explains why the exception is necessary. Do not use file-wide,
  block-wide, or rule-free disable comments.
- Rerun the affected lint command after the change. Confirm that the exception
  is still required and the other checks pass.

### Workspace tasks and cache safety

- Install Turborepo as a pinned root development dependency. Root scripts run
  the installed `turbo` CLI through Bun. Workspaces define the leaf scripts.
  Do not make a leaf task call the same root Turbo task recursively.
- Use `turbo.json` for dependency ordering and caching. Build tasks depend on
  required upstream builds, normally `^build`. Declare actual outputs, not
  guessed framework paths. Track source, lockfile, shared config, Bun revision,
  and environment inputs that affect results.
- Keep development tasks `persistent: true` and `cache: false`. Disable caching
  for format writes, lint fixes, migrations, seeds, deployment, and every task
  with external mutations. Never replay a cached result as proof of a write.
- Cache lint, format checks, typechecks, and builds only with complete inputs.
  Each package typecheck must select its own `tsconfig.json`; a root check in
  the wrong directory must not substitute for workspace coverage.
- Include shared `bunfig.toml`, TypeScript presets, and lint config in relevant
  task inputs. Account for runtime environment pass-through and hashed values.
  Do not put credentials in task logs or publicly shared cache artifacts.
- Preserve required framework and StyleX build plugins. Bun manages the CLI
  process; it does not make every Vite plugin a Bun bundler plugin.
- Use Lefthook for staged and push checks as specified in Git hooks. Preserve
  existing hooks and partially staged changes. CI still runs workspace checks.
- CI runs lint, format checks, `bun check`, and required builds. Run relevant
  lint, format, and typecheck commands locally by default, including type-aware
  lint and commands that enable typechecking indirectly.

### Command patterns

These patterns define the intended scripts for a new project. Read existing
scripts and exact workspace names before use. Do not assume these scripts exist.

```sh
bun install
bun install --frozen-lockfile             # CI

bun run dev                              # root: turbo run dev
bun run build                            # root: turbo run build
bun run lint                             # root: turbo run lint
bun run lint:fix                          # root: turbo run lint:fix; uncached
bun run format:check                      # root: turbo run format:check
bun run format:write                      # root: turbo run format:write; uncached
bun run typecheck                         # root: turbo run typecheck

# Native leaf commands, from the owning workspace:
bun lint --no-script
bun lint --no-script --fix
bun fmt --no-script --check
bun fmt --no-script
bun check --no-script -p tsconfig.json

# Rust workspace, after confirming manifest and targets:
cargo fmt --all -- --check
cargo clippy --workspace --all-targets --locked
cargo build --workspace --locked
# Use the migration crate's documented command after confirming the target.
```

Do not define an aggregate root `check` script that hides native `bun check`.
Keep `typecheck` as the script name. Run lint, format, and typecheck locally by
default. CI and Lefthook also run these checks. Do not run builds or other
restricted operations indirectly without the required approval.

After pulling dependency changes, run `bun install` to apply the lockfile and
workspace patches. Confirm the target before migrations, seeds, or deployment.

## Repository layout

Use a feature-first modular monolith. Keep the existing layout unless the task
requires a change. For a new monorepo, use these paths only when needed:

### Starting paths

Entries define ownership, not required empty scaffolding. Create optional
files and modules only for requested behavior. Existing projects keep their
paths unless the task explicitly includes a migration.

Place all shared, reusable UI components in `apps/web/src/components/`.
Keep copied UI primitives in its `ui/` subdirectory. Keep feature-only
components in `apps/web/src/features/<domain>/components/`. Keep UI for
desktop, mobile, and extension apps in its own app. Share only platform-neutral
code through `packages/`.

```text
.
├── AGENTS.md                                        project-specific instructions
├── README.md                                        overview, setup, usage, license
├── LICENSE.md                                       existing or user-approved license
├── QA.md                                            shared QA plan and recorded results
├── .gitignore                                       secrets, generated output, local state
├── package.json                                     workspace scripts and tooling
├── bun.lock                                         frontend dependency lockfile
├── Cargo.toml, Cargo.lock, rust-toolchain.toml       Rust workspace, lockfile, and toolchain
├── bunfig.toml                                      native lint, format, supported check options
├── turbo.json                                       task inputs, outputs, and dependencies
├── tsconfig.json                                    shared workspace config
├── alchemy.run.ts                                   only when existing docs app requires Pages deployment
├── apps/
│   ├── web/                                         frontend and SSR
│   │   ├── package.json                             frontend dependencies and scripts
│   │   ├── tsconfig.json                            React preset and web aliases
│   │   ├── vite.config.ts                           frontend framework, StyleX, runtime plugins
│   │   ├── ui.json                                  web-local UI CLI records and aliases
│   │   ├── public/                                  frontend static assets
│   │   └── src/
│   │       ├── router.tsx                           router and query context
│   │       ├── routeTree.gen.ts                     generated; ignored; do not edit
│   │       ├── routes/                              URL handling and page composition
│   │       │   ├── __root.tsx                       document shell and providers
│   │       │   └── index.tsx                        main route
│   │       ├── features/                            client features by business domain
│   │       │   └── <domain>/
│   │       │       ├── components/                  domain UI and forms
│   │       │       ├── hooks/                       focused interactive workflows
│   │       │       ├── queries.ts                   typed query and mutation options
│   │       │       └── schema.ts                    optional UI-only validation
│   │       ├── components/                          all shared reusable UI across features
│   │       │   └── ui/                              copied Yopem UI primitives
│   │       ├── lib/                                 browser-safe setup and shared UI helpers
│   │       └── styles/                              application styles
│   │           └── tokens.stylex.ts                 semantic tokens when needed
│   ├── server/                                      Axum backend Cargo crate
│   │   ├── Cargo.toml                               backend dependencies
│   │   └── src/
│   │       ├── main.rs                              router, shared state, shutdown
│   │       ├── features/<domain>/                   HTTP handlers, services, errors, jobs
│   │       ├── platform/                            auth, storage, AI adapters when needed
│   │       └── bin/                                 worker and maintenance entrypoints
│   ├── docs/                                        existing docs site only; preserve documentation/ if used
│   │   ├── package.json                             existing site build and deployment scripts
│   │   └── <site-source>/                           existing documentation framework layout
│   ├── desktop/                                     optional GPUIX React desktop app
│   │   ├── package.json                             react with pinned @gpuix/react and @gpuix/native
│   │   ├── tsconfig.json                            jsxImportSource set to @gpuix/react
│   │   ├── packager.json                            cargo-packager settings when shipping installers
│   │   └── src/
│   │       ├── app.tsx                              React tree and render() entry
│   │       └── features/                            desktop features by business domain
│   ├── mobile/                                      optional Expo React Native app
│   │   ├── package.json                             expo, react-native, and expo-router
│   │   ├── app.json                                 app config and native settings
│   │   └── src/
│   │       ├── app/                                 Expo Router file-based routes
│   │       │   ├── _layout.tsx                      root navigator and providers
│   │       │   └── index.tsx                        main screen
│   │       └── features/                            mobile features by business domain
│   └── extension/                                   optional WXT browser extension
│       ├── package.json                             wxt, @wxt-dev/module-react, and scripts
│       ├── wxt.config.ts                            srcDir src, manifest, React module, Vite settings
│       └── src/
│           ├── entrypoints/                         background, content, popup, and options
│           │   ├── background.ts                    service worker
│           │   └── popup/                           popup HTML, React root, and styles
│           └── components/                          extension-only React components
├── crates/                                          Rust workspace crates when needed
│   ├── db/                                          SeaORM entities and domain data access
│   └── migration/                                   SeaORM migration crate and reviewed migrations
├── packages/                                        frontend shared packages when needed
│   ├── api/                                         generated OpenAPI types and openapi-fetch client
│   │   ├── package.json, tsconfig.json              dependencies and package settings
│   │   └── src/                                     generated types and shared client adapters
│   └── env/                                         Zod-validated public configuration
│       ├── package.json, tsconfig.json
│       └── src/client.ts                            approved public values only
└── docs/                                            ignored working notes; not deployed documentation
```

Optional paths are not a scaffold checklist. Create only files needed by the
requested feature. Keep existing layouts and helpers unless migration is
explicitly requested. Rust configuration and optional backend integrations
remain server-only; do not create empty crates or packages.

### Ownership and configuration

- Each Bun workspace owns its `package.json` and `tsconfig.json`. Each Rust
  crate owns its Cargo manifest. Use root defaults and narrow overrides.

### Domain modules

- Name folders after business domains, not tables or technical operations.
  Keep related persistence entities and queries together. Use matching domain
  names across frontend, server, and database modules when ownership matches.
- Routes own page composition. Feature folders own domain UI, hooks, and query
  options. `apps/web/src/components/ui/` owns shared primitives, not pages.
  Keep UI-only Zod schemas with their features. Rust DTOs and utoipa define the
  HTTP contract; generated types are not runtime validators.

### Processes and origins

- `apps/server` is a Rust Axum deployment. `apps/web` owns frontend builds and
  SSR. Do not deploy each feature separately.
- Prefer one public origin. A reverse proxy sends `/api`, `/auth/*`, OpenAPI,
  and other backend routes to Axum and other routes to frontend SSR.
- Default local web and API ports are `3000` and `4000` when none are
  configured. Preserve existing ports. Proxy backend paths through the web
  origin in development; do not add CORS as a substitute.

## Growth rules

Start with files. Split responsibilities that change independently or need
unrelated dependencies. Keep related operations together when they share the
same domain rules and dependencies. Keep each workflow's steps together.
For example, separate connection management, publication preparation, and
analytics when their rules or dependencies change independently. Share their
existing SDK setup; do not copy it. Do not split only to reduce line count or
create a file for each CRUD operation or helper. Keep domain ownership and
import boundaries unchanged.

```text
Small:  apps/server/src/features/documents/ and crates/db/src/documents.rs
Larger: split related document workflows and data access by responsibility
only when their dependencies or rules need independent ownership.
```

- Keep reads and writes for the same business responsibility together. Do not
  split modules only by database action.
- Split frontend components, hooks, and query modules by responsibility in the
  same way. Separate page rendering from reusable query definitions and
  distinct interactive workflows. Do not move a large component into an
  equally broad hook. Do not create a folder for each operation in advance.
- Follow feature domains for service and repository boundaries. Each workflow
  depends only on the domain services or repositories it uses. Use focused
  Rust services for these dependencies. Do not collect domain APIs under
  `CoreDb`, `AppService`, or another application-wide service, even as named
  groups. Share database connections and runtime setup, not business APIs.
  Do not add forwarding-only services.
- When splitting a file, update callers, package exports, and schema
  registration in the Rust workspace and migration crate. Use concrete module
  paths. Do not keep a re-export-only barrel at the old path.
- Extract a shared package only for clear ownership, runtime isolation, or
  actual reuse. Do not create packages to match every domain folder.
- Add auth, cache, queue, storage, AI, and job modules only when required.
  Existing packages stay in place; do not remove them as part of an unrelated
  task.

## Architecture boundaries

Request flow through the Axum backend:

```text
Simple CRUD:       client → HTTP handler → database service → PostgreSQL
Business workflow: client → HTTP handler → feature service → database/adapters
```

Import direction is separate from request flow. Frontend code imports only
browser-safe generated API types and client modules. Server assembly imports
handlers and shared state; features call owning data services and adapters.
Shared frontend packages never import Rust server implementation or secrets.

### Browser and data boundaries

- Browser code calls the typed `openapi-fetch` client. Never import server or
  database implementation into browser code. Keep SSR credentials request-local.
- Keep database access in the Rust database boundary, grouped by domain.
  Keep SeaORM entities, constraints, and related queries with their owners.
  Use SeaORM migrations for reviewed database changes.
- Validate inputs and mutation values at the server boundary and enforce
  domain invariants before writes. Map database failures to typed Rust errors.
  Validate untrusted external data and conversions; database types alone do not
  guarantee business invariants.
- Reuse the project's ID helper or an appropriate platform API.

### Handlers and domain workflows

- Keep handlers thin. Call a database service directly only when the operation
  needs request validation, identity and permission checks, and one persistence
  call. Enforce permissions before protected operations. A call may use a
  transaction, not just one SQL statement.
- Put business decisions, multi-step operations, and shared workflows in the
  owning feature service. Do not add forwarding-only services. Reuse domain
  permission checks from HTTP handlers, jobs, and scripts.
- Keep SQL and atomic writes in database services. Cross-domain calls use the
  owning service, not its handlers. Keep dependencies directional and acyclic.
  Put multi-domain workflows in their owning domain or a named workflow module.

### Integration ownership

- Keep reusable integrations in Rust modules or crates when ownership or reuse
  warrants it. Server platform modules adapt them to requests; do not duplicate
  implementation. Keep storage, AI, and job workflows with their domain.
- Adapters must not import feature implementations. Entry points register
  handlers and assemble shared state and resources. Keep code local until reuse
  is real; do not add catch-all helper or service folders.

### Import enforcement

- Configure supported frontend import restrictions in `bunfig.toml` and use
  Cargo crate boundaries for Rust. Reject browser imports of server code and
  cross-feature handler imports. Cover aliases and relative paths.
- Verify allowed and rejected imports with the pinned tools. Report any gap
  rather than claiming enforcement. Import concrete modules rather than adding
  re-export-only barrels. Entrypoints may contain actual assembly logic.

## Rust application patterns

### Types and execution boundaries

- Use precise Rust types and `Result` for expected errors. Map external errors
  at integration boundaries without exposing internal details to clients.
  Use async APIs for I/O and keep blocking work off async executor threads.
- Use explicit shared application state and request-scoped identity. Do not
  create a runtime or connection pool per request.

### Resources and concurrency

- Use Tokio task ownership and structured shutdown. Bound concurrency against
  database, Redis, storage, and upstream limits. Use bounded retries and
  backoff only for transient failures; make retried writes idempotent.
- For streams, verify backpressure, cancellation, disconnects, and limits.
  Process-local tasks and caches do not replace durable jobs or shared storage.

### Observability and library scope

- Use `tracing` with configured structured sinks and redact private data.
  Create or accept a request ID at every public boundary, return it in a
  response header, and propagate it through jobs and outbound requests. Use
  W3C `traceparent` when tracing is enabled.
- Trace HTTP handlers, domain services, database and cache calls, and workers.
  Configure sampling; retain error and slow-request sampling at least as high
  as normal traffic. Record endpoint rate, errors, and duration; queue depth,
  age, failures and retries; pool saturation, cache hit rate, CPU, and memory.
  Keep labels bounded and exclude user IDs, emails, and raw URLs.
- Include timestamp, level, service, environment, release, request or job ID,
  route, duration, and outcome in structured logs. Log errors once at the
  handling boundary with safe context. Never log bodies, credentials, cookies,
  authorization headers, payment data, or personal data.
- Add `/health` for liveness and `/ready` for readiness when used by the
  platform. Alert on sustained 5xx, p95 latency, backlog, repeated job failures,
  database saturation, and auth failures. Give alerts owners and runbooks; set
  retention from cost and privacy needs. Capture browser errors and Web Vitals
  only through the approved analytics path.

## HTTP and OpenAPI

### Contracts and authorization

- Use ordinary JSON HTTP methods, paths, statuses, and bodies for application
  calls. Do not use RPC or hand-written RPC envelopes. Define Rust request and
  response DTOs with Serde and utoipa annotations. Validate requests and enforce
  domain permissions for every protected operation, including jobs and scripts.
- Generate OpenAPI from registered Rust endpoint and schema definitions using
  utoipa; verify the pinned utoipa Axum integration and its registration rules.
  Document paths, parameters, JSON bodies, responses, errors, and security.
  Ensure the generated spec matches actual router and validation behavior.

### Server assembly and request lifetime

- Assemble the Axum router and process-wide state in `apps/server/src/main.rs`.
  Share resource handles instead of constructing pools for each request.
  Handle cancellation, bounded request work, listener shutdown, and task cleanup
  using APIs supported by the pinned Axum and Tokio versions.

### Routing and public boundaries

- Route API, authentication, webhook, health, and OpenAPI requests before SSR
  or static fallback. Unknown API routes must not return frontend HTML.
- Keep API calls and cookies same-origin. Enable cross-origin access only for
  a stated requirement, with explicit origins and credentials. Return safe,
  documented public errors; keep internal errors server-only. Scripts and
  workers call owning services and reuse permissions and business rules.

### OpenAPI support

- Serve the generated specification at `/openapi.json` from the backend or
  preserve an existing specification URL. Apply the project's access policy
  to the specification and interactive documentation. Exclude secrets and
  internal-only schemas from public documents.
- Generate TypeScript types from that same spec with `openapi-typescript` and
  use `openapi-fetch` in `packages/api`. Provide a deterministic offline spec
  export from the same Rust OpenAPI definition without starting services.
  Pin tooling, document actual project scripts, and regenerate after contract
  changes. Check spec and generated type drift in CI. Do not hand-edit generated
  files or assume generated types validate network responses at runtime.
- Use Zod for frontend-specific runtime validation where needed. Do not claim
  a Zod schema is automatically derived from OpenAPI or duplicates no work;
  keep its accepted values aligned with the server contract.

## Environment and validation

### Configuration and secrets

- Read and validate Rust server configuration in one server-only module before
  use. Pass validated connection settings and credentials explicitly to
  integrations. Do not scatter environment reads through services.
- Use `packages/env` with Zod for approved public frontend values only.
  Framework `import.meta.env` values are not server secrets. Do not expose
  credentials through client exports, logs, errors, responses, or build output.
- Give CI jobs that execute the app valid isolated configuration. Static
  tooling and OpenAPI export must not start the app or connect to services.
  Keep `.env` and secret files untracked.

### Local services and session security

- Use local PostgreSQL and Redis containers through Docker Compose. Podman may
  run equivalent containers when Docker is unavailable. Use isolated storage
  resources for development. Do not connect local QA to production data.
- Preserve existing session names and expiry contracts. Set `httpOnly` and
  secure production cookie settings. Prefer host-only cookies with
  `sameSite: lax`; use `none` only when required, with `secure` enabled.
  Protect state-changing requests from CSRF.
- For OAuth/OIDC, verify state, PKCE, callback targets, issuer, signatures,
  audience, expiry, and identity schemas. Validation is not authentication.

## Security hardening

- Set security headers at the public origin. Use HTTPS only in production and
  HSTS with `includeSubDomains` after verification. Set
  `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, and a
  `Permissions-Policy` that denies unused capabilities. Set
  `frame-ancestors 'none'` unless embedding is required.
- Use a Content Security Policy with nonces or hashes. Do not allow
  `unsafe-eval`. Allow `unsafe-inline` only for a verified framework
  requirement. Allow only required origins for scripts, connections, images,
  frames, and workers. Include the analytics hosts, Polar API, and the PWA
  service worker (`worker-src 'self'`).
- Rate limit public endpoints at the edge and in the application. Apply
  stricter limits to sign-in, token, password, upload, checkout, and webhook
  paths. Limit by IP and by authenticated user or tenant. Return `429` with
  `Retry-After`. Do not rely on client-side limits.
- Verify webhook signatures, timestamps, and replay windows before processing.
  Make handlers idempotent. Queue slow work and acknowledge within the provider
  timeout. Keep webhook routes public but rate limited and outside session
  authentication.
- Validate every outbound URL against an allowlist. Block loopback, link-local,
  private, and metadata addresses for user-supplied URLs. Use HTTPS and limit
  redirects. Do not fetch arbitrary URLs from server code.
- Scope every tenant-owned query and mutation by tenant ID at the service
  boundary. Deny by default. Do not trust tenant IDs from the client. Add
  authorization tests for cross-tenant reads and writes.
- Keep CORS closed by default. Allow only known origins, methods, and headers.
  Do not combine wildcard origins with credentials.
- Keep dependencies pinned and the lockfile committed. Run the package manager
  audit in CI. Review new dependencies, install scripts, and licenses. Do not
  add a package to solve a problem that platform APIs cover.
- Rotate secrets on a schedule and after exposure. Use separate values for
  development, preview, and production. Store them in the platform secret
  store. Never send secrets to the client, logs, analytics, or error reports.
- Return safe error messages to clients. Log details with a correlation ID
  server-side. Do not expose stack traces, SQL, provider responses, or
  configuration values.

## OpenAuth authentication

### Client and subject contract

- Use the existing `https://auth.yopem.com` OpenAuth issuer. Obtain the actual
  client ID, callback URL, subject names and fields, discovery metadata, token
  format, and verification requirements from the issuer and project. Do not
  invent them or deploy a second issuer. OpenAuth is an OAuth issuer; do not
  assume it implements OpenID Connect.
- Use a Rust OAuth client and a compatible verifier only after checking the
  issuer's real endpoints, signing algorithms, key rotation, claims, audience
  semantics, and subject representation. OpenAuth documents OAuth authorization
  server metadata and its own verification client; this does not by itself
  prove compatibility with a particular Rust crate. Validate the issued subject
  against the real contract after cryptographic verification.

### Authorization and token lifecycle

- Implement same-origin `/auth/*` handlers in Axum for authorization, callbacks,
  code exchange, refresh, and logout. Browser redirects may visit the issuer.
- Use authorization code with PKCE when the issuer supports it. Bind state and
  verifier to the initiating browser session, expire and consume them once,
  and verify state before exchange. Use the approved callback URL and accept
  only safe application-local return paths.
- Verify signature, allowed algorithm, trusted issuer, expiry, and audience or
  client binding according to the issuer's actual token contract. Handle key
  rotation and reject invalid or unverifiable tokens. Decoding is not
  verification. Keep authorization separate from identity. If these contracts
  or Rust compatibility cannot be established, report a blocker.
- Keep tokens in server-managed sessions or secure HTTP-only app cookies, not
  browser storage. Persist refreshed tokens when returned. Clear app sessions
  on logout or invalid refresh credentials; do not claim issuer revocation.
  Keep cookies host-only, preserve CSRF rules, and never log tokens, codes,
  or PKCE verifiers.

## TanStack and application patterns

### Routes and navigation

- **Route organization:** use directory-based file routing in TanStack Start
  and TanStack Router. Use folders for path segments, not dot-separated route
  files such as `_desk.edit.$slug.tsx`. Put page UI in `home/index.tsx`, not
  `home.tsx`. Put dynamic pages in `$slug/index.tsx`, not `$slug.tsx`.
  Keep the root index in `routes/index.tsx`.
- Use parenthesized route groups such as `(_desk)/` to organize related routes
  without adding a URL segment. For example, use
  `routes/(_desk)/edit/$slug/index.tsx` for `/edit/$slug`.
  A route group does not create a layout or a route-level guard.
- Use `route.tsx` only when a directory needs a parent route for shared layout
  or route behavior. Use `_desk/route.tsx` for a pathless layout and put its
  child routes in that directory. Keep `__root.tsx` as the root route.
  Do not replace an existing `_desk` layout with `(_desk)` grouping and lose
  its shared UI or guards. Preserve URLs, nesting, and access checks when
  changing route files. Do not reorganize unrelated routes.
- **Typed navigation:** use TanStack `Link`, `navigate`, and redirects with
  typed `to`, `params`, and `search`. Do not build internal URLs by joining
  strings. Use normal anchors for external links.
- **URL state:** put shareable filters, sort order, pagination, and selected
  tabs in search params. Validate them with `validateSearch` and the stack's
  schema library. Keep temporary UI state, such as open dialogs, in components.
- **Route data:** use loaders for data needed before a page renders. Reuse
  feature query options and the shared QueryClient cache; do not add duplicate
  query keys or API calls. Declare search params used by loaders in
  `loaderDeps`. Do not add loaders to pages that do not need them.
- **Shared layouts:** render `Outlet` in parent layout components. Keep index
  page UI in the child `index.tsx`. Do not add parent routes only to match the
  folder structure.
- **Route access:** use `beforeLoad` for route access checks and redirects
  before protected loaders run. Validate login return paths as application-local
  paths. Server code must authorize each protected operation; client route
  guards are not security boundaries.
- **Route feedback:** set shared pending, error, and not-found UI defaults.
  Override them only when a route needs different feedback or recovery. Report
  missing records with `notFound`, not an empty success screen. Do not require
  separate feedback files for each route.
- **Route-local files:** prefer existing feature modules for components, hooks,
  and queries. When files must stay beside a route, use the route generator's
  ignored `-` prefix, such as `-components/`. Do not let helper files become
  routes. Preserve the project's configured ignore rules.
- **Route changes:** check URLs, route IDs, typed links, params, search
  validation, layouts, and guards after moving route files. Let the route
  generator update `routeTree.gen.ts`; never edit it by hand. Verify affected
  direct links and navigation, including denied access and missing records.

### Page composition

- **React components and TanStack Start routes:** write page UI directly in
  `index.tsx` or the matching route file. Define the route component there and
  register it with the route. Never create separate page components such as
  `inbox-page.tsx` or `InboxPage` outside the route file. Do not make a route
  render only an imported page component.
- Keep components small, focused, and reusable. Extract UI parts such as
  filters, lists, and forms when they have a distinct responsibility or actual
  reuse. Compose these parts in the route file; do not extract the whole page.
  Do not split components only to reduce line count. Keep reusable query options
  and focused hooks in their owning feature modules.

### Queries and forms

- Never spread TanStack Query query or mutation result objects. This includes
  `...query`, `{ ...query }`, `...mutation`, and `{ ...mutation }`. Read or return
  only the required properties explicitly. This rule does not apply to query
  or mutation option objects.

- **TanStack Query:** `packages/api` owns the typed HTTP client and shared
  adapters. Feature `queries.ts` modules own query keys and reusable query
  and mutation options. Pass cancellation signals where supported. Hooks and
  components consume options; do not use raw `fetch` in components or duplicate
  definitions. Preserve existing placement until a migration is part of the task.
- **TanStack React Form:** use `useForm` with Zod through supported Standard
  Schema integration. Validate required fields on blur and submit, not on
  change or mount. Repeat validation on the server.

- **TanStack Table, when needed:** use `@tanstack/react-table` for tables that
  need sorting, filtering, selection, or pagination. Use existing UI components
  for rendering. Do not install it for a plain static table.
- **TanStack Virtual, when needed:** use `@tanstack/react-virtual` for large
  lists or tables when rendering all rows causes measured performance
  problems. Keep keyboard navigation and accessibility intact.

### Server integration and optional features

- **Server-only web logic:** use `createServerFn` only for framework-specific
  server integration that cannot use the application HTTP client. Do not use
  it as an alternative API layer. Keep integration code server-only.
- **AI, when needed:** keep Rust provider setup and execution server-side.
  Validate structured output and tool inputs at the server boundary.

- Use `lucide-react` icons only, with the `Icon` suffix in import names.

## Yopem UI and StyleX

### Source installation and styling

- Read https://ui.yopem.com/docs/installation and each component's documentation
  before setup or use. Run a compatible `@yopem-ui/cli` with Bun to initialize
  `apps/web` and add components under `apps/web/src/components/ui/`.
  Keep the CLI record at `apps/web/ui.json`. Define web `@/*` as `./src/*`
  in `apps/web/tsconfig.json`; use `@/components/ui/...` and `@/lib/...`.
  Keep browser setup and UI helpers in `apps/web/src/lib/` and optional semantic
  tokens in `apps/web/src/styles/tokens.stylex.ts`. Verify the pinned CLI's
  commands.
- Do not create a `packages/ui` package. Each target owns its UI because web,
  desktop, mobile, and extension use different primitives and layout systems.
  Keep web primitives in `apps/web/src/components/ui/`. If a shared UI package
  already exists, preserve it until the user requests migration to the owning
  apps; do not add new components there.
- Components are copied source, not a runtime component package dependency.
  Import the installed local modules. Keep `ui.json` as the CLI's file record.
- Use Yopem UI components before adding custom controls or Base UI primitives.
  Keep semantic elements, accessibility, event handlers, and refs intact.
- Use `stylex.create` and semantic tokens. Pass styles through `xstyle` on
  Yopem UI components and `stylex.props(...)` on native or framework elements.
  Use component props such as `variant` and `size` before local overrides.
- Change shared tokens for application-wide styles. Preserve readable contrast
  and focus, hover, and disabled states. Do not add Tailwind.

### Theme and tooling integration

- A fixed theme needs no provider. Add Yopem UI's theme runtime only for theme
  switching. In SSR, place its script before hydration and use matching defaults
  for the script and provider. Pass the CSP nonce when required.
- Keep the CLI's StyleX build integration, aliases, root styles, and lint rules.
  Merge compatible lint and format settings into `bunfig.toml`. Preserve
  CLI behavior and existing project settings during this merge. If required
  settings cannot be preserved, report a blocker; do not add a second runner.
- Register `@yopem-ui/oxlint-plugin` only after verifying Bun compatibility.
  Preserve the recommended rules and `no-raw-stylex-colors`. Keep the documented
  overrides for copied primitives and document shells. Match component source
  paths to the repository layout. For the default layout, target copied
  primitives with `apps/web/src/components/ui/**` from root lint config, or
  `src/components/ui/**` from web-local config. Resolve CLI aliases and StyleX
  source paths from `apps/web`; include its components and token module.
  For an existing shared UI package, keep its actual paths and lint overrides.
- Run a production build after UI setup or token changes. Check StyleX CSS
  extraction and SSR behavior.

## Accessibility

- Meet WCAG 2.2 AA for every web screen. Treat accessibility as a release
  requirement, not a QA afterthought.
- Prefer semantic HTML and the accessible Yopem UI and Base UI primitives.
  Keep native roles and keyboard behavior. Do not replace a button, link, or
  input with a clickable `div`.
- Give every control a programmatic label. Connect help text and errors with
  `aria-describedby`, set `aria-invalid`, and move focus to the first invalid
  field on submit. Use a live region for asynchronous status and errors.
- Support full keyboard operation. Provide a visible focus indicator, a skip
  link, logical focus order, and focus return after dialogs and menus. Never
  trap focus outside a modal.
- Manage focus on route changes and announce the new page title. Keep one `h1`
  per page and do not skip heading levels.
- Meet contrast requirements: 4.5:1 for normal text and 3:1 for large text and
  interactive boundaries. Do not use color alone to convey state.
- Respect `prefers-reduced-motion`. Avoid autoplay, flashing, and motion that
  cannot be paused. Keep content usable at 200% zoom and 400% reflow, and at
  increased text spacing.
- Use touch targets of at least 24 by 24 CSS pixels, with 44 by 44 preferred.
  Keep controls usable with one pointer and with touch.
- Give images useful `alt` text and mark decorative images empty. Hide
  decorative icons from assistive technology and give icon-only buttons an
  accessible name.
- Use table captions and header scopes. Announce sort changes with `aria-sort`.
  Do not use tables for layout.
- Test with a keyboard only, at high zoom, and with a screen reader before
  release. Add automated checks only as a supplement, not as the only test.
- Desktop GPUIX: set `role` and `aria-label` on custom controls. A clickable
  `div` is not a button until it has `role="button"`. Use `aria-id` for stable
  automation IDs and the supported state attributes. GPUIX exposes this tree
  through AccessKit on macOS, Windows, and Linux. Test with the platform
  accessibility inspector.
- Mobile Expo: use `accessibilityRole`, `accessibilityLabel`,
  `accessibilityState`, and `accessibilityHint`. Support dynamic type, screen
  readers, and 44-point targets. Test with VoiceOver and TalkBack.
- Browser extension: keep popup and options keyboard accessible. Do not let
  content-script UI trap focus or hide the host page from assistive
  technology. Expose extension controls with normal web semantics.

## PWA, SEO, and analytics

### PWA and offline

- Every web app is a PWA. Ship a web manifest, a service worker, install
  icons, and an offline fallback. Use `vite-plugin-pwa` with the pinned Vite
  and TanStack Start setup.
- Keep `manifest.webmanifest` and icons in `public/`. Provide 192 and 512 pixel
  icons, a maskable icon, `start_url`, `scope`, `display: standalone`, theme
  color, and background color. Do not put secrets in the manifest.
- Precache only build assets and public static files. Use a network-first
  policy for navigation and a clear offline fallback. Never cache `/api`,
  `/auth`, webhook, checkout, or authenticated HTML responses.
- Register the service worker in the browser only, after the app loads. Do not
  register it during SSR, build, or test. Prompt before activating a new
  version, and remove old caches on activation.
- Serve `sw.js` from the origin root with `Cache-Control: no-cache` and
  `Service-Worker-Allowed: /`. Set `worker-src 'self'` in the CSP. Do not load
  a service worker from another origin.
- Verify installability, offline fallback, update, and cache cleanup in QA.
  Test with the network offline and with a slow connection.

### SEO and discoverability

- Render public content on the server. Do not depend on client JavaScript for
  titles, descriptions, or primary content.
- Set a unique title, meta description, canonical URL, and Open Graph and
  Twitter metadata for every public route. Use the route `head` API.
- Generate `sitemap.xml` from public routes and serve `robots.txt`. Exclude
  authenticated, preview, checkout, and duplicate URLs. Use `noindex` on
  private and staging pages.
- Add structured data only for real entities, such as Organization, WebSite,
  Product, and BreadcrumbList. Keep it consistent with visible content.
- Use one canonical host and one trailing-slash policy. Redirect permanent
  moves with `301`. Return `404` for missing pages and `410` for removed
  content.
- Keep URLs stable and human-readable. Do not put session IDs or personal data
  in URLs.
- Do not index extension pages, desktop views, or mobile-only screens. Do not
  add SEO metadata to the PWA offline page.

### Analytics

- Use Google Analytics 4 and Umami through one analytics module in the web
  app. Do not call `gtag` or `umami` from components.
- Configure both providers through `.env` and the public client config:
  `PUBLIC_ANALYTICS_ENABLED`, `PUBLIC_GA_MEASUREMENT_ID`,
  `PUBLIC_UMAMI_SCRIPT_URL`, and `PUBLIC_UMAMI_WEBSITE_ID`. Configure Vite's
  `envPrefix` as `PUBLIC_`. Expose only public values with this prefix. These
  IDs are public, not secrets.
- Load a provider only when its ID is present and analytics is enabled. Do not
  fail the app when a value is absent. Disable analytics in tests and local
  development unless explicitly enabled.
- Set Google Analytics Consent Mode defaults to denied before loading the tag.
  Load Google Analytics only after consent where law or policy requires it,
  then update consent from the choice. Umami is cookieless by default, but
  disclose it in the privacy policy.
- Track a small, documented event taxonomy. Use stable names and a typed
  `trackEvent` helper. Track page views from one router subscription, not from
  every component.
- Never send names, emails, user IDs, tokens, payment data, free-text input, or
  URLs with query strings. Use opaque IDs only when necessary.
- Allow the analytics and Polar origins in the CSP. Do not cache analytics
  scripts in the service worker. Keep analytics for web only unless the
  project explicitly requests another target.

## Payments with Polar

Add Polar only when a requested feature needs payments or subscriptions.

- Keep Polar server-only. Use `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`,
  product IDs, and `POLAR_ENVIRONMENT` through validated server config. Never
  expose the access token or webhook secret to the client.
- Create checkout sessions on the server from a configured product ID and the
  authenticated customer. Redirect to Polar hosted checkout. Do not collect
  card data or embed payment fields.
- Verify webhook signatures and timestamps before parsing. Reject invalid
  requests with `403`. Deduplicate by webhook event ID and make handlers
  idempotent. Acknowledge quickly and queue slow fulfillment.
- Store provider customer, subscription, order, and event IDs. Derive
  entitlements from subscription status in the database. Check entitlements at
  the service boundary; do not trust client flags.
- Handle activation, renewal, cancellation, past-due, refund, and revocation
  events. Keep a reconciliation job or endpoint for missed webhooks.
- Use the Polar customer portal for payment method and subscription changes.
  Do not build card management.
- Use sandbox mode for development and tests. Never use production keys in
  local or preview environments.
- Use a verified Rust SDK or documented Polar HTTP API and a compatible
  signature verifier. Check their pinned versions and webhook format first.

## Rust data, storage, and background work

### PostgreSQL through SeaORM and SQLx

- Use SeaORM as the primary ORM. Use SQLx for parameterized direct SQL only
  when needed, within the owning data service. Never concatenate untrusted SQL.
- Configure a bounded process-wide pool, not one pool per request. SeaORM uses
  SQLx internally; verify the pinned versions' supported pool-sharing API and
  SQLx compatibility before sharing the exact pool with direct SQLx queries.
  Do not assume pool types or invent APIs. If sharing cannot be verified, stop
  and resolve the compatibility issue before adding a second pool.
- Validate operation inputs, mutation values, and domain invariants. Use typed
  errors. Keep atomic writes in PostgreSQL transactions; verify rollback and
  propagation across SeaORM and SQLx. Do not claim operations share a transaction
  merely because they share a pool. If mixed operations cannot use the same
  transaction, use one supported path or report the limitation.
- Set bounded timeouts and verify cancellation behavior. Do not retry uncertain
  writes without idempotency. Apply reviewed versioned SeaORM migrations through
  one migration history as an explicit release step. Back up and confirm the
  target before destructive changes. Do not use schema push on shared data.
- Use a local private database inspection tool only when needed; manual edits
  bypass application validation and do not replace reviewed migrations.

### Redis

- Use the Rust `redis` crate when needed. Verify connection management,
  transactions, scripts, locks, and pub/sub against its pinned version.
- Keep key names, serialization, TTLs, invalidation, and error mapping in
  owning cache services. Validate decoded values. Separate users, workspaces,
  environments, and schema versions in keys. Never expose private values in
  public caches. Specify outage and miss behavior; authorization fails closed.
- Use atomic operations for coordination. In-process caches do not coordinate
  multiple processes.

### Objects through S3-compatible storage

- Use the Rust AWS SDK for S3 with verified endpoint and credential settings
  for R2 or the selected S3-compatible service. Keep credentials server-only.
- Put reusable storage access in server platform modules and domain keys and
  workflows in the owning feature. Validate size, type, magic bytes, ownership,
  and download permissions. Use bounded streams with backpressure and cancellation.
- Presigned URLs are bearer access: authorize first, use short expiry, restrict
  operations and keys, and never log URLs. Model partial failure, cleanup, and
  idempotency across PostgreSQL, Redis, and object storage.

### Background work and media

- Use bounded Tokio tasks for in-process work and shut them down gracefully.
  In-memory work does not survive process failure. When durability is needed,
  choose and verify a Rust-compatible queue and Redis integration; do not assume
  BullMQ protocol compatibility or add job infrastructure in advance.
- Keep queue names, payloads, producers, workers, and connections in their
  owning Rust modules. Workers call domain services, not copied workflows.
  Validate payloads at dequeue; pass IDs and small values, not secrets or large
  objects. Make jobs idempotent, bound attempts and backoff, set retention,
  preserve failure evidence, and acknowledge only after required writes succeed.
- Run workers in a dedicated Rust process or the server process, not web SSR.
  Do not start workers during build, lint, or static checks. Verify delivery,
  retries, shutdown, and Redis connection lifecycle for the chosen queue.
- Use the Rust `image` crate for requested image processing. Bound input bytes,
  dimensions, processing concurrency, and output size; verify format support.

## Code conventions

### Types, declarations, and imports

- Keep type safety. Do not use `any`, `as any`, or `as unknown as`. Use accurate
  types, generics, narrowing, and schema decoding instead of unsafe assertions.
- Use `const` when TypeScript reassignment is unnecessary. Use Rust `tracing`
  for server logs. Do not use `console.log`; use appropriate console levels
  in frontend tooling only when needed.
- React components and hooks use named `export function` declarations. Do not
  use default exports for React code.
- Prefer function declarations for named functions. Let shared lint rules govern
  anonymous callbacks.
- Prefer inferred return types unless a public contract needs an explicit type.
- Use static imports. Do not use `await import()`.
- Omit file extensions where the bundler supports this. Use valid Node.js ESM
  imports for scripts that run without a bundler.

### Clarity and check failures

- Add comments only for behavior that clear names and structure cannot explain,
  or for a required lint safety justification.
- Apply the Readability contract to components and functions. Keep each
  responsible for one coherent task.
- Fix check failures at their source. Refactor the code and try a solution
  that satisfies the rule before considering a suppression. Do not weaken
  types, remove assertions, or change rule settings to hide failures.

## Build and deployment

### Build artifacts and server integration

- Build the Rust backend with Cargo using the pinned toolchain and lockfile.
  Package its executable and required runtime assets in a suitable container.
- Build TanStack Start with its supported frontend pipeline. Inspect the pinned
  framework's SSR entrypoint and assets. Run SSR under Bun with a verified
  adapter. Keep its listener behind the same public origin as Axum. Do not
  claim a generic Web handler mounts in Axum without verifying streaming,
  errors, cookies, and static assets.

### Runtime and release safety

- Pin tested Rust build and compatible runtime images, plus the Bun revision for
  web SSR. Avoid floating `latest` tags. Install frontend dependencies with
  `bun install --frozen-lockfile`; use Cargo's locked mode for Rust builds.
- On termination, stop accepting requests, allow bounded draining, stop owned
  tasks, and close resources. Check container signal delivery during requested QA.
- Run migrations as an explicitly approved release step. Rollback does not undo
  database or object changes. Keep backups and recovery steps. Isolate services
  and secrets across environments. Do not add infrastructure tooling unless
  requested; the documentation-app rule below permits Alchemy for that site.

### Documentation apps

- If `apps/docs` or `apps/documentation` exists, use Alchemy
  (https://alchemy.run) to deploy its documentation site to Cloudflare Pages.
  Do not create a documentation app when none exists. This site is separate
  from root `docs/`, which holds ignored local work notes.
- Keep its Pages resource in root `alchemy.run.ts`. Reuse the existing Alchemy
  program when present. Use the docs app's build command and verified static
  output directory. Check the pinned Alchemy release's Pages support before
  selecting APIs; report unsupported builds or APIs as blockers.
- This separate documentation deployment does not change the application's
  runtime or deployment model. Keep application services out of the Pages site.
- Keep deployment credentials and Alchemy state out of git. Follow the existing
  environment isolation and deployment approval rules before a live deploy.

## Local and CI checks

- Do not install Git hooks, Lefthook, or custom snapshot check scripts.
  Preserve unrelated user-managed hooks. Do not gate commits or pushes on
  a Bun version or revision.
- CI runs only lint, format checks, and typechecks after tool/dependency setup.
  Do not add builds, audits, contract drift, tests, or deployment to CI without
  an explicit request. Keep failures visible; do not suppress diagnostics.
- Run ordinary lint, format checks, and typechecks locally by default.
  Other QA follows the approval rules in Validation workflow.
- Use native Bun for frontend checks and Rustfmt, Clippy, and Cargo checks
  for Rust. Cover the owning workspaces and affected dependents.


## Validation workflow

### Implementation first; QA execution later

- Complete all requested implementation before running QA. During implementation,
  do not run automated tests, browser checks, endpoint probes, or other runtime
  validation unless the user explicitly requests them.
- Do not create test files, fixtures, test libraries, runners, or test
  configuration by default. Preserve existing tests and CI. Do not disable,
  delete, untrack, or weaken them to avoid checks.
- Before implementation, identify expected behavior and relevant failure cases.
  Record these as pending cases in the repository-root `QA.md`. This is a QA
  plan, not test execution or test implementation.
- Create `QA.md` if it does not exist. Read and update it if it exists. Maintain
  one shared file for the repository, including all affected workspaces.
  Do not create a separate QA file for each task or package.
- Update `QA.md` as implementation changes. Before handoff, add every remaining
  check needed for the completed work. Include affected existing behavior,
  integration boundaries, and regressions, not only new features.
- Do not start QA automatically when implementation ends. Leave the checklist
  ready for a separate QA pass. Run it only when the user requests QA or
  explicitly includes verification in the task.
- Run relevant lint, format, and typecheck commands by default after changes.
  Fix failures and rerun the affected commands. Preserve unrelated changes
  when formatting. Keep CI and Lefthook checks enabled.
- Review the changed source and instructions for consistency without running
  the application. Written plans and source review do not prove runtime success.
- Run lint, format, and typecheck without separate approval, including during
  implementation. Other verification requirements define cases to record in
  `QA.md`, not permission to run them during implementation. This includes
  browser, API, build, import-boundary, and deployment checks. A check script
  that also runs restricted work needs approval for that work.

### Required detail in `QA.md`

- Group cases by feature or changed workflow. State the task, affected files,
  routes, endpoints, roles, dependencies, and related acceptance requirements.
- Give each case a stable ID, such as `QA-001`, and an unchecked checkbox.
  State priority: P0 for security or data loss, P1 for core behavior, and P2 for
  secondary behavior. Run higher-priority cases first during the QA pass.
- Write one independently verifiable scenario per checkbox. Do not use vague
  tasks such as "test auth", "check edge cases", or "verify the UI".
- For every case, include all of the following:
  - **Purpose:** the requirement, change, or regression the case covers.
  - **Prerequisites:** environment, services, configuration names, user roles,
    permissions, and required starting state. Never include secret values.
  - **Inputs:** exact safe example values, records, IDs, and boundary values.
    Explain how to create isolated data and identify dependencies between cases.
  - **Steps:** numbered, repeatable actions with exact routes, controls, or
    commands. State the working directory for commands. Use existing project
    scripts and tools; do not invent commands or unsupported API payloads.
  - **Expected results:** observable UI state, exact response status, relevant
    headers and body values, stored changes, and effects that must not occur.
    A successful HTTP response alone is not enough.
  - **Evidence:** the sanitized screenshot, trace, response, log, or report to
    save, its local path, and what the reviewer must inspect.
  - **Cleanup:** how to remove isolated data, restore settings, and stop only
    processes started for the case. State when no cleanup is needed.
  - **Status:** pending, passed, failed, or blocked. New cases start pending.
    For blocked cases, state the missing prerequisite and how to resolve it.
- Use realistic values from the implementation and documented contracts. If a
  value or command is unknown, mark it as a blocker with a discovery step.
  Do not present guesses as executable instructions.
- Include setup, execution order, environment URLs, existing server ports,
  required tool versions, and artifact locations in a shared setup section.
  Reference that section from cases instead of copying long setup instructions.
- Include a coverage map from each acceptance requirement and changed workflow
  to case IDs. Explain any gap. Mark irrelevant categories as not applicable
  with a reason; do not add generic filler cases.
- Preserve unrelated cases and their evidence. Merge duplicate pending cases.
  Add a new case or reopen an affected case when behavior changes. Keep prior
  results identified with their tested revision; do not carry a pass forward
  as proof for changed code.
- Keep cases unchecked until they pass in a requested QA run and their evidence
  has been inspected. Record the tested revision, environment, date, actual
  result, and evidence path. Failed and blocked cases remain unchecked.
- Keep `QA.md` free of credentials, personal data, production record dumps,
  and sensitive logs. Keep QA artifacts local and uncommitted. Add their exact
  paths or a dedicated local directory to `.gitignore` before creating them.
- For documentation-only work, record relevant text and link checks. Do not
  require browser sessions or source tests when the change does not need them.

### Coverage checklist for affected behavior

Apply every relevant category below to the actual implementation. Expand each
applicable category into concrete cases with the details required above.

- **Acceptance and regression:** main user workflows, each requirement, original
  bug reproduction, expected fix, and adjacent workflows that share changed code.
- **Input validation:** missing, empty, whitespace-only, malformed, duplicate,
  minimum, maximum, and over-limit values. Cover Unicode, invalid IDs, unknown
  fields, unsafe URLs, and date or time-zone boundaries when applicable.
- **Authentication and authorization:** anonymous, expired, invalid, and revoked
  sessions; each allowed and denied role; cross-user and cross-workspace access;
  direct API requests that bypass UI guards; and no mutation on denied requests.
  Include login, callbacks, refresh, logout, and safe return paths when changed.
- **Security and privacy:** injection, rendered untrusted content, CSRF, browser
  CORS and cookie rules, redirect safety, secret exposure, sensitive error and
  log content, private cache isolation, and upload or download permissions.
- **PWA, SEO, and analytics:** manifest and icons, installability, service
  worker registration and update, offline fallback, cache exclusions, update
  cleanup, unique metadata and canonical URLs, sitemap and robots, noindex on
  private pages, consent state, event names, route page views, and no personal
  data in events.
- **Payments, when Polar is in scope:** checkout redirect, success and cancel
  returns, webhook signature and replay, idempotency, entitlement changes,
  failed payment, refund, and sandbox isolation.
- **API contracts:** method and path, request and response validation, statuses,
  headers, error shapes, content type, pagination, sorting, filtering, and
  compatibility with existing clients. Include unsupported methods and missing
  resources where affected.
- **Data integrity:** create, read, update, and delete results; persistence after
  refresh or reconnect; constraints, relationships, atomicity, rollback on
  failure, migration compatibility, and safe handling of existing records.
  Plan migrations and recovery only on isolated data with an approved target.
- **Concurrency and recovery:** repeated clicks, duplicate requests, parallel
  writes, race conditions, idempotency, bounded retries, timeouts, cancellation,
  partial failures, offline behavior, and recovery after dependency failures.
- **UI and navigation:** initial, loading, empty, success, error, disabled, and
  retry states; direct links, reload, back and forward navigation, params,
  search state, layout guards, not-found handling, and unsaved changes.
- **Forms and accessibility:** labels, field validation timing, error messages,
  keyboard-only use, tab order, focus entry and return, screen-reader names,
  announcements, contrast, zoom, reduced motion, and disabled controls.
- **Visual and device behavior:** relevant viewport sizes, overflow, long text,
  touch targets, theme states, supported browsers, hydration, and SSR output.
- **Integrations and background work:** request mapping, upstream failures,
  rate limits, queue redelivery, acknowledgements, dead-letter handling,
  scheduled work, and external side effects. Include only services in scope.
- **Performance and resource use:** realistic data sizes, pagination limits,
  unnecessary requests, cache invalidation, memory or runtime limits, and
  responsiveness. State measurable limits from requirements, not invented goals.
- **Build and release:** applicable existing build, lint, format, typecheck,
  import-boundary, and focused regression commands; dependency and runtime
  compatibility; generated assets; environment bindings; deployment smoke
  checks; and rollback prerequisites. Identify commands that require approval;
  lint, format, and typecheck do not require separate approval.

### Separate QA execution pass

- Read `QA.md` and the current source before execution. Confirm prerequisites,
  user-approved scope, and isolated local or preview resources. Do not use
  production accounts or modify production data without explicit approval.
- Use Playwriter for browser workflows and browser-enforced CORS, cookie, and
  CSRF behavior. Use `curl` for supported HTTP endpoints. Inspect observable
  results, response status, headers, body, side effects, and browser errors.
- Use the generated typed HTTP client or `curl` with the actual documented
  JSON contract. Check responses against the OpenAPI specification and relevant
  runtime validation; do not invent request bodies.
- Use existing tools first. Run only relevant test files or filtered cases,
  never an unrelated whole-project suite. Create focused tests only on explicit
  request. Keep new tests, fixtures, and artifacts local and ignored unless
  the user explicitly asks to commit them. Do not install test libraries.
- A general QA request does not authorize production changes, deployment, or
  destructive operations. Obtain explicit approval for these actions before
  execution.
- Record actual results and inspect evidence before marking cases passed.
  Report failed, blocked, and unrun cases by ID. Never describe implementation
  completion as QA completion when cases remain pending.

## Generated, runtime, and protected files

- Do not manually edit generated route trees, framework caches, or generated
  migration metadata. Use their owning generators.
- Ignore `routeTree.gen.ts`, `.tanstack/`, `.turbo/`, build output, and local
  runtime state. Commit reviewed SeaORM migrations and required migration files.
- Keep Rust server integrations, credentials, and services out of browser
  bundles. Generated frontend API types and client modules must be browser-safe.
- Do not hand-edit generated OpenAPI types. Follow the project's documented
  policy for committing or ignoring generated specifications and types.
- Do not commit secrets, local environment files, credentials, sensitive logs,
  build output, dependency caches, or temporary files.

## Git and completion

- Keep one commit per feature, fix, or context switch.
- Check `git status` before and after work.
- Do not include unrelated files in a commit.
- Before completion, check that each new file belongs to its owning domain
  or shared module. Check that cross-feature dependencies remain acyclic,
  business logic is not copied across entrypoints, and direct database calls
  meet the simple-operation rule in Architecture boundaries.
- Follow the Validation workflow above. Complete the detailed `QA.md`
  checklist before handoff. Report unresolved boundary violations and tooling
  gaps. Do not treat written rules as proof of enforcement.
- Final response must state changed files, the `QA.md` path, pending case IDs
  and priorities, checks actually run, and checks deferred. State clearly when
  implementation is complete but QA has not run.

## Sources

- Bun lint: https://bun.com/docs/lint.
- Bun typechecker: https://bun.com/docs/runtime/check.
- Bun formatter: https://bun.com/docs/format.
- Rust and Cargo: https://doc.rust-lang.org/cargo/.
- Google Rust Style Guide: https://google.github.io/styleguide/rustguide.html.
- Axum: https://docs.rs/axum/.
- SeaORM and migrations: https://www.sea-ql.org/SeaORM/docs/.
- SQLx: https://docs.rs/sqlx/.
- utoipa and Axum integration: https://github.com/juhaku/utoipa.
- OpenAPI TypeScript and openapi-fetch: https://openapi-ts.dev/.
- Zod: https://zod.dev/.
- OpenAuth: https://openauth.js.org/docs.
- Turborepo: https://turborepo.com/docs/crafting-your-repository/configuring-tasks.
- PWA: https://vite-pwa-org.netlify.app.
- WCAG 2.2: https://www.w3.org/TR/WCAG22/.
- Google Analytics 4: https://developers.google.com/analytics/devguides/collection/ga4.
- Umami: https://umami.is/docs.
- Polar: https://polar.sh/docs.
