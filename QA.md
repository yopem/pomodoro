# Web application QA

## Scope and setup

Task: create a web-only Pomofocus alternative with basic and premium features,
Yopem UI and StyleX, and guest use. Exclude Todoist and webhooks. Application
implementation has not started. Expand this plan before implementation.

Affected files now: `bunfig.toml` (existing policy), `.gitignore`, and this plan.
No application routes, endpoints, roles, or services exist yet. No server was
started. Intended local web port is 3000. Confirm actual scripts and bindings
once application setup exists. Never use reference-site account data as fixtures.

Runtime available: Bun `1.4.4-canary.1+a8fcd319b`. Setup checks alone have user
approval. Application QA, application builds, and runtime probes remain deferred.
Do not treat setup checks as permission for whole-application QA.

Use isolated temporary directories for tooling probes. Keep sanitized evidence
under ignored `qa-artifacts/`. Execute P0 before P1, then P2. Every new case is
pending until its evidence is inspected. Record revision, date, environment,
actual result, and evidence path when a case runs.

## Setup cases

### [ ] QA-001 — P1 — Native Bun lint policy compatibility

- **Purpose:** preserve the required shared policy, Yopem UI plugin rules,
  React Doctor rules, and React Compiler diagnostics without another runner.
- **Prerequisites:** shared setup above; package registry access; temporary
  isolated package; exact dependency versions selected from published metadata.
- **Inputs:** current root `bunfig.toml`; one accepted and one rejected example
  per required plugin family; React hook imports for `useEffect`, `useCallback`,
  and `useMemo`; raw StyleX color and semantic-token examples.
- **Steps:**
  1. Inspect published dependency metadata and plugin implementations.
  2. In the temporary package, install exact compatible versions with Bun.
  3. Run `bun lint --no-script` on the selected probe files with a copied,
     correctly mapped native Bun policy. Do not run standalone Oxlint.
  4. Compare accepted examples and rejected examples with expected rule IDs.
- **Expected results:** accepted examples pass; rejected examples report their
  intended rules; no plugin load errors or missing parser-service errors occur.
  Missing support blocks setup rather than silently removing a rule.
- **Evidence:** `qa-artifacts/QA-001-toolchain.txt`; inspect versions, commands,
  exit codes, diagnostics, and each example's expected result.
- **Cleanup:** remove only the temporary probe directory after evidence is saved.
- **Status:** pending; source investigation is in progress.

### [ ] QA-002 — P1 — Native format and typecheck compatibility

- **Purpose:** establish native Bun formatting and strict TypeScript support.
- **Prerequisites:** shared setup; isolated temporary package; compatible exact
  `@yopem/typescript-config` version resolved before this case runs.
- **Inputs:** one correctly typed TypeScript file and one file assigning text
  to a numeric variable; formatting with double quotes, no semicolons, trailing
  commas, and 80-column lines from the existing format policy.
- **Steps:**
  1. In the temporary package, inspect native command help and preset files.
  2. Run `bun check --no-script -p tsconfig.json` for accepted and rejected input.
  3. Run `bun fmt --no-script --check` for explicitly selected probe files.
- **Expected results:** valid types pass and invalid types fail; format output
  matches supported root policy. Do not substitute `tsc` or another formatter.
- **Evidence:** `qa-artifacts/QA-002-toolchain.txt`; inspect command versions,
  input files, exit codes, diagnostic messages, and any unsupported options.
- **Cleanup:** remove only the temporary probe directory after saving evidence.
- **Status:** pending.

### [ ] QA-003 — P1 — Application dependency and UI setup review

- **Purpose:** preserve Yopem UI source installation, StyleX extraction, React
  19, and TanStack Start while using native Bun tooling.
- **Prerequisites:** QA-001 and QA-002 resolved; scaffold and package versions
  selected; application build execution needs separate approval.
- **Inputs:** CLI init dry-run for TanStack Start in `apps/web`; root Bun
  workspace and app-local alias `@/*` to `./src/*`.
- **Steps:**
  1. Review CLI version, documented prerequisites, and init dry-run output.
  2. Inspect proposed source paths, framework plugins, root styles, aliases,
     dependencies, and lint policy migration before applying setup.
  3. Confirm copied UI belongs to `apps/web/src/components/ui/` and its file
     record belongs to `apps/web/ui.json`.
- **Expected results:** no shared UI package, Tailwind, competing lint runner,
  unsupported config option, or lost existing rule. No unrelated file changes.
- **Evidence:** `qa-artifacts/QA-003-ui-setup.txt`; inspect dry-run and source diff.
- **Cleanup:** no runtime cleanup; preserve requested source files.
- **Status:** pending; no application scaffold exists yet.

## Coverage map and remaining cases

| Requirement or workflow | Coverage |
| --- | --- |
| Native tooling and required plugin support | QA-001, QA-002 |
| Yopem UI, StyleX, and framework setup | QA-003 |
| Timer, breaks, persistence, background/reload recovery | Pending implementation plan |
| Tasks, estimates, notes, completion, order, finish estimate | Pending implementation plan |
| Projects and unlimited task templates | Pending implementation plan |
| Daily/weekly/monthly/yearly reports and project totals | Pending implementation plan |
| History editing and CSV downloads | Pending reference inspection and implementation plan |
| Guest use, local data failure, multiple tabs, backup | Pending persistence decision |
| Optional account login and synchronization | Blocked: issuer client and subject contract not supplied |
| Settings, audio, notifications and focused window | Pending supported browser behavior plan |
| Responsive UI, keyboard, focus, screen reader, reduced motion | Pending application UI plan |
| PWA manifest, offline fallback, update and cache exclusions | Pending application setup |
| SSR metadata, canonical host, sitemap, analytics privacy | Pending application configuration |
| App builds, lint, format, typecheck and regressions | Deferred: application QA not approved |

Payments are not requested: premium capabilities belong to the requested app,
not a new paid tier. Todoist, webhooks, mobile, desktop, and extension apps are
out of scope. Backend authorization and API cases depend on the account/sync
scope; do not invent an HTTP contract or issuer details.
