# Web application QA

## Scope and setup

Task: create a web-only reference app alternative with basic and premium
features, Yopem UI and StyleX, guest use, and account sync. Exclude Todoist and
webhooks. Core source workflows are integrated. Layout browser checks are in
progress. The user has requested autonomous feature completion and QA before
release.

Frontend scope: `apps/web/src/`, `packages/env/`, `packages/api/`, app-owned UI,
and root Bun configuration. Routes are `/`, `/focus`, `/projects`, `/templates`,
`/reports`, and `/settings`. Rust scope includes `apps/server/` and the focus,
database, and migration crates. HTTP handlers, authentication, persistence, and
account controls are implemented in source. Their compilation does not prove
that services, issuer integration, or browser workflows work at runtime.

Use the owned production-like HTTPS origin `https://pomodoro-qa.localhost:13001`
for current browser QA. Its edge routes backend requests to the owned API at
`127.0.0.1:18001` and other requests to the copied standalone SSR artifact at
`127.0.0.2:13001`. The former development server is stopped. The browser profile
and CA trust are temporary and owned by QA. Read
`qa-artifacts/runtime/context.json` and current progress notes before using any
process. Do not print its private environment values. Check listeners before
starting a service. Do not start a second web server, change the project ports,
install global trust, or clear user browser storage. Use only the owned guest
fixture or a new isolated QA profile for writes.

The existing PostgreSQL listener on 5432 belongs to another project. Do not
connect to it, stop it, or use its volumes. Database QA requires a new local
Podman instance with a unique name, fresh credentials and a confirmed free
loopback port. Record that owned target before connecting or applying reviewed
migrations. Never use the root `.env` database URL. Do not run root
`bun run dev` or migration scripts with inherited credentials. Construct an
explicit isolated environment and preserve all unrelated processes and data.

Runtime: Bun `1.4.4-canary.1+a8fcd319b`, pinned by `bun-toolchain.json`, and
Rust `1.97.1`, pinned by `rust-toolchain.toml`. Use `bun.lock` and `Cargo.lock`.
Native lint, format, and typechecks, plus Cargo checks, Clippy, and Rustfmt, are
allowed. Offline OpenAPI export and typed-client generation have explicit
approval. The latest user request authorizes application QA after feature
completion, including local builds and browser/API workflows. Use only owned,
isolated non-production resources. Do not create new test infrastructure or run
an unrelated whole-project test suite. Production changes, deployment,
destructive shared-data operations, global tool changes and unverified
external-account actions remain unauthorized. Record blockers without guessing
credentials, account identities or callback permissions.

Use isolated temporary directories for tooling probes. Keep sanitized evidence
under ignored `qa-artifacts/`. Execute P0 before P1, then P2. Every new case is
pending until its evidence is inspected. Record revision, date, environment,
actual result, and evidence path when a case runs.

## Setup cases

### [ ] QA-001 — P1 — Native Bun lint policy compatibility

- **Purpose:** preserve the required shared policy, Yopem UI plugin rules, React
  Doctor rules, and React Compiler diagnostics without another runner.
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
- **Cleanup:** remove only the temporary probe directory after evidence is
  saved.
- **Status:** pending. On 2026-11-08, isolated probes used Bun
  `1.4.4-canary.1+a8fcd319b` and the uncommitted root policy. The inspected
  `qa-artifacts/QA-001-toolchain.txt` records accepted and rejected examples for
  selected rules, hooks, UI rules, and browser boundaries. Complete the
  remaining browser boundary cases before marking this case passed.

### [x] QA-002 — P1 — Native format and typecheck compatibility

- **Purpose:** establish native Bun formatting and strict TypeScript support.
- **Prerequisites:** shared setup; isolated temporary package; compatible exact
  `@yopem/typescript-config` version resolved before this case runs.
- **Inputs:** one correctly typed TypeScript file and one file assigning text to
  a numeric variable; formatting with double quotes, no semicolons, trailing
  commas, and 80-column lines from the existing format policy.
- **Steps:**
  1. In the temporary package, inspect native command help and preset files.
  2. Run `bun check --no-script -p tsconfig.json` for accepted and rejected
     input.
  3. Run `bun fmt --no-script --check` for explicitly selected probe files.
- **Expected results:** valid types pass and invalid types fail; format output
  matches supported root policy. Do not substitute `tsc` or another formatter.
- **Evidence:** `qa-artifacts/QA-002-toolchain.txt`; inspect command versions,
  input files, exit codes, diagnostic messages, and any unsupported options.
- **Cleanup:** remove only the temporary probe directory after saving evidence.
- **Status:** passed on 2026-11-08 at `2012176` with uncommitted root tooling
  changes, in an isolated temporary package using Bun
  `1.4.4-canary.1+a8fcd319b`. Valid inputs passed; invalid types and format
  failed. The formatter sorted imports and wrapped the long assignment. See the
  inspected `qa-artifacts/QA-002-toolchain.txt`.

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
- **Evidence:** `qa-artifacts/QA-003-ui-setup.txt`; inspect dry-run and source
  diff.
- **Cleanup:** no runtime cleanup; preserve requested source files.
- **Status:** pending; the scaffold exists, but application setup QA has not
  run.

## Coverage map and remaining cases

| Requirement or workflow                              | Pending or historical coverage                 |
| ---------------------------------------------------- | ---------------------------------------------- |
| Native tooling and required plugin support           | QA-001; historical compatibility result QA-002 |
| Isolated staged and actual-origin push snapshots     | QA-062, QA-063, QA-064, QA-065                 |
| UI, StyleX, framework setup and component contracts  | QA-003, QA-021, QA-024, QA-036                 |
| Timer completion, persistence and fractional timing  | QA-006–008, QA-027, QA-038–043                 |
| Tasks, ordering, notes and finish estimates          | QA-009, QA-046, QA-050                         |
| Projects and reusable templates without a paid quota | QA-010, QA-011, QA-049                         |
| Reports, streaks, dates and database history         | QA-012, QA-026, QA-044, QA-051                 |
| Manual history and formula-safe CSV downloads        | QA-013, QA-014                                 |
| Guest storage, backups and partition isolation       | QA-004, QA-005, QA-028–031, QA-057             |
| OAuth, authorization and account changes             | QA-015, QA-016, QA-034, QA-035, QA-045, QA-053 |
| Atomic sync, lost responses and recovery fences      | QA-017, QA-052, QA-054, QA-056, QA-058, QA-059 |
| Explicit idempotent guest import                     | QA-018, QA-055                                 |
| Sounds, notifications and compact focus controls     | QA-019, QA-048                                 |
| PWA fallback, update and private cache exclusions    | QA-020, QA-025                                 |
| Request-local SSR nonce and security headers         | QA-037                                         |
| Generated HTTP contracts and boundary values         | QA-022, QA-023, QA-032, QA-033, QA-047         |
| Isolated local database and manual migrations        | QA-060                                         |
| Public metadata, canonical host and sitemap privacy  | QA-061                                         |
| Responsive pages and reachable dialog actions        | QA-067, QA-068, QA-073                         |
| Build, lazy routes and production containers         | QA-069, QA-070, QA-072                         |
| Explicit trusted proxy peers                         | QA-071                                         |
| Locked dependency advisories                         | QA-074                                         |
| Persistent notifications and timer activation        | QA-076–079                                     |

Payments are not requested. The requested capabilities have no paid tier.
External task integrations, webhooks, native apps, and public rankings are not
included in this release. Do not infer consent to publish account data from a
reference tab. Analytics is not requested or loaded; public placeholders do not
enable third-party scripts. Live issuer compatibility and callback permission
remain external prerequisites. Use the canonical Rust/OpenAPI contract for
application requests, not guessed payloads.

## Planned application cases

These cases define expected behavior before source implementation. Exact route,
control, contract and command mappings must be finalized from the implementation
before execution. Application QA is approved only for owned isolated resources.
Cases that require missing implementation or resources remain pending, not
passed.

### [ ] QA-004 — P1 — Guest workspace survives reload

- **Purpose:** Use all features without an account.
- **Prerequisites:** Shared setup above. An isolated browser profile, guest
  mode, and local storage enabled.
- **Inputs:** Task Read chapter 1, estimate 2; project Study; template Evening.
- **Steps:**
  1. Confirm the stated isolated starting state.
  2. Create the project, task and template through their forms. Reload. Open
     each list.
  3. Save the observable result and inspect the evidence.
- **Expected results:** All three records remain with their values. No sign-in
  is required.
- **Evidence:** `qa-artifacts/QA-004.txt` and relevant screenshots or downloads
  in `qa-artifacts/QA-004/`; inspect actual state, errors and stored effects.
- **Cleanup:** Remove only this case’s isolated records and browser profile.
  Stop only processes started for this case. Retain sanitized evidence.
- **Status:** pending; implementation and final executable mappings are
  required.

### [ ] QA-005 — P0 — Guest storage failure does not erase work

- **Purpose:** Keep local work safe when persistence fails.
- **Prerequisites:** Shared setup above. An isolated guest workspace with QA-004
  data and a saved backup.
- **Inputs:** Existing guest data; browser storage denied or quota exhausted.
- **Steps:**
  1. Confirm the stated isolated starting state.
  2. Deny storage writes using browser tooling. Edit a task. Reload after
     restoring access.
  3. Save the observable result and inspect the evidence.
- **Expected results:** The app reports the failure. Existing durable data is
  not silently replaced with an empty workspace.
- **Evidence:** `qa-artifacts/QA-005.txt` and relevant screenshots or downloads
  in `qa-artifacts/QA-005/`; inspect actual state, errors and stored effects.
- **Cleanup:** Remove only this case’s isolated records and browser profile.
  Stop only processes started for this case. Retain sanitized evidence.
- **Status:** pending; implementation and final executable mappings are
  required.

### [ ] QA-006 — P1 — Timer completion records one focus interval

- **Purpose:** Complete a focus interval and start the configured break.
- **Prerequisites:** Shared setup above. Guest mode; set focus to 1 minute,
  short break to 1 minute, long-break interval to 2; auto-start breaks enabled.
- **Inputs:** Selected task Read chapter 1; one running focus interval.
- **Steps:**
  1. Confirm the stated isolated starting state.
  2. Start focus. Wait for completion. Open reports. Return to the timer.
  3. Save the observable result and inspect the evidence.
- **Expected results:** Exactly one focus record and one task pomodoro are
  added. The short break runs. Break time is not counted as focus.
- **Evidence:** `qa-artifacts/QA-006.txt` and relevant screenshots or downloads
  in `qa-artifacts/QA-006/`; inspect actual state, errors and stored effects.
- **Cleanup:** Remove only this case’s isolated records and browser profile.
  Stop only processes started for this case. Retain sanitized evidence.
- **Status:** pending; implementation and final executable mappings are
  required.

### [ ] QA-007 — P1 — Timer recovery does not duplicate records

- **Purpose:** Recover after suspension or reload without fabricated sessions.
- **Prerequisites:** Shared setup above. QA-006 settings; two tabs for the same
  isolated workspace.
- **Inputs:** One running focus interval and its stable completion identity.
- **Steps:**
  1. Confirm the stated isolated starting state.
  2. Start focus in one tab. Suspend or close it past its deadline. Reopen, then
     refresh both tabs.
  3. Save the observable result and inspect the evidence.
- **Expected results:** At most one completion is recorded. No chain of
  unattended focus intervals is invented.
- **Evidence:** `qa-artifacts/QA-007.txt` and relevant screenshots or downloads
  in `qa-artifacts/QA-007/`; inspect actual state, errors and stored effects.
- **Cleanup:** Remove only this case’s isolated records and browser profile.
  Stop only processes started for this case. Retain sanitized evidence.
- **Status:** pending; implementation and final executable mappings are
  required.

### [ ] QA-008 — P1 — Pause and skip preserve timer semantics

- **Purpose:** Do not count a skipped interval as a completed pomodoro.
- **Prerequisites:** Shared setup above. Guest mode and one selected task with
  zero actual pomodoros.
- **Inputs:** A focus interval paused after a few seconds.
- **Steps:**
  1. Confirm the stated isolated starting state.
  2. Start, pause, wait, resume, then skip. Inspect task actual count and focus
     history.
  3. Save the observable result and inspect the evidence.
- **Expected results:** Paused time is excluded. Skip does not increment the
  task completion count. Any partial focus record follows the visible duration
  rule.
- **Evidence:** `qa-artifacts/QA-008.txt` and relevant screenshots or downloads
  in `qa-artifacts/QA-008/`; inspect actual state, errors and stored effects.
- **Cleanup:** Remove only this case’s isolated records and browser profile.
  Stop only processes started for this case. Retain sanitized evidence.
- **Status:** pending; implementation and final executable mappings are
  required.

### [ ] QA-009 — P1 — Task edits and ordering preserve identity

- **Purpose:** Maintain estimates, notes and completion across task operations.
- **Prerequisites:** Shared setup above. Guest mode; empty task list.
- **Inputs:** Read chapter 1, estimate 2, note Pages 1–10; Review notes,
  estimate 1.
- **Steps:**
  1. Confirm the stated isolated starting state.
  2. Create both tasks. Edit the first note. Select and reorder tasks. Complete
     one task and reload.
  3. Save the observable result and inspect the evidence.
- **Expected results:** Titles, estimates and notes persist. Selection and
  completion are visible. Finish estimate uses unfinished work only.
- **Evidence:** `qa-artifacts/QA-009.txt` and relevant screenshots or downloads
  in `qa-artifacts/QA-009/`; inspect actual state, errors and stored effects.
- **Cleanup:** Remove only this case’s isolated records and browser profile.
  Stop only processes started for this case. Retain sanitized evidence.
- **Status:** pending; implementation and final executable mappings are
  required.

### [ ] QA-010 — P1 — Project removal preserves history

- **Purpose:** Keep historical focus labels when a project is removed.
- **Prerequisites:** Shared setup above. An isolated project Study linked to a
  task and one focus history record.
- **Inputs:** Project Study and its linked history record.
- **Steps:**
  1. Confirm the stated isolated starting state.
  2. Archive Study and inspect selection options. Remove it through the
     confirmed removal action. Open reports.
  3. Save the observable result and inspect the evidence.
- **Expected results:** Archived projects cannot be selected for new work.
  Existing focus history and totals are not deleted.
- **Evidence:** `qa-artifacts/QA-010.txt` and relevant screenshots or downloads
  in `qa-artifacts/QA-010/`; inspect actual state, errors and stored effects.
- **Cleanup:** Remove only this case’s isolated records and browser profile.
  Stop only processes started for this case. Retain sanitized evidence.
- **Status:** pending; implementation and final executable mappings are
  required.

### [ ] QA-011 — P1 — Templates have no three-template limit

- **Purpose:** Provide the requested premium template capability.
- **Prerequisites:** Shared setup above. Guest mode with an empty template list.
- **Inputs:** Four templates named Template 1 through Template 4; each has task
  Read, estimate 1.
- **Steps:**
  1. Confirm the stated isolated starting state.
  2. Create all four templates. Apply Template 4 twice. Edit one resulting task.
  3. Save the observable result and inspect the evidence.
- **Expected results:** All four templates persist without a paywall. Each
  application creates independent tasks. Editing an applied task does not change
  the template.
- **Evidence:** `qa-artifacts/QA-011.txt` and relevant screenshots or downloads
  in `qa-artifacts/QA-011/`; inspect actual state, errors and stored effects.
- **Cleanup:** Remove only this case’s isolated records and browser profile.
  Stop only processes started for this case. Retain sanitized evidence.
- **Status:** pending; implementation and final executable mappings are
  required.

### [ ] QA-012 — P1 — Reports aggregate known focus records

- **Purpose:** Compute daily, weekly, monthly and yearly totals from stored
  focus.
- **Prerequisites:** Shared setup above. Guest mode; use manual history entry to
  create isolated records after that form exists.
- **Inputs:** Read: 25 minutes on 2026-01-01; Review: 50 minutes on 2026-01-02;
  both under Study.
- **Steps:**
  1. Confirm the stated isolated starting state.
  2. Navigate report periods to January 2026 and year 2026. Filter Study.
     Inspect project and activity totals.
  3. Save the observable result and inspect the evidence.
- **Expected results:** The year and month show 75 minutes for Study. Empty
  periods show zero, not fabricated data. Boundaries follow the documented
  timezone and week-start rule.
- **Evidence:** `qa-artifacts/QA-012.txt` and relevant screenshots or downloads
  in `qa-artifacts/QA-012/`; inspect actual state, errors and stored effects.
- **Cleanup:** Remove only this case’s isolated records and browser profile.
  Stop only processes started for this case. Retain sanitized evidence.
- **Status:** pending; implementation and final executable mappings are
  required.

### [ ] QA-013 — P0 — CSV export is scoped and formula-safe

- **Purpose:** Export requested report data without spreadsheet formula
  execution.
- **Prerequisites:** Shared setup above. QA-012 records in an isolated guest
  workspace.
- **Inputs:** Additional task title =1+1 and title containing a comma, quote and
  line break.
- **Steps:**
  1. Confirm the stated isolated starting state.
  2. Export the selected date range in comma/minutes and tab/hours formats.
     Repeat without the task column. Inspect downloaded bytes.
  3. Save the observable result and inspect the evidence.
- **Expected results:** Only selected records appear. Delimiters and quotes are
  escaped. Formula-like text is neutralized. Unit conversions and optional
  columns match the selected options.
- **Evidence:** `qa-artifacts/QA-013.txt` and relevant screenshots or downloads
  in `qa-artifacts/QA-013/`; inspect actual state, errors and stored effects.
- **Cleanup:** Remove only this case’s isolated records and browser profile.
  Stop only processes started for this case. Retain sanitized evidence.
- **Status:** pending; implementation and final executable mappings are
  required.

### [ ] QA-014 — P1 — Manual focus entry validates time and updates totals

- **Purpose:** Add and correct focus history without invalid durations.
- **Prerequisites:** Shared setup above. Guest mode; empty history.
- **Inputs:** Date 2026-01-01, task Read, minutes 25; rejected values 0, -1,
  empty title and reversed start/end times.
- **Steps:**
  1. Confirm the stated isolated starting state.
  2. Submit each rejected value. Add the valid record, edit it to 30 minutes,
     then delete it with confirmation. Inspect totals after each action.
  3. Save the observable result and inspect the evidence.
- **Expected results:** Invalid submissions create no record. Totals are 25,
  then 30, then 0 minutes. Deletion removes only the selected record.
- **Evidence:** `qa-artifacts/QA-014.txt` and relevant screenshots or downloads
  in `qa-artifacts/QA-014/`; inspect actual state, errors and stored effects.
- **Cleanup:** Remove only this case’s isolated records and browser profile.
  Stop only processes started for this case. Retain sanitized evidence.
- **Status:** pending; implementation and final executable mappings are
  required.

### [ ] QA-015 — P0 — OAuth callback rejects forged or replayed state

- **Purpose:** Bind sign-in to the initiating browser and consume the challenge
  once.
- **Prerequisites:** Shared setup above. Local or preview issuer callback
  approved; isolated account; application QA approval required.
- **Inputs:** A valid login challenge; altered state; missing verifier; repeated
  callback.
- **Steps:**
  1. Confirm the stated isolated starting state.
  2. Begin login. Alter or omit state before callback. Repeat a consumed
     callback. Inspect cookies and account workspace.
  3. Save the observable result and inspect the evidence.
- **Expected results:** Invalid callbacks fail without creating a session or
  changing workspace data. Challenge cookies expire and are consumed. No token
  or code appears in client logs.
- **Evidence:** `qa-artifacts/QA-015.txt` and relevant screenshots or downloads
  in `qa-artifacts/QA-015/`; inspect actual state, errors and stored effects.
- **Cleanup:** Remove only this case’s isolated records and browser profile.
  Stop only processes started for this case. Retain sanitized evidence.
- **Status:** pending; implementation and final executable mappings are
  required.

### [ ] QA-016 — P0 — Account sync denies another user workspace

- **Purpose:** Enforce identity at the Rust data boundary.
- **Prerequisites:** Shared setup above. Two isolated issuer accounts A and B;
  local or preview database confirmed safe; actual generated HTTP contract
  available.
- **Inputs:** Distinct workspaces belonging to A and B.
- **Steps:**
  1. Confirm the stated isolated starting state.
  2. Save A workspace. Sign in as B and issue requests using the documented
     client, including altered ownership fields if accepted by the DTO.
  3. Save the observable result and inspect the evidence.
- **Expected results:** B cannot read or write A data. The server derives
  ownership from verified identity. Rejected operations make no stored changes.
- **Evidence:** `qa-artifacts/QA-016.txt` and relevant screenshots or downloads
  in `qa-artifacts/QA-016/`; inspect actual state, errors and stored effects.
- **Cleanup:** Remove only this case’s isolated records and browser profile.
  Stop only processes started for this case. Retain sanitized evidence.
- **Status:** pending; implementation and final executable mappings are
  required.

### [ ] QA-017 — P0 — Concurrent sync does not overwrite newer work

- **Purpose:** Make stale writes observable without silent data loss.
- **Prerequisites:** Shared setup above. Two signed-in clients for the same
  isolated account and workspace revision.
- **Inputs:** Client A task Read; client B task Review.
- **Steps:**
  1. Confirm the stated isolated starting state.
  2. Load both clients. Save A, then save B from its stale revision. Inspect
     both local workspaces and the server result.
  3. Save the observable result and inspect the evidence.
- **Expected results:** The stale write is rejected as a conflict. A data
  remains stored, and B unsynced data remains recoverable until the user
  resolves the conflict.
- **Evidence:** `qa-artifacts/QA-017.txt` and relevant screenshots or downloads
  in `qa-artifacts/QA-017/`; inspect actual state, errors and stored effects.
- **Cleanup:** Remove only this case’s isolated records and browser profile.
  Stop only processes started for this case. Retain sanitized evidence.
- **Status:** pending; implementation and final executable mappings are
  required.

### [ ] QA-018 — P0 — Guest import is explicit and idempotent

- **Purpose:** Keep local data when account import fails or repeats.
- **Prerequisites:** Shared setup above. Isolated guest records plus an account
  with existing records; account QA prerequisites met.
- **Inputs:** One guest task Read and one account task Review.
- **Steps:**
  1. Confirm the stated isolated starting state.
  2. Sign in without accepting import. Inspect account data. Accept import,
     interrupt its response, then retry.
  3. Save the observable result and inspect the evidence.
- **Expected results:** No automatic destructive merge occurs. Guest source
  remains until confirmation. Retrying does not duplicate imported records.
- **Evidence:** `qa-artifacts/QA-018.txt` and relevant screenshots or downloads
  in `qa-artifacts/QA-018/`; inspect actual state, errors and stored effects.
- **Cleanup:** Remove only this case’s isolated records and browser profile.
  Stop only processes started for this case. Retain sanitized evidence.
- **Status:** pending; implementation and final executable mappings are
  required.

### [ ] QA-019 — P1 — Audio and notification settings honor user permission

- **Purpose:** Provide supported focus feedback without unwanted playback.
- **Prerequisites:** Shared setup above. Browser with audio output and
  notification permission controls; guest mode.
- **Inputs:** Alarm volume zero, then audible volume; notification permission
  denied, then allowed.
- **Steps:**
  1. Confirm the stated isolated starting state.
  2. Configure each state and finish a short interval. Inspect feedback and
     visible permission status.
  3. Save the observable result and inspect the evidence.
- **Expected results:** Muted settings stay silent. Permission denial does not
  break the timer. Supported notifications occur once only after permission;
  unsupported features are identified.
- **Evidence:** `qa-artifacts/QA-019.txt` and relevant screenshots or downloads
  in `qa-artifacts/QA-019/`; inspect actual state, errors and stored effects.
- **Cleanup:** Remove only this case’s isolated records and browser profile.
  Stop only processes started for this case. Retain sanitized evidence.
- **Status:** pending; implementation and final executable mappings are
  required.

### [ ] QA-020 — P1 — PWA fallback and update do not cache private responses

- **Purpose:** Provide install and offline behavior without private cache
  leakage.
- **Prerequisites:** Shared setup above. Completed production web build and
  explicit browser QA approval; isolated profile.
- **Inputs:** Manifest, install icons, offline fallback and two app builds.
- **Steps:**
  1. Confirm the stated isolated starting state.
  2. Inspect installability. Load the app, go offline and navigate. Inspect
     caches after authenticated API use. Install the next build and accept its
     update prompt.
  3. Save the observable result and inspect the evidence.
- **Expected results:** Offline fallback is usable. API/auth/account HTML is not
  cached. Updates require confirmation and remove old application caches.
- **Evidence:** `qa-artifacts/QA-020.txt` and relevant screenshots or downloads
  in `qa-artifacts/QA-020/`; inspect actual state, errors and stored effects.
- **Cleanup:** Remove only this case’s isolated records and browser profile.
  Stop only processes started for this case. Retain sanitized evidence.
- **Status:** pending; implementation and final executable mappings are
  required.

### [ ] QA-021 — P1 — Application controls remain keyboard and phone usable

- **Purpose:** Preserve accessible forms, navigation, dialogs and timer
  feedback.
- **Prerequisites:** Shared setup above. Completed UI and browser QA approval;
  keyboard and screen reader available.
- **Inputs:** Viewports 1440×900, 1024×768, 768×1024, 390×844 and 320×800;
  reduced motion; 200% zoom.
- **Steps:**
  1. Confirm the stated isolated starting state.
  2. Navigate all implemented routes by keyboard. Submit an empty task form.
     Open and close a dialog. Inspect each viewport and reduced-motion setting.
  3. Save the observable result and inspect the evidence.
- **Expected results:** Labels and field errors are announced; focus returns
  correctly. Skip link works. No overlapping controls or sideways overflow. No
  per-second live-region chatter.
- **Evidence:** `qa-artifacts/QA-021.txt` and relevant screenshots or downloads
  in `qa-artifacts/QA-021/`; inspect actual state, errors and stored effects.
- **Cleanup:** Remove only this case’s isolated records and browser profile.
  Stop only processes started for this case. Retain sanitized evidence.
- **Status:** pending; implementation and final executable mappings are
  required.

### [ ] QA-022 — P1 — Offline OpenAPI generation matches frontend calls

- **Purpose:** Use Rust as the canonical HTTP contract without starting
  services.
- **Prerequisites:** Shared setup above. Offline generation explicitly approved;
  pinned Rust toolchain and actual generator scripts defined.
- **Inputs:** Rust endpoint and schema registrations; generated frontend API
  types.
- **Steps:**
  1. Confirm the stated isolated starting state.
  2. Run the documented offline exporter and frontend generator from the
     repository root. Inspect generated methods, paths, response shapes and
     diff.
  3. Save the observable result and inspect the evidence.
- **Expected results:** The exporter does not connect to DATABASE_URL or start a
  listener. Generated types match registered endpoints; no generated files were
  hand-edited.
- **Evidence:** `qa-artifacts/QA-022.txt` and relevant screenshots or downloads
  in `qa-artifacts/QA-022/`; inspect actual state, errors and stored effects.
- **Cleanup:** Remove only this case’s isolated records and browser profile.
  Stop only processes started for this case. Retain sanitized evidence.
- **Status:** pending. The contract-only exporter ran on 2026-11-08 and produced
  `docs/openapi.json` with 21 schemas and no paths. Frontend type generation and
  endpoint parity are not implemented or checked.

## Backend contract increment

### [ ] QA-023 — P1 — Strict workspace boundary validation

- **Purpose:** Match the focus schema and reject invalid data before
  persistence.
- **Prerequisites:** Isolated local workspace; this increment's contract
  exported; a future approved focused validation harness. No server or database
  is needed.
- **Inputs:** The default workspace, each numeric boundary and one value beyond
  it, blank and 501 UTF-16-unit titles, 10,001-unit notes, invalid UUIDs,
  unknown fields, duplicate IDs, missing current project and task references,
  deleted historical references, and timer run/time combinations.
- **Steps:** 1. From the repository root, supply each input through the future
  boundary harness. 2. Convert each workspace with
  `ValidatedWorkspace::try_from` from `pomodoro-focus`. 3. Record
  deserialization, conversion, and validation results. 4. Compare parsed
  serialized Rust defaults with `createEmptyWorkspace`. 5. Review shared and
  consuming access to the validated value. Confirm that callers cannot
  deserialize the wrapper or change its private inner value.
- **Expected results:** Valid defaults and deleted historical references pass.
  Invalid shapes, limits, references and inconsistent timer state fail without
  panic. Trimmed titles match frontend behavior. The wrapper serializes the
  normalized workspace without an envelope. Its shared access is read-only;
  consuming access removes the wrapper. Invalid conversion returns an error.
  Rust and frontend defaults have equal parsed values, including 25/5/15
  minutes, four-focus long breaks, and a stopped 1500-second focus timer.
  Floating-point number spelling does not affect this comparison.
- **Evidence:** Save sanitized inputs and results to
  `qa-artifacts/QA-023-contract.txt`; inspect each result.
- **Cleanup:** Remove isolated input files; keep sanitized evidence.
- **Status:** pending; a validation harness and its command need separate
  approval.

The domain contract is `crates/focus/src/lib.rs`. HTTP DTOs and schema
registration remain in `apps/server/src/contract.rs` and
`apps/server/src/lib.rs`; the exporter is
`apps/server/src/bin/export-openapi.rs`. The exact limits and export command are
in the local `docs/backend-contract.md`. The installed Rust toolchain is 1.97.1.
There are no affected routes, endpoints, roles, or external services in this
increment. The exporter evidence is `docs/openapi.json`; inspect the component
schemas and empty paths.

Coverage: frontend-compatible DTO shape, bounds, references and timer state map
to QA-023. Offline schema export maps to QA-022. HTTP, auth, persistence, and
runtime behavior are outside this increment and remain covered by their existing
pending cases.

## Shell and PWA static-diagnostic repairs

Coverage: shell semantics and theme map to QA-024; service-worker update
feedback maps to QA-025. Existing navigation and keyboard coverage: QA-021. PWA
cache and offline coverage: QA-020. Build and browser checks require approval.

### [ ] QA-024 — P1 — Shell navigation and theme

- **Purpose:** Check shell layout, links, alerts, and theme after lint repairs.
- **Prerequisites:** Shared setup; isolated guest data; approved local web
  server on 127.0.0.1:13001; a browser with light and dark system settings.
- **Inputs:** Workspace theme values `system`, `light`, and `dark`;
  `dark_while_running`; the public `yopem-ui-theme` preference mirror. Save the
  original settings before this case.
- **Steps:**
  1. Open `/` and use each main navigation link. Inspect the Sign in link
     destination `/auth/login`; authentication remains covered by QA-015.
  2. Use `/settings` to save each theme. Reload and inspect the document theme
     before and after workspace hydration. With `system`, change the operating
     system theme without reloading.
  3. Save `light` with `dark_while_running` enabled. Start the timer on `/`,
     then pause it. Inspect the document theme, saved workspace preference, and
     public mirror after each action.
  4. Repeat with a stale mirror value of `dark` and a saved workspace theme of
     `light`. Confirm that hydration restores the workspace preference. Retain
     evidence of any initial-paint difference; do not treat the mirror as
     authoritative or expect it to know timer state before hydration.
  5. Repeat keyboard navigation at a narrow viewport.
- **Expected results:** Links have names and reach their existing destinations;
  layout remains usable; the chosen theme covers the document and changes
  correctly; focus is visible and alerts remain announced. A temporary dark
  override does not replace the saved preference or its mirror. A stale mirror
  cannot replace workspace settings after hydration.
- **Evidence:** `qa-artifacts/QA-024/` screenshots and accessibility tree;
  inspect both themes, link names, keyboard focus, and narrow layout.
- **Cleanup:** Restore guest settings and stop only processes started for this
  case.
- **Status:** pending.

### [ ] QA-025 — P1 — PWA update and registration feedback

- **Purpose:** Check update and error announcements and production-only
  registration.
- **Prerequisites:** QA-020 isolated production-like setup and two approved
  builds.
- **Inputs:** Existing service worker, newer service worker, and a simulated
  registration failure; no production data.
- **Steps:** 1. Follow QA-020 setup and load the app. 2. Deploy the newer local
  worker and check the update message and Update and reload control. 3. Cause
  registration to fail in the isolated environment and inspect the message. 4.
  Check that the development app does not register a service worker.
- **Expected results:** Update and failure messages are announced; update
  reloads only after activation; failure gives a safe generic message;
  development does not register the worker.
- **Evidence:** `qa-artifacts/QA-025/` screenshots and service-worker trace;
  inspect registration state, messages, and update action.
- **Cleanup:** Unregister only the isolated worker, clear its test data, and
  stop only processes started for this case.
- **Status:** pending.

### [ ] QA-026 — P1 — Historical dates keep their selected year

- **Purpose:** Reports must not change years 0000–0099 to 1900–1999 when they
  create local day, week, month, or year boundaries.
- **Prerequisites:** Shared setup above. Use an isolated guest workspace.
  Browser execution requires the separate QA approval. No database is needed.
- **Inputs:** Manual record title `Historical focus`, date `0099-12-31`, 1
  minute, no project, and no optional start or end time.
- **Steps:** 1. Open `/reports` and add the input record. 2. Select date
  `0099-12-31`. 3. Select Day, Week, Month, then Year. 4. Select Day and date
  `0100-01-01`. 5. Export the selected historical day after restoring date
  `0099-12-31`.
- **Expected results:** Each range that contains the record reports exactly 1
  minute and shows `Historical focus`. Year 0099 stays year 0099. Day
  `0100-01-01` excludes the record. The exported date is `0099-12-31`.
- **Evidence:** Save filter states and the sanitized CSV under
  `qa-artifacts/QA-026/`. Inspect the selected year, total, and CSV date.
- **Cleanup:** Delete only `Historical focus` from the isolated workspace.
- **Status:** Pending. Source lint, format, and typechecks do not prove this
  browser scenario.

Historical calendar-range coverage maps to QA-026. Other aggregation and CSV
cases remain QA-012 and QA-013.

### [ ] QA-027 — P1 — Short pauses keep fractional active time

- **Scope:** `features/focus/schema.ts`, `features/focus/store.ts`, and
  `features/timer/components/focus-timer.tsx` under `apps/web/src/`; route `/`;
  isolated guest role and browser storage. No HTTP endpoint is required.

- **Purpose:** Repeated pauses must not discard running milliseconds. Store
  fractional remaining seconds and round only the displayed clock.
- **Prerequisites:** Shared setup above. Use an isolated guest workspace,
  default 25-minute focus duration, and both auto-start settings off. Browser
  execution requires the separate QA approval. No database is needed.
- **Inputs:** Eight running intervals of 250 ms. Pause between intervals. Keep a
  backup with integral remaining seconds to check compatibility.
- **Steps:** 1. Reset the focus timer. 2. Click Start, wait until Pause is
  available, wait 250 ms, then click Pause. 3. Export a workspace backup. 4.
  Repeat with Resume for seven more intervals. Save a backup after each
  pause. 5. Reload while paused and compare the saved timer. 6. Resume, pause
  once more, and export. 7. Restore the isolated integral backup.
- **Expected results:** Each running interval reduces remaining time, including
  its fractional part. Paused wall time does not reduce it. Eight intervals
  consume at least 2 seconds; command overhead can consume more. A fractional
  stored value survives reload and resume. The clock and its accessible name
  show whole seconds rounded up, with no decimal text. Integral backups still
  load. Restores must not change another partition.
- **Evidence:** Save sanitized backups, action timestamps, and clock screenshots
  under `qa-artifacts/QA-027/`. Inspect consecutive fractional values and the
  paused reload. Do not infer timing success from a screenshot alone.
- **Cleanup:** Reset the isolated timer, restore its original settings, and
  remove only records created for this case.
- **Status:** Pending. Static checks and offline OpenAPI export passed for the
  precision source change; this browser scenario has not run.

Timer pause precision and numeric backup compatibility map to QA-027.

### [ ] QA-028 — P0 — A failed partition load hides the previous account

- **Scope:** `apps/web/src/features/focus/store.ts` and future account-switch
  integration; all frontend routes; isolated guest and authenticated roles. Auth
  runtime setup must be complete before execution.

- **Purpose:** A corrupt target workspace must not leave another account's
  records visible after an identity change.
- **Prerequisites:** Shared setup, completed account flow, isolated account A,
  and no production data. Use only the project browser group. Browser QA
  approval is required. Save the guest storage value before changing it.
- **Inputs:** Account A has project `QA-private-A`. The isolated guest storage
  key is `pomodoro:workspace:guest`; set it to `{"schema_version":` for this
  case.
- **Steps:** 1. Sign in as A and confirm its project is visible. 2. Set the
  guest key to the malformed input in that tab's local storage. 3. Sign out. 4.
  Inspect Timer, Projects, Reports, and Settings. 5. Repeat with a corrupt
  account B partition and switch from A to B.
- **Expected results:** The new identity is active even when its storage is
  invalid. No A task, project, report, or editor remains visible. Show an
  explicit storage error and allow confirmed recovery of the target only.
  Preserve the corrupt value and A's stored workspace until an approved restore.
  Ordinary mutations must fail without replacing corrupt data.
- **Evidence:** Save sanitized snapshots, identity state, and storage changes
  under `qa-artifacts/QA-028/`. Inspect every named screen and both keys.
- **Cleanup:** Restore the saved isolated guest value and remove only the named
  fixture. Sign out of isolated accounts. Keep original evidence local.
- **Status:** Pending. Requires the completed auth runtime and separate QA pass.

### [ ] QA-029 — P0 — Backup confirmation cannot cross identities

- **Scope:** `apps/web/src/features/focus/store.ts`,
  `apps/web/src/features/settings/components/workspace-backup.tsx`, and
  `apps/web/src/routes/settings/index.tsx`; route `/settings`; guest and
  authenticated roles, browser storage, and completed account switching.

- **Purpose:** Bind a prepared restore to the identity and workspace shown when
  the user prepares it, including corrupt-storage recovery.
- **Prerequisites:** Shared setup, two isolated accounts or guest plus A,
  completed account switching, two browser tabs, and browser QA approval.
- **Inputs:** Backup project `QA-restore-original`; target A project
  `QA-account-A`; other target B project `QA-account-B`.
- **Steps:** 1. Prepare a restore in A but do not confirm. 2. Switch the shared
  browser session to B in the other tab. 3. Return to the first tab and try to
  confirm. 4. Repeat with the explicit corrupt-storage recovery option and a
  malformed A workspace. 5. Repeat while the first tab has not yet rendered the
  latest identity, using the approved browser interaction trace.
- **Expected results:** Close the stale dialog or reject the operation with an
  identity/workspace change error. Neither A nor B is replaced. In particular,
  recovery must not bypass the identity check with `expected: null`. The storage
  lock must check the original target before any backup, recovery, or
  replacement write. A fresh confirmation in the correct target can restore that
  target only.
- **Evidence:** Save sanitized before/after backups, the rejected dialog or
  error, and action/identity ordering under `qa-artifacts/QA-029/`. Inspect both
  partitions; a visible error alone does not prove isolation.
- **Cleanup:** Cancel open dialogs, restore isolated fixture data, and close
  only tabs created for the case.
- **Status:** Pending. Requires completed account switching and separate QA.

Partition load privacy maps to QA-028. Restore identity and stale-render races
map to QA-029. Existing ordinary stale-write coverage remains QA-009 and QA-017.

### [ ] QA-030 — P1 — Automatic backup storage stays bounded

- **Scope:** `apps/web/src/features/focus/store.ts`; task clearing, conflict
  replacement, and backup restore; isolated guest browser storage.
- **Purpose:** Repeated workspace replacements must not keep an unlimited
  sequence of full copies until the browser quota blocks normal work.
- **Prerequisites:** Shared setup, an isolated empty guest workspace, no active
  timer, and browser QA approval. Save original project storage first.
- **Inputs:** Five tasks named `QA-backup-1` through `QA-backup-5`, estimate 1.
  The ordinary recovery key is `pomodoro:workspace:guest:backup`.
- **Steps:** 1. Add the first task. 2. Mark it Complete. 3. Click Clear
  completed, then Remove tasks. 4. Repeat for the other four tasks. 5. Inspect
  the guest workspace and all keys with its backup prefix. 6. Repeat an approved
  backup restore twice using the same isolated file.
- **Expected results:** New writes use one ordinary backup key per partition,
  not a UUID-named copy for each action. Its value is the last workspace before
  replacement. The primary workspace contains the requested result. Existing
  unrelated keys are not deleted. No history record is added or removed by task
  clearing or backup retention itself.
- **Evidence:** Save sanitized key counts and primary/backup values under
  `qa-artifacts/QA-030/`. Inspect the last task copy and replacement result.
- **Cleanup:** Restore the saved isolated workspace and recovery keys. Remove
  only keys and records created for this case.
- **Status:** Pending. No browser operations have run.

### [ ] QA-031 — P1 — Corrupt recovery keeps one retained copy

- **Scope:** Focus store and Settings backup recovery; route `/settings`;
  isolated guest browser storage. No database is needed.
- **Purpose:** Retain unreadable data without an unlimited sequence of copies
  when the user repeats an explicit recovery.
- **Prerequisites:** Shared setup, approved browser QA, a valid isolated backup
  file, and the original guest storage saved outside browser storage.
- **Inputs:** Malformed guest value `{"schema_version":`; recovery key
  `pomodoro:workspace:guest:corrupt`.
- **Steps:** 1. Put the malformed value in the isolated guest key and reload. 2.
  In Settings, select the valid backup and explicitly choose corrupt-data
  recovery. 3. Confirm replacement. 4. Repeat the corruption and recovery. 5.
  Inspect the primary value and all guest corrupt-recovery keys.
- **Expected results:** One corrupt-recovery key holds the most recent raw
  malformed value. The primary value is the validated restored workspace.
  Ordinary restore cannot bypass corrupt recovery confirmation. Existing
  unrelated storage remains unchanged. Failed writes retain the old primary.
- **Evidence:** Save sanitized key counts, recovery text, and restored backup
  under `qa-artifacts/QA-031/`. Inspect the exact malformed text and result.
- **Cleanup:** Restore the original isolated values. Remove only case keys.
- **Status:** Pending. No browser operations have run.

Bounded local backup retention maps to QA-030 and QA-031. Quota failure and
no-erasure behavior remain covered by QA-005.

### [ ] QA-032 — P1 — Text uses valid Unicode on both boundaries

- **Scope:** Frontend focus schemas and Rust workspace DTOs; guest backup
  restore and future workspace HTTP writes. No production records are used.
- **Purpose:** A browser must not accept isolated UTF-16 surrogates that the
  canonical Rust string representation cannot accept.
- **Prerequisites:** Shared setup, a valid isolated backup, existing data saved
  for comparison, and approval for the separate runtime QA pass.
- **Inputs:** A valid emoji title `Focus 🙂`; JSON text escapes `\ud800` and
  `\udc00` as isolated surrogate values in a title, note, or historical project
  name. Keep every other field from a known valid backup.
- **Steps:** 1. Restore the valid emoji backup and confirm its exact text. 2.
  Attempt each malformed-text backup through Settings. 3. Compare stored data
  after each rejection. 4. After workspace HTTP exists, send the same malformed
  texts using its documented contract and inspect the response.
- **Expected results:** Valid Unicode survives storage and round trips. Each
  isolated surrogate is rejected before a browser store write; existing data
  remains unchanged. Rust rejects malformed Unicode at JSON decoding. Neither
  side silently replaces text with the replacement character.
- **Evidence:** Save sanitized source JSON, errors, and before/after backups
  under `qa-artifacts/QA-032/`. Inspect text bytes and unchanged records.
- **Cleanup:** Restore the saved isolated data and remove fixture files.
- **Status:** Pending. HTTP execution is blocked until handlers exist.

### [ ] QA-033 — P1 — Raw duplicate keys have an explicit parser policy

- **Scope:** Settings backup import and Rust workspace HTTP decoding.
- **Purpose:** Keep parser behavior explicit without a second handwritten JSON
  parser. Stored objects and generated client requests use unique keys.
- **Prerequisites:** Shared setup, a valid isolated backup, original data saved,
  runtime QA approval, and completed HTTP handlers for that part.
- **Inputs:** In a valid backup, replace its single schema version field with
  `"schema_version":0,"schema_version":1`. Reverse these two fields for the
  rejected input. Do not change other fields.
- **Steps:** 1. Restore the first file with explicit confirmation. 2. Export it
  again and inspect its single schema version field. 3. Attempt the reversed
  file and compare stored data. 4. Once HTTP exists, repeat raw duplicate fields
  through the actual documented request body.
- **Expected results:** Backup JSON uses the last duplicate value, then
  validates that one object before storage. The first input normalizes to
  version 1; the reversed input is rejected without mutation. Exported JSON
  contains one key. Rust HTTP requests reject duplicate DTO fields rather than
  choosing one. Generated browser requests never contain duplicates.
- **Evidence:** Save source files, normalized export, and rejected request
  responses under `qa-artifacts/QA-033/`. Inspect the canonical stored object.
- **Cleanup:** Restore isolated data and remove case files only.
- **Status:** Pending. HTTP execution is blocked until handlers exist.

Unicode representation maps to QA-032. JSON parser policy maps to QA-033; strict
DTO limits, normalization, and reference checks remain QA-023.

### [ ] QA-034 — P0 — Prepared mutations cannot cross workspace owners

- **Purpose:** Reject a command that was prepared for account A after the active
  workspace changes to account B. Check the storage-lock boundary, not only the
  route or form state. Cover task, project, template, settings, history, timer,
  and bulk commands. This extends QA-017, QA-028, and QA-029.
- **Prerequisites:** Use the shared isolated setup. Account switching and the
  mutation-owner API must be complete. Use two test accounts in one browser
  profile. Prepare the same valid workspace in both accounts with Settings
  backup restore, so IDs and expected records match. Read the Playwriter
  debugger guide before retaining a real command from its scope. Account login
  and the command-capture procedure are not yet available; record the exact
  source location and supported debugger call before QA.
- **Inputs:** Use task title `Owner baseline`, project `Owner project`, and
  template `Owner template`. Use the defaults for settings and an idle timer.
  Keep the owner captured for A. Do not replace it with B's owner.
- **Steps:**
  1. Sign in as A. Open the relevant editor and prepare its command. Retain the
     actual command and its captured owner with the debugger. Do not add a
     source hook or replace the storage implementation.
  2. Sign in as B in another tab. Return to the first tab and wait until it
     identifies B. Check that A's open editor and text are no longer shown.
  3. Save B's workspace before the retained command runs. Invoke the retained
     command once. Repeat for each command family listed in Purpose, restoring
     the same baseline between commands.
  4. Read B's visible records and stored workspace again. Check A's stored
     workspace too. Run an ordinary B command as a positive control.
- **Expected results:** Each retained A command fails with a workspace-change
  error. It makes no write in A or B and emits no timer completion, alarm, or
  notification. The B control succeeds. Closing an old command must not close a
  new B editor.
- **Evidence:** Save sanitized before/after workspaces, the captured owner
  generation, command names, visible error, and the B control result under
  `qa-artifacts/qa-034/`. Inspect the records, not only promise resolution.
- **Cleanup:** Remove the retained debugger references and isolated records.
  Restore the initial account and settings. Keep production data unchanged.
- **Status:** Pending. Account switching and a documented command-capture
  procedure are execution prerequisites. No command has run.

### [ ] QA-035 — P1 — Returning to an owner does not revive an old command

- **Purpose:** Reject an old A command after an A → B → A switch. A matching
  account ID must not revive a command from an earlier workspace generation.
- **Prerequisites:** Use QA-034's isolated setup and command-capture procedure.
  The first and last A workspace must have the same expected records.
- **Inputs:** Retain A's prepared change of `Owner baseline` to `Old command`.
  Keep its original owner object. Do not create a new owner for the command.
- **Steps:**
  1. Prepare and retain the A command as described in QA-034.
  2. Switch to B and then back to A. Wait for each workspace to load.
  3. Record the new A generation and invoke the retained command once.
  4. Reload A and inspect the task. Save `Current command` from a newly opened A
     editor as a positive control.
- **Expected results:** The original owner is stale even though its account ID
  matches. The task remains `Owner baseline` after rejection and reload. The
  fresh command succeeds. No old editor or confirmation returns.
- **Evidence:** Save the two A generation values, rejection, reload result, and
  positive control under `qa-artifacts/qa-035/`. Do not save credentials.
- **Cleanup:** Remove retained debugger references and isolated records.
- **Status:** Pending. The QA-034 execution prerequisites still apply.

**Ownership coverage map:** Original-owner enforcement maps to QA-034.
Workspace-generation rejection maps to QA-035. Existing record-conflict,
failed-load privacy, and backup cases remain QA-017, QA-028, and QA-029.

### [ ] QA-036 — P1 — Source-owned design-system contracts

- **Purpose:** Remove restricted application styles from UI component `xstyle`
  props. Keep the current lint policy. Do not use imported styles, arrays,
  generic style props, or source-path exceptions to hide violations.
- **Prerequisites:** Complete component and caller repairs. Use the pinned Bun
  toolchain. Read the installed UI sources and plugin 0.1.2 contracts. Static
  lint, format, and typechecks are approved. No running app is needed.
- **Inputs:** Timer, projects, templates, reports, settings, shell, and form
  source files. Include task notes, completed and selected tasks, charts,
  errors, empty states, responsive grids, and selectable theme controls.
- **Steps:** 1. From the repository root, review every application `xstyle`
  value, including local arrays and imported style declarations. Exclude copied
  component implementation files from this caller inventory only. 2. Map each
  property to the unchanged default contract. Trace each finite source-owned
  prop to its implementation; reject arbitrary style passthrough. 3. Run
  `bun lint --no-script`, `bun fmt --no-script --check`, and
  `bun run typecheck`. Check added config sources explicitly if the configured
  lint selection excludes them. 4. Review semantic tags, labels, responsive
  values, and token colors against the previous source. 5. Check that theme
  script and provider configuration match and retain workspace preferences.
- **Expected results:** Application code uses supported component defaults,
  composition, or finite implemented props. Remaining `xstyle` values contain
  only allowed properties. No rule, suppression, or generic escape hatch is
  added. Native semantic content keeps its correct elements. Lint and types have
  zero diagnostics; formatting passes. Theme has one preference source.
- **Evidence:** Save the caller-to-prop source review and static command output
  under `qa-artifacts/QA-036/`. Inspect each mapped property and command exit.
- **Cleanup:** No records or services change. Keep sanitized local evidence.
- **Status:** pending separate QA execution. Component and caller repairs are
  implemented. Source review found only the allowed timer Stack block margins in
  application `xstyle` values. Repository lint, formatting, workspace
  typechecks, and explicit Vite source checks passed after integration. These
  results do not prove CSS extraction, initial paint, or browser behavior.

Coverage: design-system style contracts and source-owned API changes map to
QA-036. Keyboard, responsive, zoom, and contrast checks remain QA-021. Initial
paint, stored theme, system changes, and dark-while-running behavior remain
QA-024. Browser and build checks remain pending and need approval.

### [ ] QA-037 — P0 — Request-local CSP nonces cover SSR scripts

- **Purpose:** Check the nonce boundary in `apps/web/src/server.ts`,
  `apps/web/src/router.tsx`, the document root, and the theme script. Streamed
  scripts must use the nonce captured before SSR attachment.
- **Prerequisites:** Shared setup and explicit approval for a local
  production-like build, server, and browser QA. Use the isolated QA-020 setup
  on `127.0.0.1:13001`, not production. Use an empty guest browser profile with
  no prior service worker. No account or database is needed.
- **Inputs:** Two concurrent fresh requests to `/` in separate project-group
  tabs; a script without a nonce containing `window.__qaCspInlineProbe = true`.
  Do not change the application CSP.
- **Steps:**
  1. Confirm approved build and server commands from the current web package and
     QA-020 setup. Save their versions and tested revision. If the production
     entry cannot start, mark this case blocked; do not use a development
     response as production evidence.
  2. Capture the response headers and HTML for both concurrent navigations.
     Extract each response's CSP nonce and the nonce attributes on its
     application bootstrap, inline theme, and streamed hydration scripts.
  3. Confirm that both pages hydrate and their timer controls work. Inspect
     browser errors and CSP reports before the negative probe.
  4. In one page, append the input script without a nonce through the browser
     automation DOM mutation API. Read `window.__qaCspInlineProbe` and the
     resulting CSP report. Do not execute the input directly with evaluation.
  5. Save and inspect the sanitized response and browser evidence.
- **Expected results:** Both responses return the application HTML with
  `Cache-Control: no-store`. Each required SSR script has its own response's CSP
  nonce; the two response nonces differ. Hydration and the theme script run
  without nonce violations or hydration errors. The script without a nonce is
  blocked, its flag is not true, and its expected CSP violation is distinct from
  normal application errors. No relaxed script directive is needed. Scripts,
  images, and connections allow no unused analytics host. No provider module
  loads or sends data unless a separate integration is implemented.
- **Evidence:** Save sanitized HTML, CSP and cache headers, browser logs, and
  screenshots under `qa-artifacts/QA-037/`. Exclude cookies, authorization
  headers, and unrelated browser data. Inspect nonce matching per response,
  different request nonces, working controls, and the blocked probe.
- **Cleanup:** Close only this case's tabs and stop only its local processes.
  Remove its isolated browser profile; keep sanitized evidence.
- **Status:** pending; build and browser execution need approval. Installed
  source tracing and static checks are not runtime proof.

Coverage: the early router nonce boundary and streamed CSP integration map to
QA-037. Theme preference and initial-paint behavior remain QA-024; source-owned
styling remains QA-036.

## Timer command guard setup

Cases QA-038 through QA-043 use the shared setup with explicit browser QA
approval, two isolated guest tabs in the green `pomodoro` group, and the web
origin `http://127.0.0.1:13001`. No account, backend, or database is needed. Use
default 25/5/15-minute phases with both auto-start settings off. Export an
initial backup through `/settings` and record its settings. Both tabs must use
the same guest partition, `pomodoro:workspace:guest`, without switching owners.
Do not use production data. Save each case's exports and screenshots under its
own ignored `qa-artifacts/QA-NNN/` directory. The reviewer must inspect timer
fields and session records, not only a visible clock.

For a replacement run, start focus A in tab one. In tab two, reset A with its
own confirmation, then start focus B. Save B's baseline backup. Reset may record
partial A time; keep those baseline records in the comparison. Ensure B has not
reached its deadline before the stale command is submitted. If that starting
condition is lost, record it and restore the fixture before running the case.
Natural deadline completion has separate coverage below.

### [ ] QA-038 — P1 — Retained reset rejects a replacement run

- **Purpose:** Bind the original reset confirmation to focus A, not a newer
  same-owner timer. Covers the UI request and locked store comparison.
- **Prerequisites:** Timer command guard setup; idle focus in both tabs.
- **Inputs:** Focus A and B from setup; the timer action with `value="reset"`;
  retain A's confirmation in tab one.
- **Steps:**
  1. Start A in tab one and open its reset confirmation.
  2. Create replacement B in tab two as described in setup. Export B's baseline
     and wait for tab one to display B behind the open dialog.
  3. Confirm the retained request in tab one. Export the resulting workspace in
     tab two and inspect both tabs and the saved records.
- **Expected results:** The stale request reports a timer conflict. B's phase,
  run ID, deadline, selected task, remaining state, and completion count match
  its baseline. Its clock can continue to decrease normally. No session, counter
  change, or requested manual transition is added.
- **Evidence:** Save before/after exports and the conflict screenshot in
  `qa-artifacts/QA-038/`; inspect B and the complete session list.
- **Cleanup:** Restore the initial backup in this isolated profile. Close only
  case tabs and stop only case processes. Retain sanitized evidence.
- **Status:** pending; implementation and browser execution are not verified.

### [ ] QA-039 — P1 — Retained skip rejects a replacement run

- **Purpose:** Bind the original skip confirmation to focus A, not a newer
  same-owner timer. Covers the UI request and locked store comparison.
- **Prerequisites:** Timer command guard setup; idle focus in both tabs.
- **Inputs:** Focus A and B from setup; the timer action with `value="skip"`;
  retain A's confirmation in tab one.
- **Steps:**
  1. Start A in tab one and open its skip confirmation.
  2. Create replacement B in tab two as described in setup. Export B's baseline
     and wait for tab one to display B behind the open dialog.
  3. Confirm the retained request in tab one. Export the resulting workspace in
     tab two and inspect both tabs and the saved records.
- **Expected results:** The stale request reports a timer conflict. B's phase,
  run ID, deadline, selected task, remaining state, and completion count match
  its baseline. Its clock can continue to decrease normally. No session, counter
  change, or requested manual transition is added.
- **Evidence:** Save before/after exports and the conflict screenshot in
  `qa-artifacts/QA-039/`; inspect B and the complete session list.
- **Cleanup:** Restore the initial backup in this isolated profile. Close only
  case tabs and stop only case processes. Retain sanitized evidence.
- **Status:** pending; implementation and browser execution are not verified.

### [ ] QA-040 — P1 — Retained phase change rejects a replacement run

- **Purpose:** Bind the original phase change confirmation to focus A, not a
  newer same-owner timer. Covers the UI request and locked store comparison.
- **Prerequisites:** Timer command guard setup; idle focus in both tabs.
- **Inputs:** Focus A and B from setup; the timer action with
  `value="short_break"`; retain A's confirmation in tab one.
- **Steps:**
  1. Start A in tab one and open its phase change confirmation.
  2. Create replacement B in tab two as described in setup. Export B's baseline
     and wait for tab one to display B behind the open dialog.
  3. Confirm the retained request in tab one. Export the resulting workspace in
     tab two and inspect both tabs and the saved records.
- **Expected results:** The stale request reports a timer conflict. B's phase,
  run ID, deadline, selected task, remaining state, and completion count match
  its baseline. Its clock can continue to decrease normally. No session, counter
  change, or requested manual transition is added.
- **Evidence:** Save before/after exports and the conflict screenshot in
  `qa-artifacts/QA-040/`; inspect B and the complete session list.
- **Cleanup:** Restore the initial backup in this isolated profile. Close only
  case tabs and stop only case processes. Retain sanitized evidence.
- **Status:** pending; implementation and browser execution are not verified.

### [ ] QA-041 — P1 — Confirmation rejects pause and resume changes

- **Purpose:** Compare the full original timer, not only its run ID.
- **Prerequisites:** Timer command guard setup and running focus A.
- **Inputs:** A reset confirmation; pause A in tab two while that dialog is
  open. Repeat from a fresh fixture with pause followed by resume.
- **Steps:** 1. Open reset in tab one. 2. Change A in tab two with the stated
  pause/resume input and export that baseline. 3. Confirm the old request in tab
  one and export the result. 4. Inspect both repeats independently.
- **Expected results:** The run ID can remain the same, but changed deadline or
  fractional remaining time causes a conflict. The stored baseline and sessions
  remain unchanged by the rejected reset. A fresh reset can still use the newly
  displayed timer. No fractional time is rounded by rejection.
- **Evidence:** Before/after exports and conflict screenshots in
  `qa-artifacts/QA-041/`; inspect fractional fields and unchanged records.
- **Cleanup:** Restore the initial isolated backup and settings; close case tabs
  and stop only case processes. Retain sanitized evidence.
- **Status:** pending. Subsecond accounting also remains covered by QA-027.

### [ ] QA-042 — P1 — Natural completion wins for the queued original timer

- **Purpose:** Preserve natural completion when a matching command waits for the
  lock and the original timer then becomes due.
- **Prerequisites:** Timer command guard setup; Web Locks and approved browser
  clock mutation in the isolated profile. Start a fresh 25-minute focus A.
- **Inputs:** The exclusive lock `pomodoro:workspace:guest`, A's stored
  `deadline_ms`, and an original reset request queued before that deadline.
- **Steps:**
  1. Hold the guest Web Lock from the second tab. Keep a release callback in the
     browser automation state. Open and confirm reset in tab one while A is
     still before its deadline. Confirm the manual request is waiting.
  2. Save the original `Date.now` function in tab one. Set its return value to
     A's deadline plus one millisecond, then release the held lock. Do not
     replace timer IDs or stored workspace data.
  3. Restore `Date.now` immediately after the queued command finishes. Export
     the workspace and inspect the history, phase, and completion count.
  4. Retry the retained request and inspect the resulting stored state.
- **Expected results:** The first matching request completes A exactly once
  through the natural completion path. With auto-start off, short break is idle.
  There is one completed A session and one focus-count increment; no additional
  reset or manual phase transition occurs. A stale retry cannot change that
  result or add a duplicate session. Clock setup failures are blocked
  prerequisites, not passes.
- **Evidence:** Save lock/clock setup, exports, history, and completion feedback
  observations in `qa-artifacts/QA-042/`. Inspect the run ID and counts.
- **Cleanup:** Restore the original clock and release every held lock even on
  failure. Restore the initial isolated backup; close case tabs and stop only
  case processes. Retain sanitized evidence.
- **Status:** pending; no clock or lock fixture has been executed.

### [ ] QA-043 — P1 — Immediate controls retain their original intent

- **Purpose:** Bind start, pause, and unconfirmed interruption requests before
  asynchronous queue processing. A later snapshot must not reverse toggle.
- **Prerequisites:** Timer command guard setup and a browser Web Lock holder.
  Confirm request ordering in the actual lock queue before evaluating results.
- **Inputs:** Start from idle focus; pause from running focus; reset, skip, and
  short-break selection from idle focus. Use a fresh fixture per input.
- **Steps:**
  1. Hold the guest lock. Queue a timer-changing action in tab two first.
  2. Activate the stated control in tab one while its original timer is still
     displayed. Release the lock so the earlier change commits first.
  3. Export the result and inspect the intended action, conflict, and timer.
     Repeat each input independently. If action order cannot be established,
     mark that repeat blocked rather than inferring success.
- **Expected results:** Tab one's request compares the timer displayed at its
  activation against storage under the lock. A changed baseline rejects it. A
  start intent cannot become pause, nor pause become start. No rejected command
  changes the earlier action's timer, sessions, or completion count.
- **Evidence:** Save ordering, per-input exports, and conflict screenshots in
  `qa-artifacts/QA-043/`. Inspect each repeat independently.
- **Cleanup:** Release all locks, restore initial isolated data, close case
  tabs, and stop only case processes. Retain sanitized evidence.
- **Status:** pending; request capture and lock ordering need runtime proof.

Coverage: original reset/skip/phase consent maps to QA-038/039/040. Full timer
state and queued command intent map to QA-041/043. Natural completion and
idempotency map to QA-042 and QA-005; fractional accounting remains QA-027.
Owner switches remain QA-034/035. Dialog focus and same-phase/paused-focus
behavior remain QA-008/021. Exact-state ABA after restoring identical timer
fields is not detected by state comparison; this fix adds no persisted timer
revision or stronger ABA guarantee.

Implementation checkpoint: `11736e4` adds the explicit expected-timer inputs,
committed-control capture, and request-scoped confirmation handlers in
`apps/web/src/features/focus/store.ts` and
`apps/web/src/features/timer/components/focus-timer.tsx`. Scoped and repository
lint, formatting, and workspace typechecks passed for this source. These are
working-tree static checks, not proof of isolated hook snapshots or runtime
behavior. QA-038 through QA-043 remain unchecked and pending browser approval.

### [ ] QA-044 — P1 — Database history restores reports and streaks

- **Purpose:** Prove that signed-in focus history and its report/streak results
  come from PostgreSQL, not only the current browser's storage.
- **Prerequisites:** Explicit runtime QA and migration approval; an isolated
  PostgreSQL database with reviewed migrations; the completed API and web app;
  an approved isolated issuer account with no previous history. Confirm the
  database target without recording its connection string. Do not use a
  production account or database. The backend and sync are not implemented yet.
- **Inputs:** Manual records titled `Database report check` for local today and
  yesterday, 25 minutes each. Record the exact local dates in the evidence. Use
  one account and a second isolated browser storage partition for it.
- **Steps:**
  1. Sign in, add both records, save to the account, and record the acknowledged
     server revision. Inspect the saved 3,000 focus seconds and two-day streak.
  2. Restart only the case API process against the same isolated database. Do
     not reset its tables. Open a fresh browser partition with no workspace
     cache and sign in as the same account.
  3. Load the stored workspace and inspect both records, the two-day streak, and
     day/month/year report totals. Use the same local dates and time zone.
  4. Save a sanitized API response and database evidence for that user. Use the
     final documented read-only query after implementation; do not guess table
     or column names. Confirm that no other user's data is returned.
- **Expected results:** Both records and their IDs survive the API restart and
  new browser. Their combined focus is 3,000 seconds, two active days, and a
  current two-day streak on the recorded local test date. Report results match
  that stored history. Browser cache is not required to recover account data.
- **Evidence:** Save sanitized before/after responses, the acknowledged
  revision, report screenshots, and read-only database evidence under
  `qa-artifacts/QA-044/`. Inspect record IDs, dates, ownership, and totals.
- **Cleanup:** Remove only the isolated account's case data through the approved
  cleanup workflow. Stop only case processes and keep sanitized evidence.
- **Status:** pending; blocked until persistence, auth, sync, documented
  database inspection, and runtime/migration approval are available. Coverage
  also uses QA-015–018 for account security, conflicts, and explicit guest
  import.

### [ ] QA-045 — P0 — Captured HTTP account cannot act through new cookies

- **Purpose:** Reject old-account HTTP operations even when shared browser
  cookies now authenticate a different account with the same revision.
- **Prerequisites:** Approved isolated auth/API/database QA; two fixture users A
  and B with distinct history but equal workspace revisions; generated API
  client and the configured same-origin web origin. No production users.
- **Inputs:** A's captured UUID and valid workspace/import payload; B's current
  browser session; the required `X-Pomodoro-User` header set to A. Record the
  exact fixture IDs and revision without saving cookies or tokens.
- **Steps:** 1. Capture A's state, then sign in as B in a shared-cookie tab. 2.
  Send documented workspace GET, PUT, import POST, and logout POST requests with
  B's cookies and A's header. Use the generated client or documented JSON from
  the browser; never export a cookie jar. 3. Inspect each response and re-read
  B's session/workspace with its correct header. 4. Repeat with missing and
  malformed expected-user headers, then with a correct fresh B command.
- **Expected results:** Mismatched identity returns 409, missing/malformed
  headers return 400, and no request returns B's workspace or mutates either
  account. Logout mismatch leaves B signed in. Correct B requests still work.
  Equal revisions never substitute for identity verification.
- **Evidence:** Save sanitized statuses, headers, responses, and before/after
  owned records in `qa-artifacts/QA-045/`. Inspect data and session side
  effects.
- **Cleanup:** Remove isolated fixtures through the approved workflow and stop
  only case processes. Keep sanitized evidence; no credentials in artifacts.
- **Status:** pending; requires completed backend/client and runtime approval.

### [ ] QA-046 — P2 — Old modal completion cannot dismiss a new opening

- **Purpose:** Keep asynchronous confirmation and editor results tied to their
  original dialog opening, even within one account and one mounted control.
- **Prerequisites:** Approved isolated browser QA; a real confirmation mutation
  that can wait on the workspace lock. Use the existing project removal or
  account conflict/import workflow, task editor, and report history editor. No
  new test helpers.
- **Inputs:** Two openings of the same confirmation or editor and a held
  workspace lock. Capture each opening's target, baseline, and owner in the
  evidence.
- **Steps:** 1. Submit the first opening while its operation waits on the
  lock. 2. Close it through an available dismissal and open the control
  again. 3. Release the original operation and inspect the second opening. 4.
  Repeat with a failed original operation and keyboard-only cancel/reopen. 5.
  Repeat for two new-task openings and two report insert/edit openings,
  including the same existing record reopened after dismissal.
- **Expected results:** The original result cannot close, replace, or clear the
  new opening. Original baselines and owner checks still apply. Errors stay
  associated with the correct action; focus returns to the triggering control.
  If dismissal is blocked while pending, verify that behavior instead of
  inventing an unavailable interaction and record the protected path.
- **Evidence:** Save an interaction trace and focused screenshots under
  `qa-artifacts/QA-046/`; inspect the active dialog and focus after each step.
- **Cleanup:** Release locks even on failure, restore isolated fixture data, and
  close only case tabs/processes. Retain sanitized evidence.
- **Status:** pending; no browser or lock fixture has run.

### [ ] QA-047 — P1 — Text validation rejects PostgreSQL null characters

- **Purpose:** Reject text that PostgreSQL JSONB/text cannot store before any
  durable write. Preserve valid Unicode and existing boundary behavior.
- **Prerequisites:** Approved isolated frontend/API/database QA and a valid
  fixture workspace. Use the documented backup and generated API contracts.
- **Inputs:** Insert the JSON escape `\u0000` into a task title, note, template
  title, and historical project name, one field per repeat. Include valid
  Unicode controls such as `日本語` and `Focus 🟢` in separate valid repeats.
- **Steps:** 1. Export a baseline backup. 2. Prepare the stated invalid backup
  and attempt its import. 3. Send its valid-JSON counterpart through the
  documented account workspace API with the current revision and identity. 4.
  Inspect original local/database data and repeat with the valid text.
- **Expected results:** Invalid text fails frontend validation or returns safe
  HTTP 400 before database writes. No silent replacement, truncation, revision
  change, or SQL error reaches the client. Valid Unicode still round-trips. A
  legacy local payload with a null character remains available for explicit
  recovery; hydration must not overwrite its original stored bytes.
- **Evidence:** Save sanitized rejection responses, screenshots, and
  before/after exports in `qa-artifacts/QA-047/`; inspect IDs, text, and
  revisions.
- **Cleanup:** Restore the isolated baseline and remove only case data/files.
  Keep sanitized evidence and stop only case processes.
- **Status:** pending. No backup, validator, endpoint, or database run occurred.

### [ ] QA-048 — P1 — Browser focus controls and compact timer

- **Purpose:** Provide working fullscreen and focus-window controls without
  losing timer state or leaving unsupported browser behavior silent.
- **Prerequisites:** Approved browser QA on the existing local web origin; a
  guest fixture with one running task; browsers with allowed and blocked
  popup/fullscreen settings. Use only the green pomodoro project tab group.
- **Inputs:** The Focus window, Full screen, and Exit full screen controls; the
  `/focus` route; a paused run and a running run of the same task.
- **Steps:** 1. Open `/focus` directly and through Focus window. 2. Observe the
  same timer and task in both windows, pause/resume in one, and inspect the
  other. 3. From the workspace, enter fullscreen. Check that only the timer and
  its browser controls remain. Exit with Escape and the exit button in separate
  runs. Inspect the restored workspace, control label, focus, run ID, deadline,
  and history. Repeat five times with a paused run and a running run. 4. Repeat
  with fullscreen unsupported and popups blocked, then use the offered same-tab
  focus link. 5. Navigate back to reports and check that timer document-title
  updates do not replace the report title.
- **Expected results:** Controls act from the user's activation, not a delayed
  event that loses permission. Errors are visible and announced. The compact
  route retains storage/owner/run guards and has a route back to the workspace.
  Fullscreen hides navigation, tasks, summaries, and the footer without
  unmounting account synchronization. Exit restores the workspace without
  changing the route, resetting the timer, or adding a history record. The
  fullscreen control retains focus when the view changes. No duplicate session
  or timer is created. A denied request leaves the normal workspace usable and
  offers the same-tab focus route. Document titles show only timer phase/time,
  never private task or user names. Exactly one title exists during initial SSR,
  hydration, phase changes, and navigation. Paused fractional seconds round up,
  as on the visible timer. Reports and other routes retain their own titles.
  Compact mode hides the main header/footer without unmounting account or PWA
  subscriptions.
- **Evidence:** Save screenshots and an interaction trace in
  `qa-artifacts/QA-048/`; inspect timer IDs, titles, focus, and errors.
- **Cleanup:** Exit fullscreen, restore browser permissions and fixture data,
  and close only case-created focus windows. Retain sanitized evidence.
- **Status:** pending. Chrome native enter and exit worked on the pre-repair
  running artifact, but the dashboard remained visible. Final-build timer-only
  layout, Escape, focus, denied-request fallback, and state checks remain open.
  Initial evidence: `qa-artifacts/QA-048/fullscreen-ready.txt`,
  `fullscreen-enter.txt`, and `fullscreen-exit.txt`.

### [ ] QA-049 — P2 — Phase and project colors use the design system

- **Purpose:** Make stored color choices visible while preserving accessible
  phase labels and compatible workspaces from before phase-color preferences.
- **Prerequisites:** Approved browser/API QA; guest and account fixtures; light,
  dark, and system appearances. Use existing source-owned design-system tokens.
- **Inputs:** Focus color `orange`, Short break color `green`, Long break color
  `blue`, and projects with `red` and `blue`. Keep a pre-change backup without
  the three new optional preferences and record its original history IDs.
- **Steps:** 1. Set and save the phase colors in Settings. 2. Inspect each
  phase, the compact focus view, and the project indicators. 3. Reload and
  verify account synchronization on a second isolated browser. 4. Import the
  older backup and inspect default colors and unchanged history. 5. Repeat in
  dark appearance, high zoom, and with a screen reader.
- **Expected results:** Choices persist and use finite design-system colors, not
  arbitrary CSS input. Older workspaces get the documented defaults without data
  loss. Phase text and color names remain readable without color vision;
  foreground contrast and focus indicators meet the existing requirements.
- **Evidence:** Save settings/phase/project screenshots and sanitized
  before/after exports in `qa-artifacts/QA-049/`; inspect color names, IDs, and
  retained data.
- **Cleanup:** Restore fixture preferences and backups, remove isolated records,
  and close only case tabs. Keep sanitized evidence.
- **Status:** pending; no browser, validator, or sync scenario has run.

## reference app feature and reverse-engineering tracker

This is an implementation tracker, not a record of passed QA. `Source present`
means code exists. It does not mean integrated, committed, or runtime verified.
Keep each row current as implementation and reference research continue.

### Release scope and implementation

| Priority | Feature                                     | Current implementation                                               | Remaining work                                                        | QA cases                               |
| -------- | ------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------- |
| P1       | Use without login                           | Source present: local guest workspace                                | Verify recovery, offline use, and persistence                         | QA-004, QA-005, QA-020                 |
| P1       | Focus, short break, long break              | Source present                                                       | Verify timing and transitions                                         | QA-006, QA-027, QA-038–043             |
| P1       | Custom durations and break interval         | Source present                                                       | Verify boundary values and saved settings                             | QA-014, QA-027                         |
| P1       | Pause, resume, reset, skip                  | Source present with original-state guards                            | Verify concurrency, elapsed accounting, and focus return              | QA-027, QA-038–043                     |
| P1       | Task estimates, actual counts, notes, order | Source present                                                       | Verify task workflows and history-safe removal                        | QA-008, QA-009                         |
| P1       | Finish estimate and task automation         | Source present                                                       | Verify freshness and automation rules                                 | QA-006, QA-008, QA-014                 |
| P1       | Projects and archive                        | Source present                                                       | Verify totals, archive, and history-safe removal                      | QA-007                                 |
| P2       | Project and phase colors                    | Source integrated with generated contract and legacy defaults        | Verify appearance, persistence, and contrast                          | QA-007, QA-014, QA-049                 |
| P1       | Unlimited task templates                    | Source present                                                       | Verify copies use new IDs and stale edits fail safely                 | QA-010                                 |
| P1       | Day, week, month, yearly reports            | Source present                                                       | Verify date boundaries, saved history, and project totals             | QA-011, QA-012, QA-026, QA-044         |
| P1       | Manual history insert, edit, delete         | Source present                                                       | Verify duration rules, stale edits, and report updates                | QA-012                                 |
| P1       | CSV downloads                               | Source present                                                       | Verify scope, separators, units, escaping, and encoding               | QA-013                                 |
| P1       | Sound, reminders, browser notifications     | Source present                                                       | Verify activation, permission, delivery, and failure feedback         | QA-014, QA-021, QA-027                 |
| P1       | Appearance and running dark mode            | Source present                                                       | Verify initial paint, account preferences, and contrast               | QA-024, QA-036, QA-037                 |
| P2       | Fullscreen and compact focus window         | Route, browser controls, and persistent shell integration present    | Verify browser activation, popup blocking, and compact navigation     | QA-048                                 |
| P2       | Live timer page title                       | Source integrated with route-safe countdown titles                   | Verify single title, hydration, and route changes                     | QA-048                                 |
| P0       | OpenAuth sign-in and server sessions        | Axum authentication source committed; entry mounted in shell         | Confirm external issuer/client setup and run approved auth QA later   | QA-015, QA-016, QA-018                 |
| P1       | PostgreSQL account storage                  | Services and reviewed migration sources committed                    | Apply only to an approved isolated target; verify durability later    | QA-017, QA-044                         |
| P1       | Database-backed streaks and reports         | History persistence, sync, and report calculations integrated        | Verify restart and cross-device history recovery                      | QA-011, QA-017, QA-044                 |
| P0       | Typed HTTP client                           | Client/query source and generated types present                      | Static compatibility checks pass; runtime contract QA remains pending | QA-022, QA-023, QA-045                 |
| P0       | Account synchronization                     | Guarded controller and account controls integrated in the shell      | Verify serialized saves, session discovery, receipts, and recovery    | QA-017, QA-018, QA-034, QA-035, QA-045 |
| P0       | Explicit guest import                       | Server, retained plans, receipt recovery, and controls integrated    | Verify retries, conflicts, and source preservation                    | QA-017, QA-034, QA-045                 |
| P0       | Sync conflicts and logout                   | Owner-bound resolution, fencing, logout, and cache hiding integrated | Verify races, identity changes, cookie behavior, and recovery         | QA-017, QA-018, QA-034, QA-035, QA-045 |
| P1       | Backup export and restore                   | Source present                                                       | Verify encoding, size limits, recovery, and partition ownership       | QA-014, QA-028–033, QA-047             |
| P1       | PWA install, update, offline fallback       | Source present                                                       | Verify install/update and private-cache exclusions                    | QA-019, QA-020, QA-025                 |

### Reference behavior still to investigate

Use observed UI behavior as evidence. Do not copy source, wording, images, or
signature effects. Do not purchase premium access or change the reference
account's settings or records. Record blocked observations as unknown.

| Reference area         | Evidence already captured                                            | Remaining investigation                                                                            | Implementation rule until confirmed                                                    |
| ---------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Timer defaults         | 25/5/15 minutes; long break every four                               | Compare reset/skip/phase changes, pause accounting, and interval counters                          | Keep documented interruption rules; do not claim exact algorithm parity                |
| Background timing      | Deadline-based behavior is a product requirement                     | Observe suspension, reload, overdue transitions, and auto-start behavior                           | Never fabricate unattended focus cycles                                                |
| Task workflow          | Estimates, notes, selection, finish time, and bulk menu observed     | Confirm actual-count reset, completed ordering, removal, and finish-estimate updates               | Keep existing history and explicit confirmations                                       |
| Templates              | Selector and creation controls observed                              | Confirm saved contents, apply/copy behavior, and project references                                | Generate new task IDs; never alias template records                                    |
| Project behavior       | Premium projects and project report totals observed                  | Confirm archive/removal and old history labels                                                     | Preserve historical labels and focus time                                              |
| Summary reports        | Summary/Detail/Ranking, periods, hours, active days, streak observed | Determine day/time-zone, streak, week-start, and empty-period rules                                | Mark calculations as our documented policy, not verified internals                     |
| Yearly reports         | Year option observed but locked                                      | Capture accessible yearly behavior without purchase                                                | Build real yearly totals from saved history; do not invent locked algorithms           |
| History editing        | Date/task/minutes and optional start/end observed; no record saved   | Confirm precedence, cross-midnight behavior, and validation                                        | Keep explicit local-date and elapsed-duration rules                                    |
| CSV download           | Date range, task column, units, and comma/tab options observed       | Obtain an authorized sample to compare headers, dates, decimals, BOM, quoting, and range inclusion | Keep safe exports; exact reference file format remains unverified                      |
| Sound and notification | Alarm/focus sound, volume, repeat, reminder controls observed        | Compare selection and repeat behavior; identify actual browser versus push features                | Use original sounds and explicit browser permission; do not assume mobile push support |
| Theme controls         | Color Themes and hour-format controls observed                       | Confirm phase-color choices and running-dark behavior                                              | Use our design system and compatible stored preferences                                |
| Ranking                | Ranking tab observed                                                 | Establish eligibility, privacy/consent, period, and tie rules                                      | Do not publish private user data or fabricate ranking semantics                        |

### Work order and completion gate

1. Backend services, reviewed migrations, and real generated contracts are
   committed. Database execution and live issuer compatibility remain
   unverified.
2. The guarded account controller and its shell controls are integrated and
   committed, including explicit import, conflict choices, and logout.
3. Compact focus controls, live titles, idle clock, colors, projects, templates,
   reports, history editing, and downloads are integrated in source. Reference
   internals that were locked or unobserved remain unknown, not guessed.
4. Local setup files, README commands, and private-safe discovery metadata are
   committed. Run the permitted full static gate after each final source change.
   Record actual coverage without treating it as runtime QA.
5. Leave runtime cases pending until separately approved. Source presence and
   static checks do not prove browser, storage, issuer, or deployment behavior.

External task integrations, webhooks, ads, paid tiers, native apps, and a mobile
push alarm service remain outside the initial release. Projects, yearly reports,
and downloads are included without a paywall. Template count and byte limits
protect resources; they are not a paid quota. In-memory uncertain request facts
do not survive a full page reload, which can require a new conflict review.

### [ ] QA-050 — P2 — Idle and paused finish estimates stay current

- **Purpose:** Cover clock updates in `features/focus/store.ts` and the `/`
  finish estimate without advancing a stopped timer or changing saved work.
- **Prerequisites:** Approved isolated browser QA at the configured web origin.
  Use a guest workspace with default 25/5/15 durations and no history. Use a
  local minute boundary; no system-clock change is required.
- **Inputs:** One incomplete task named `Estimate check`, estimate 1, actual 0.
  Start with an idle focus timer. Repeat with the same timer paused after start.
- **Steps:** 1. Open `/` and record the displayed finish time, timer value,
  workspace data, and network log just before a minute boundary. 2. Do not click
  a control. Wait across the next minute. 3. Start and pause the timer, then
  repeat the observation across another minute boundary.
- **Expected results:** The finish estimate advances by one displayed minute
  within the next clock tick. The idle or paused countdown stays unchanged. Task
  actual counts, history, persisted workspace, and owner stay unchanged. A
  clock-only update must not trigger an account save or change sync status.
- **Evidence:** Save before/after screenshots and sanitized network records in
  `qa-artifacts/QA-050/`. Inspect displayed minutes and absence of saves.
- **Cleanup:** Remove the isolated task and restore guest settings. Stop only
  processes started for the case.
- **Status:** pending; browser and endpoint execution remain deferred.

### [ ] QA-051 — P1 — Today summary changes at local midnight

- **Purpose:** Cover the `/` Today at a glance date boundary while the timer is
  idle. Preserve saved history instead of counting yesterday as today.
- **Prerequisites:** Approved isolated browser QA near local midnight, or an
  approved isolated clock-control mechanism. Discover and record any clock tool
  before use. Do not change the shared machine clock. Keep analytics off.
- **Inputs:** One 25-minute manual session on the current local date. No running
  timer. Record the exact local date and timezone in the evidence.
- **Steps:** 1. Create the isolated session through Reports. 2. Open `/` before
  local midnight and confirm Focus recorded is 25m. 3. Keep the page open and
  idle across local midnight. 4. Inspect Today at a glance and open Reports with
  the previous date selected.
- **Expected results:** Focus recorded changes to 0m on the first clock tick
  after midnight. The prior date retains its 25-minute session with the same ID.
  No new session, task completion, workspace write, or timer run appears.
- **Evidence:** Save dated screenshots and the prior-date report in
  `qa-artifacts/QA-051/`; inspect date, timezone, totals, and stable session ID.
- **Cleanup:** Remove the isolated manual session and undo only approved
  page-local clock controls. Restore the original selected report date.
- **Status:** pending; execution needs approved browser prerequisites.

### [ ] QA-052 — P1 — Workspace request envelope boundary

- **Purpose:** Cover typed save/import transport validation and safe error
  correlation in `features/account/queries.ts`. The client guard must agree with
  the API's 20,000,000-byte body limit, not replace server enforcement.
- **Prerequisites:** Explicitly approved isolated API/client QA. Use a verified
  account and the actual generated DTOs. Discover an approved way to call the
  existing query mutations with schema-valid large inputs before execution; no
  new harness or test library is authorized by this plan.
- **Inputs:** Schema-valid save/import envelopes of exactly 20,000,000 and
  20,000,001 UTF-8 bytes, including wrapper fields and import ID. Include
  Japanese text and emoji. Also use a documented JSON error with a safe request
  UUID, and a non-JSON upstream error. Exact fixture construction is blocked
  until the approved client-call mechanism is recorded.
- **Steps:** 1. Record the mechanism and exact fixture byte counts. 2. Invoke
  save and import with each boundary input. 3. Inspect the network log for
  rejected requests and stored revisions for all calls. 4. Inspect the safe
  client error after JSON and non-JSON failures.
- **Expected results:** Over-limit envelopes fail before fetch with a useful
  size error and no write or revision change. The exact limit is not rejected by
  the client size guard; the API still enforces all other validation. Count
  UTF-8 bytes, not UTF-16 string length. Valid JSON error IDs remain available
  for support. Non-JSON failures retain a safe generic error and do not leak
  response text or trigger automatic retries.
- **Evidence:** Save sanitized byte counts, request traces, revision responses,
  and error fields in `qa-artifacts/QA-052/`.
- **Cleanup:** Remove isolated records and restore their baseline. Retain no
  large payloads or private workspaces in committed files.
- **Status:** blocked on an approved client-call mechanism and runtime QA.

### [ ] QA-053 — P0 — Session changes supersede pending account work

- **Purpose:** Cover sync-controller epochs, query cancellation, account
  markers, and owner invalidation during reads, writes, import, and logout.
- **Prerequisites:** Approved isolated browser/API QA with two local accounts A
  and B, two project-group tabs, and approved request delay controls. Never use
  production identities. Record the approved delay mechanism first.
- **Inputs:** Distinct task names `A private` and `B private`; a pending A write
  or import, then a verified B login in the other tab. Repeat A to B to A.
- **Steps:** 1. Delay each account operation in turn. 2. Change the shared
  session through the other tab. 3. Observe marker-driven partition hiding and
  owner changes. 4. Release responses out of order and trigger focus/online
  refreshes. 5. Confirm the newest session query is not canceled by older
  cleanup.
- **Expected results:** No A response updates B's workspace, stamps, feedback,
  or query data. Old commands reject after owner changes. In-flight old work
  cannot report import/logout completion in a newer context. Query cleanup is
  synchronous or scoped; a stale continuation never cancels a newer discovery.
  Offline discovery does not pretend to establish an anonymous session.
- **Evidence:** Save sanitized operation order, owner generations, request user
  headers, screenshots, and query state in `qa-artifacts/QA-053/`.
- **Cleanup:** Restore both isolated workspaces and sessions; remove delay
  controls and close only case-created tabs.
- **Status:** pending; run only within the approved isolated QA scope.

### [ ] QA-054 — P0 — Recover a lost save after reload

- **Purpose:** Keep the exact sent save facts across reload and preserve later
  local edits. A clean stamp must describe acknowledged content only.
- **Prerequisites:** Use the journal setup below and one verified isolated
  account. Response-loss controls must forward each real request only once.
- **Inputs:** Task `Save baseline`; set its note to `sent`, then `later` while
  the first PUT `/api/workspace` response is held. Record revision E and the
  sent workspace hash. No other account edits run in this case.
- **Steps:** 1. Let the `sent` PUT commit, but drop its response. 2. Keep the
  `later` local edit. 3. Reload before any successful retry and verify the same
  account again. 4. Inspect the stored journal and the first recovery GET. 5.
  Allow the remaining local edit to sync and reload once more.
- **Expected results:** Recovery retains E and the sent hash. A strictly newer
  matching server version acknowledges `sent` without replacing `later`. The
  next save uses the acknowledged revision. Both final local and server notes
  are `later`; the journal is retired only after its stamp commits. No new
  ordinary save bypasses the journal and no parallel save loop runs.
- **Evidence:** Save sanitized hashes, revisions, operation order, primary
  workspace hashes and final notes in `qa-artifacts/QA-054/`.
- **Cleanup:** Restore isolated task notes and remove interception/listeners.
- **Status:** pending; approved isolated QA is available, but a permitted live
  identity and final journal implementation remain prerequisites.

### [ ] QA-055 — P0 — Retain original import facts after reload

- **Purpose:** Recover the original import after a lost response without
  uploading a changed guest source or overwriting newer local/account work.
- **Prerequisites:** Journal setup; one verified isolated account, its second
  tab and guest data. Use real receipt responses, not fabricated sessions.
- **Inputs:** Guest task `Guest import original`, one 25-minute guest session,
  original import ID I and revision E; later guest task `Guest import changed`,
  account note `Local after import`, and remote task `Remote after import`.
- **Steps:** 1. Confirm the original import and lose its committed response. 2.
  Keep the later account note locally and add the remote task in the second
  tab. 3. Change the guest source without deleting its backup. 4. Reload and
  verify the original account again. 5. Open the pending-import recovery action
  and retry its explicitly displayed original snapshot. 6. Reload the resulting
  conflict before choosing either version.
- **Expected results:** The retry uses I, E and the original guest bytes/hash,
  not the new guest source. Its receipt may return advanced account work. Both
  the later local note and remote task remain available. The original account
  baseline, not the fresh recovery dialog guard, controls replacement. A changed
  local workspace keeps a durable conflict barrier across the second reload; no
  clean stamp or ordinary save silently replaces imported data. Guest source is
  unchanged by import, and history IDs do not duplicate.
- **Evidence:** Save sanitized request IDs/hashes/revisions, journal tokens,
  local/remote summaries and the reloaded conflict in `qa-artifacts/QA-055/`.
- **Cleanup:** Restore isolated guest/account backups and remove interception.
- **Status:** pending; permitted live identity and final journal implementation
  remain prerequisites. Do not bypass authentication to execute this case.

### [ ] QA-056 — P1 — Account requests have a bounded browser lifetime

- **Purpose:** Keep blocked account requests from holding sync or session
  recovery forever. Cover the browser API client and existing cancellation.
- **Prerequisites:** Approved isolated browser/API QA and approved request delay
  controls. Keep the browser active when measuring the timeout.
- **Inputs:** A session read, workspace read, save, import, and logout whose
  response is delayed beyond 30 seconds; also a caller-canceled read.
- **Steps:** 1. Delay each response in turn and record elapsed active time. 2.
  Observe rejection at the browser deadline. 3. Cancel a read earlier and verify
  that cancellation is not replaced by a new timeout. 4. Restore the network and
  use explicit sync/session recovery.
- **Expected results:** Fetch combines the caller's abort signal with a
  30-second browser timeout. No action waits forever or retries automatically.
  Account operations do not park in the SDK's offline queue before fetch;
  offline requests reject or reach the same deadline and release barriers. A
  timed-out mutation remains uncertain until server state or its retained
  receipt is checked; the UI never claims that it rolled back or saved.
- **Evidence:** Save sanitized elapsed times, abort/error fields, request order,
  and recovery state in `qa-artifacts/QA-056/`.
- **Cleanup:** Remove delay controls and restore isolated records and sessions.
- **Status:** pending; browser and endpoint execution remain deferred.

### [ ] QA-057 — P1 — Reject damaged backup encodings

- **Purpose:** Reject invalid UTF-8 before a restore confirmation can silently
  replace damaged bytes with a different valid character.
- **Prerequisites:** Approved browser QA in an isolated guest workspace. Export
  a baseline backup first. Use existing local tools to create case inputs; do
  not add test infrastructure.
- **Inputs:** A valid UTF-8 backup with Japanese and emoji text; the same file
  with a UTF-8 BOM; and a copy whose title contains an invalid byte sequence
  such as hexadecimal `C3 28`. Keep every file below 10,000,000 bytes.
- **Steps:** 1. Open `/settings` and choose each file in Backup. 2. Prepare the
  restore. 3. For valid files, inspect the confirmation and restore
  explicitly. 4. For the damaged file, inspect the error and current workspace.
- **Expected results:** Valid UTF-8 and its BOM preserve the exact text. Damaged
  UTF-8 produces a read error before confirmation; no replacement character,
  workspace write, account save, or backup deletion occurs. Existing JSON,
  schema, owner, size, and confirmation guards still apply.
- **Evidence:** Save input hashes, sanitized error screenshots, and before/after
  workspace summaries in `qa-artifacts/QA-057/`.
- **Cleanup:** Restore the baseline and remove only case-created files.
- **Status:** pending; browser execution remains deferred until features end.

### [ ] QA-058 — P0 — Do not acknowledge an uncommitted recovery fence

- **Purpose:** Preserve uncertain writes until a replacement save actually
  advances the account revision. Cover rejected and timed-out no-op fences.
- **Prerequisites:** Approved isolated browser/API QA and approved delayed,
  dropped, and rate-limited response controls. Keep guest and account backups.
- **Inputs:** One uncertain save or guest import at revision R; matching local
  and server data; a no-op replacement with expected revision R; rejection 429.
- **Steps:** 1. Make an original mutation uncertain. 2. Choose
  `Use account version` in conflict recovery. 3. Delay or drop the no-op save
  response before commit and read the unchanged server revision R. 4. Repeat
  with a definitive 429 rejection of the replacement. 5. Release the original
  request, then retry recovery against the current server state.
- **Expected results:** Equal content at R does not prove that a save at R
  committed. Recovery retains the original facts after a rejected replacement.
  Only a matching workspace at a revision greater than R proves the fence. Old
  requests cannot apply after a confirmed fence, and neither local edits nor
  guest source records are silently discarded.
- **Evidence:** Save sanitized hashes, revisions, request ordering, and pending
  recovery state in `qa-artifacts/QA-058/`.
- **Cleanup:** Remove response controls and restore isolated workspaces.
- **Status:** pending; runtime execution remains deferred.

### [ ] QA-059 — P0 — Recheck cache readiness before dispatch

- **Purpose:** Prevent queued account commands from sending a stale snapshot
  after another tab makes the active cache invalid without changing its owner.
- **Prerequisites:** Approved isolated browser QA with two project-group tabs, a
  verified account, its cache key, and an exported backup. Discover the key from
  the verified session ID; do not use production data.
- **Inputs:** A pending save, import, or logout; malformed JSON `{` in the
  active account cache; the valid backup used to restore that cache.
- **Steps:** 1. Queue each account action before its dispatch guard. 2. Damage
  the active cache in the other tab and wait for its storage event. 3. Release
  the queued action. 4. Restore the cache through the explicit backup workflow
  and retry account recovery. Repeat with an already-sent request.
- **Expected results:** Unhydrated or failed cache state prevents a new request
  despite an unchanged owner and last valid snapshot. Already-sent requests
  retain uncertain facts, no false saved state appears, and recovery remains
  available after the cache is repaired.
- **Evidence:** Save sanitized readiness/error states and request counts in
  `qa-artifacts/QA-059/`.
- **Cleanup:** Restore the original cache and remove queued-request controls.
- **Status:** pending; browser execution remains deferred.

### [ ] QA-060 — P1 — Set up an isolated local account database

- **Purpose:** Cover the pinned local PostgreSQL service, environment loading,
  explicit migrations, and documented development entrypoints.
- **Prerequisites:** Explicit approval to start a local database and apply
  migrations; Docker Compose v2 or compatible Podman Compose; free local port
  5432; pinned Bun and Rust. Inspect existing processes first and never replace
  a running database or use production credentials.
- **Inputs:** A new `pomodoro-local` volume, a local-only password in
  `LOCAL_POSTGRES_PASSWORD`, and a matching local `DATABASE_URL`.
- **Steps:** 1. Follow README setup from a fresh checkout. 2. Start only the
  documented local database service. 3. Apply `bun run db:migrate` to the
  confirmed isolated target. 4. Start the web/API through documented
  commands. 5. Complete QA-044 against this target and verify its named volume
  survives a normal container stop and restart.
- **Expected results:** The pinned image uses the PostgreSQL 18 data-volume
  path, the port binds only to loopback, and no migration runs automatically.
  Web and API use ports 13001 and 18001. Backend environment values are never
  exposed through client configuration. Existing services and data are
  untouched.
- **Evidence:** Save sanitized image digest, service state, migration output,
  and persistence results in `qa-artifacts/QA-060/`; do not print resolved
  secrets.
- **Cleanup:** Stop only case-started processes and containers. Preserve the
  named volume unless separate destructive-cleanup approval is given.
- **Status:** pending; service startup and migrations remain unapproved.

### [ ] QA-061 — P1 — Keep public metadata separate from personal routes

- **Purpose:** Provide canonical public metadata without indexing personal
  workspace screens, staging URLs, query strings, or private content.
- **Prerequisites:** Approved production-like build and browser/HTTP QA with a
  clean HTTPS `PUBLIC_ORIGIN`, plus a separate non-production environment. Keep
  account data isolated and use only nonpersonal example task titles.
- **Inputs:** `/`, `/focus`, `/projects`, `/templates`, `/reports`, `/settings`,
  `/robots.txt`, and `/sitemap.xml`; a valid report query and an unknown path.
- **Steps:** 1. Inspect server-rendered route heads before hydration. 2. Fetch
  robots and sitemap through the public web origin. 3. Repeat in non-production
  and after opening a report query. 4. Run QA-048 title checks while a timer is
  active, then navigate to personal routes.
- **Expected results:** Production sitemap contains only the homepage with a
  safe canonical origin. Personal routes are noindex and never enter sitemap.
  Descriptions and social metadata contain no user data or query strings.
  Non-production disallows indexing. MIME types, statuses, request IDs, and
  existing security headers remain correct. Live timer titles and normal route
  titles keep working, without duplicate canonical or title elements.
- **Evidence:** Save sanitized SSR heads, XML, robots text, headers, and title
  observations in `qa-artifacts/QA-061/`.
- **Cleanup:** Restore environment settings and stop only case-started
  processes.
- **Status:** pending; build, browser, and HTTP execution remain deferred.

### [ ] QA-062 — P1 — Commit checks use only the staged snapshot

- **Purpose:** Make commit checks inspect the exact staged tree and preserve
  unrelated worktree, index, and untracked content.
- **Prerequisites:** Pinned tooling and approval for the isolated native check
  pass. Any deliberate failure fixtures require separate approval. No app,
  database, browser, build, or test runner is needed.
- **Inputs:** The actual staged tree ID; tracked configuration and lockfiles;
  independently recorded index/worktree/untracked hashes. For a later approved
  isolation regression, use staged and unstaged variants of one local fixture.
- **Steps:** 1. Inspect `lefthook.yml` and its actual snapshot runner. 2. Record
  input hashes. 3. Run the documented native staged-snapshot check. 4. Inspect
  archived source, dependency workspace links, complete owning/dependent type
  coverage, Rust checks, and cleanup. 5. Compare original hashes. Run deliberate
  opposing staged/worktree variants only after fixture approval.
- **Expected results:** Results belong to the staged tree, not dirty worktree
  sources or borrowed workspace symlinks. Required configuration receives
  explicit coverage. Native checks do not skip unsupported source silently.
  Original content remains unchanged and temporary snapshots are removed after
  success, failure, or ordinary SIGINT/SIGTERM. Owned check process groups stop
  before cleanup. Hard-kill recovery is not an automatic cleanup guarantee.
- **Evidence:** Save sanitized tree IDs, logs, dependency-link targets, and hash
  comparisons in `qa-artifacts/QA-062/`.
- **Cleanup:** Remove only owned temporary snapshots and approved fixtures.
- **Status:** pending full acceptance after repair `7c21a64`. Earlier installed
  SIGINT/SIGTERM runs failed; retain `docs/hook-signals-qa.md` as that evidence.
  The final immutable-fixture rerun recorded SIGINT exit 1 and no observed owned
  process/temp entries by 1.401 seconds. SIGTERM outer exit was -15 at 0.037
  seconds; the surviving owner exited 1 at 1.363 seconds, with cleanup observed
  by 1.601 seconds. Fixture index/worktree/untracked bytes matched. See
  `qa-artifacts/QA-109/final-rerun/signal-evidence/` and
  `docs/final-hook-owner-qa.md`. Original script hashes match the repair;
  fixtures used recorded HEAD plus those overlays. Exact ordering between
  process samples and SIGINT owner status remain unproven, so this case is not
  checked off. Later actual project commits passed normal isolated gates.

### [ ] QA-063 — P1 — Push checks cover each actual origin tip

- **Purpose:** Check distinct commit tips sent to the configured origin,
  including new branches and tags, instead of checking the working tree.
- **Prerequisites:** Pinned tooling. Explicit approval for disposable Git
  remotes and transport fixtures before executing push-behavior regressions. No
  real remote write or application service is authorized by this case.
- **Inputs:** Actual pre-push remote/ref input; two distinct commit tips;
  duplicate tips; a new branch; an annotated tag; a deletion; and an unsupported
  input.
- **Steps:** 1. Inspect the installed hook's real stdin/remote argument
  mapping. 2. Confirm the runner resolves the configured origin and dereferences
  commit tips without using a guessed branch or current HEAD. 3. After fixture
  approval, exercise the listed inputs against only disposable local remotes. 4.
  Inspect full snapshot coverage per unique tip, rejected unsupported inputs,
  and unchanged original workspace hashes.
- **Expected results:** Every distinct pushed origin commit gets a complete
  isolated native gate, including new branches and tags. Duplicate commit tips
  need one gate; deletions do not check a nonexistent tree. Ambiguous inputs and
  unsupported coverage fail closed. No real origin is modified during QA.
- **Evidence:** Save sanitized ref inputs, resolved commit/tree IDs, gate logs,
  and unchanged input hashes in `qa-artifacts/QA-063/`.
- **Cleanup:** Remove only approved local transport fixtures and snapshots.
- **Status:** pending; snapshot source and the installed manager handoff are
  present. Transport fixtures remain unapproved. Source review is not proof of
  real multi-ref, tag, deletion, or interruption behavior.

### [ ] QA-064 — P0 — Push metadata does not enter shell text or logs

- **Purpose:** Keep remote credentials and shell syntax out of hook command
  expansion and verbose tracing.
- **Prerequisites:** Explicit approval for a disposable local hook-transport
  fixture. Use the pinned manager and installed rc handoff. Never use a real
  remote credential or perform a real network push for this case.
- **Inputs:** `LEFTHOOK_VERBOSE=1`; raw remote name `origin`; the fake URL
  `https://qa064:qa064-marker@example.invalid/$(printf qa064-evaluated)`; valid
  ref stdin from the fixture's isolated commit. These marker values are not
  credentials. Do not connect to this URL.
- **Steps:** 1. Record the local fixture's files and sanitized marker. 2. Invoke
  its installed pre-push hook with the synthetic raw arguments and ref stdin,
  not a real transport. 3. Inspect hook output and generated child command
  arguments, not the original Git protocol input. 4. Confirm the marker was
  neither evaluated nor echoed and the intended origin commit still received the
  complete snapshot gate.
- **Expected results:** The rc stops tracing before exporting raw arguments,
  clears those original positional arguments before Lefthook, and passes only
  constant script arguments. No synthetic credential appears in hook logs or
  command text; shell punctuation has no executable effect. Missing capture
  fails closed rather than silently passing origin checks.
- **Evidence:** Save redacted output, argument observations, and unchanged file
  hashes in `qa-artifacts/QA-064/`.
- **Cleanup:** Remove only the approved disposable fixture and its artifacts.
- **Status:** pending; source guards are implemented, but no transport fixture
  or credential-logging experiment has run.

### [ ] QA-065 — P1 — Snapshot export never replaces a tracked file

- **Purpose:** Fail closed when a tracked source file uses the reserved policy
  path. Never validate replacement bytes that differ from the Git tree.
- **Prerequisites:** Explicit fixture approval and a disposable local repository
  with the real pinned tools. Do not add fixture files to this application.
- **Inputs:** A staged root `.snapshot-policy.toml` containing
  `sentinel = "qa065"`. Record its Git blob and worktree digest.
- **Steps:** 1. Add the sentinel only in the approved disposable repository. 2.
  Invoke its installed pre-commit gate. 3. Inspect the exit status, sentinel
  digests, and temporary-directory cleanup.
- **Expected results:** Exclusive file creation rejects the collision. The gate
  fails rather than replacing the source with its derived policy. The original
  staged and worktree contents remain unchanged. No success result is issued.
- **Evidence:** Save sanitized output, object IDs, file hashes, and cleanup
  observations under `qa-artifacts/QA-065/`.
- **Cleanup:** Remove only the approved disposable fixture and artifacts.
- **Status:** pending; no collision fixture has run.

### [ ] QA-066 — P1 — StyleX styles load under the development CSP

- **Purpose:** Repair the observed browser-default interface without replacing
  StyleX or relaxing the production policy.
- **Prerequisites:** Existing web dev process on `http://127.0.0.1:13001`,
  Playwriter session 3 in green `pomodoro-qa`, backend intentionally offline.
  Preserve any existing guest records. No database or migration is required.
- **Inputs:** Main route `/`, viewport 1440 by 900, then 390 by 844; root CSS
  import and a request-specific Vite nonce meta before the head content.
- **Steps:** 1. Reload the existing project tab. 2. Inspect fresh browser logs,
  body typography, background, timer controls and generated stylesheet rules. 3.
  Verify that a full reload and a source-driven HMR update retain styling. 4.
  Repeat on mobile; do not create account or production records.
- **Expected results:** The page uses Yopem fonts, tokens, spacing and controls,
  not browser-default links and inputs. No CSS injection is blocked by CSP.
  StyleX extraction remains active. Production CSP gains no blanket exception.
- **Evidence:** Save before/after screenshots and sanitized console and style
  observations under `qa-artifacts/QA-066/`. Do not save nonce values.
- **Cleanup:** Restore the original viewport. Leave the requested web process
  running; stop no unrelated process or browser tab.
- **Status:** pending. The initial browser snapshot and screenshot confirm a
  completely unstyled interface and blocked Vite style injection.

### [ ] QA-067 — P1 — Header spacing and account disclosure

- **Purpose:** Fix the clipped brand, crowded navigation and oversized sync
  error in the reported screenshot. Keep account failures discoverable.
- **Prerequisites:** Shared local browser setup; web on port 13001. Keep the
  backend offline for the guest error state. Preserve existing workspace data.
- **Inputs:** `/` at 1440 by 900 and 390 by 844; guest account discovery error.
- **Steps:** 1. Inspect the header and its alignment with main content. 2. Open
  the account disclosure using its button, then close with Escape. 3. Tab
  through the brand, navigation and account button. 4. Visit Projects and return
  to Timer. 5. Inspect `/focus/` separately.
- **Expected results:** Brand and icon are fully visible. Header has balanced
  padding and no page-wide overflow. Navigation remains usable on mobile. The
  account button is compact; full sync feedback and retry controls appear in its
  accessible dialog. Failures are not erased or reported as successful. Closing
  returns focus to the trigger. Compact mode hides only shell chrome; the
  account controller stays mounted and guest records remain unchanged.
- **Evidence:** Save desktop/mobile screenshots and sanitized fresh console
  observations in `qa-artifacts/QA-067/`; inspect focus return and active links.
- **Cleanup:** Close only the opened disclosure and restore the viewport. Leave
  the requested dev process running. No data cleanup is needed.
- **Status:** pending.

### [ ] QA-068 — P1 — Consistent application layouts

- **Purpose:** Redesign layout only on Timer, Projects, Templates, Reports,
  Settings and compact Focus without changing their workflows or stored data.
- **Prerequisites:** Existing web dev process and project browser group; backend
  remains offline. Preserve the current guest workspace. Source review must
  compare all existing controls and owner-bound actions before and after.
- **Inputs:** `/`, `/projects`, `/templates`, `/reports`, `/settings`,
  `/focus/`; viewport sizes 1440x900, 1024x768, 768x1024 and 390x844.
- **Steps:** 1. Visit each route directly and through navigation. 2. Inspect the
  title, primary action, content alignment and responsive columns. 3. Tab
  through visible controls; inspect focus styles and dialog return. 4. Inspect
  report filters and settings sections without saving changes. 5. Compare
  original action availability against the changed source.
- **Expected results:** One readable heading hierarchy, equal content edges,
  consistent page spacing, clear primary actions and no clipped or overlapping
  controls. Mobile layouts stack cleanly without page-wide horizontal scroll. At
  390 pixels, all three timer phase controls fit on one row. Yopem UI and StyleX
  remain the design system. No feature, validation, stale baseline check,
  account owner guard or timer precision rule is removed.
- **Evidence:** Save one desktop and mobile screenshot per route under
  `qa-artifacts/QA-068/`, plus sanitized console and layout observations.
- **Cleanup:** Close opened dialogs, restore the viewport and keep the existing
  server running. No writes or data cleanup are needed for layout inspection.
- **Status:** pending. Layout inspection alone does not prove production build,
  persistence, authentication or offline behavior.

### [ ] QA-069 — P1 — Lazy route boundaries

- **Purpose:** preserve every page while removing eager page imports and the
  framework's exported-component split warnings.
- **Prerequisites:** shared setup; completed layout commits; approved local
  build; existing web process and the QA-owned browser tab.
- **Inputs:** `/`, `/focus/`, `/projects/`, `/templates/`, `/reports/`,
  `/settings/`; reports search `?period=year&date=2026-01-01&page=1`.
- **Steps:** 1. Keep route metadata, validation and access behavior in each
  eager route. Put its UI in the matching `index.lazy.tsx` route file. 2. Run
  the existing route generator and static checks from the root. 3. Build web
  with `PUBLIC_ORIGIN=https://pomodoro.example` and analytics disabled. 4. Load
  each direct URL, reload and use back/forward navigation. 5. Inspect browser
  requests, headings, search controls, metadata and logs.
- **Expected results:** URLs and route IDs stay unchanged. Metadata and search
  validation run before rendering. Named route components remain in route files.
  Page code loads through framework-owned lazy imports. No component export
  split warning or existing 500 kB chunk warning remains. No threshold or check
  is weakened.
- **Evidence:** `qa-artifacts/QA-069/build.txt`, route request observations and
  sanitized snapshots; inspect emitted route chunks and each direct page.
- **Cleanup:** restore the timer route; keep owned processes available for QA.
- **Status:** pending. The first production build emitted an 820.90 kB client
  asset. Development also reported exported route component split warnings.

### [ ] QA-070 — P1 — PWA build output compatibility

- **Purpose:** resolve the missing browser runtime, obsolete worker option and
  wrong precache output directory without removing offline or update behavior.
- **Prerequisites:** shared setup; direct `workbox-window` dependency; pinned
  Vite and PWA plugin; approved local production build.
- **Inputs:** existing worker source, injection point and private cache rules;
  `PUBLIC_ORIGIN=https://pomodoro.example`; analytics disabled.
- **Steps:** 1. Use the supported worker-only Vite plugin hook to replace the
  obsolete worker output option with its current single-output equivalent. 2.
  Match PWA output and glob scanning to the actual web client output. 3. Build
  web from `apps/web`. 4. Inspect `.output/public/sw.js`, its precache URLs,
  public assets and offline files. 5. Continue the existing offline and update
  browser cases against an owned production-like listener.
- **Expected results:** build succeeds without missing imports, deprecated
  worker options or unmatched asset globs. One worker is produced. Its manifest
  contains actual client assets and offline files, but no API, auth or private
  responses. App route splitting stays enabled; updates still require consent.
- **Evidence:** `qa-artifacts/QA-070/build.txt` and sanitized asset/manifest
  inventory; inspect paths and each later browser result before recording pass.
- **Cleanup:** retain local build artifacts for the remaining QA cases. Do not
  delete browser caches or service workers belonging to another origin.
- **Status:** pending. The first build failed to resolve `workbox-window` and
  warned about `inlineDynamicImports` and an unmatched `dist` asset glob.

### [ ] QA-071 — P0 — Trusted edge client addresses

- **Purpose:** preserve per-client rate limits behind an explicitly trusted edge
  without accepting forged forwarding headers from direct clients.
- **Prerequisites:** newly owned isolated API/database; a free API port 18001;
  exact trusted peer `127.0.0.3`; no real issuer account. Discover the final
  launcher and edge commands from the completed source before execution.
- **Inputs:** `TRUSTED_PROXY_IPS=127.0.0.3`; reserved client addresses
  `198.51.100.10` and `198.51.100.11`; invalid values `unknown`, an empty
  trusted-peer header, two header fields and a comma-separated address chain.
- **Steps:** 1. Review startup validation and trusted peer matching. 2. From the
  trusted loopback source, send supported requests with each reserved address as
  the single `X-Forwarded-For` value. 3. Exhaust the existing ten-request auth
  window for the first address without following issuer redirects; inspect the
  next response and the second address. 4. Repeat from an untrusted source with
  forged address values. 5. Send missing, malformed and duplicate forwarding
  headers from the trusted source. 6. Check liveness, readiness and safe error
  headers.
- **Expected results:** separate trusted client addresses get separate existing
  rate buckets. The exhausted bucket returns 429 with Retry-After. Direct
  clients cannot choose their rate bucket through forwarding headers. Trusted
  peers must provide exactly one valid address; invalid inputs return 400 and no
  auth challenge or workspace write. Empty configuration trusts no peer. No rate
  threshold is increased, global forwarding trust enabled or client address
  placed in unbounded metric labels.
- **Evidence:** sanitized status/header counts and source-address observations
  under `qa-artifacts/QA-071/`; redact challenge cookies and redirect query
  values. Inspect results for both client addresses and direct access.
- **Cleanup:** do not follow issuer redirects. Keep the owned database for
  remaining QA; temporary challenges expire. Stop only owned QA processes.
- **Status:** pending. Trusted-proxy source repair is complete. The isolated
  runtime pass in `qa-artifacts/QA-071/` covers forwarding-header rejection,
  independent limits, forged-header resistance and edge rewriting. Empty and
  invalid startup configuration and the final committed artifact still need
  acceptance. The pass found missing documented 400 responses on public paths.

### [ ] QA-072 — P1 — Separate pinned API and web containers

- **Purpose:** Package the Axum API and Bun SSR as separate non-root processes
  behind one origin, without changing the pinned Bun revision.
- **Prerequisites:** Owned Podman resources; the exact trusted local Bun binary;
  verified immutable base images; an isolated database and HTTPS edge. Never
  load root `.env` into QA containers. Official registry research did not find
  an independently available archive for the required Bun revision.
- **Inputs:** Bun version `1.4.4`, revision `1.4.4-canary.1+a8fcd319b`, and
  binary SHA-256
  `14f268816e1b6a412d3715d8b9820bdb3030386ffdd35c46da1446898e0091c4`; web port
  13001 and API port 18001; private configuration from the owned runtime.
- **Steps:** 1. Inspect the completed container recipes and build-context
  exclusions. 2. Build both images with existing commands documented in
  README. 3. Verify the Bun version, revision and checksum inside the web
  image. 4. Run both images on an owned private network behind the edge. 5.
  Check root, API, auth and unknown-backend routing, readiness, assets and
  database writes where approved test identities permit them. 6. Send SIGTERM
  and inspect bounded shutdown and process exit. 7. Reject an altered Bun build
  input.
- **Expected results:** Builds use frozen or locked dependencies. Secrets,
  repository history, local state and QA evidence do not enter image layers.
  Only the edge exposes the application. The API and web bind their container
  interfaces on the required ports, run without root, preserve paths and
  cookies, and stop within documented grace periods. A mismatched Bun input
  fails the build rather than changing the runtime pin.
- **Evidence:** Save sanitized build, runtime, checksum, routing and shutdown
  reports under `qa-artifacts/QA-072/`. Record exact images and source revision.
- **Cleanup:** Stop and remove only owned containers, networks and temporary
  build inputs. Keep the isolated database until the remaining QA completes.
- **Status:** pending; separate runtime recipes and explicit context setup are
  implemented. Image builds and runtime acceptance remain. Supplied local Bun
  bytes can preserve the pin, but do not establish an independently retrievable
  official artifact.

### [ ] QA-073 — P1 — Dialog form actions stay reachable on phones

- **Purpose:** Fix the observed task editor overflow and protect every dialog
  form that shares its composition. Save and Cancel must remain reachable.
- **Prerequisites:** Shared isolated HTTPS setup and an owned guest workspace.
  Use actual target-scoped 390 by 844 and 320 by 568 CSS viewports. Confirm the
  dimensions with CDP layout metrics, not only the client viewport property.
- **Inputs:** New task `QA check citations`; estimate `1`; multiline notes;
  existing QA project and history. Include new and existing task, project,
  template, history, and CSV dialogs, plus an expanded template task list.
- **Steps:** 1. Open Add task at 390 by 844. Inspect the popup, content viewport
  and Save task bounds. 2. Submit an empty task and inspect the first invalid
  field focus. 3. Enter the task name and save with an ordinary pointer
  click. 4. Repeat at 320 by 568, including keyboard Tab and Enter. 5. Open each
  other affected dialog; scroll long fields and reach both footer actions. Save
  or cancel isolated changes. 6. Check desktop layout and the original owner,
  stale-baseline and opening-completion cases.
- **Expected results:** No footer action lies beyond an unscrollable viewport.
  Exactly one content region scrolls when needed. Header, accessible labels,
  native submit, visible focus, and all inputs remain intact. Save closes only
  its original opening after a successful guarded write. Invalid submission
  creates no record and focuses its first invalid field. Cancel makes no write.
- **Evidence:** Save before/after images, actual viewport and control bounds,
  snapshots, logs and persisted QA record checks in `qa-artifacts/QA-073/`.
- **Cleanup:** Remove only isolated QA records after evidence inspection. Keep
  user storage unchanged; close only owned QA tabs.
- **Status:** failed on the earlier production artifact: Save task begins at
  y=861 in an 844-pixel viewport, and an ordinary click times out. The popup
  content overflows its height. Repair and final-artifact checks are pending.

### [ ] QA-074 — P1 — Locked dependencies receive a public advisory check

- **Purpose:** Check the locked registry dependencies before release without
  changing tool versions, rules, lockfiles or the global installation.
- **Prerequisites:** Pinned Bun and Rust; access to public package advisory
  services. Use only public registry package names and versions. Do not send
  workspace source, configuration or credentials to an advisory service.
- **Inputs:** Current `bun.lock` and registry packages from `Cargo.lock`.
  Exclude private workspace packages from external query payloads.
- **Steps:** 1. Run the available native Bun advisory command with root dotenv
  loading disabled. 2. Query current public Rust advisories for the exact locked
  registry packages with existing tools. 3. Inspect each finding, its fixed
  versions and the actual affected runtime path. 4. Record unavailable advisory
  services and any remaining release decision; do not hide findings.
- **Expected results:** The evidence names the checked lockfile revisions and
  every reported advisory. No dependency or policy changes occur as a side
  effect. Known exploitable release findings require a source or dependency fix
  and a fresh complete static/build/affected-workflow pass before release.
- **Evidence:** Save sanitized audit output, registry query metadata, lockfile
  hashes and the finding review in `qa-artifacts/QA-074/`.
- **Cleanup:** Remove only owned temporary public advisory payloads. No local
  app data or service changes are needed.
- **Status:** pending.

### [ ] QA-075 — P2 — Compact mobile typography

- **Purpose:** Reduce oversized mobile headings, timer digits, and summary
  values. Keep desktop sizes, body text, inputs, and control targets unchanged.
- **Affected files:** `apps/web/src/components/ui/heading.tsx`,
  `apps/web/src/components/ui/stat.tsx`,
  `apps/web/src/components/ui/button.tsx`, and
  `apps/web/src/features/timer/components/focus-timer.tsx`.
- **Prerequisites:** The owned HTTPS QA origin and current production build. Use
  the owned project browser group and its existing paused guest fixture. Do not
  change saved records or use the supplied database.
- **Inputs:** Viewports 320×568, 390×844, 640×900, and 1440×900. Use all six
  workspace pages, a long heading, Japanese text, and the existing paused timer.
- **Steps:** 1. Confirm each target viewport with CDP layout metrics. 2. Inspect
  heading, countdown, and statistic font sizes and capture the timer and
  reports. 3. Inspect projects, templates, and settings for clipped or crowded
  titles. 4. Inspect one open form. Compare body text, input size, labels, and
  targets. 5. Repeat at 200% text zoom and a 320 CSS-pixel reflow width. 6.
  Compare the desktop view and verify that timer storage bytes did not change.
- **Expected results:** At widths up to 640 CSS pixels, h1 is 28px, h2 is 20px,
  h3 is 18px, and h4 is 16px at the default root font size. Summary values are
  24px, or 18px for compact values. The countdown is no larger than 52px and can
  shrink with viewport width. Large action-button text is 16px instead of 18px
  on phones. Its 44px height and focus ring remain. Desktop h1 remains 36px, h2
  24px, and summary values 30px or compact 20px. Body text, inputs, semantic
  headings, focus indicators, and target sizes remain unchanged. No title or
  number clips or creates horizontal page overflow. Text zoom remains usable.
  The timer does not reset or write history.
- **Evidence:** Save computed style output, actual viewport metrics, inspected
  screenshots, and storage comparisons under `qa-artifacts/QA-075/`. Record the
  tested source revision and any unrun combinations.
- **Cleanup:** Close only case-created forms. Restore target-scoped metrics and
  zoom. Leave fixture records and browser permissions unchanged.
- **Status:** pending. On revision `4d4d6eebfd495302876c396daa7a5c1f587ad988`,
  the production build and all installed static gates passed. Owned HTTPS
  browser checks found 28px h1 headings on all six pages at 390px, 20px section
  headings, 24px report values, 18px compact values, and a 52px countdown. At
  320px the countdown was 51.2px. The timer page at 320px and all six pages at
  390px had no horizontal page overflow. Large buttons kept 44px height with
  16px text. A 1440px desktop viewport (1425px content after its scrollbar) kept
  the original 36px h1, 112px countdown, 30px report values, and 20px compact
  values. Timer storage bytes were unchanged and browser logs were empty.
  Inspected before/after phone captures are in `qa-artifacts/QA-075/`; the after
  capture also retains its raw native surface. The full 640px, text-zoom,
  long-title, and form matrix remains unrun. An initial report-heading locator
  and a compact-route navigation snapshot failed; corrected settled checks
  passed.

### [ ] QA-076 — P1 — Persistent completion notification

- **Purpose:** Deliver a completion through the active service worker on a
  browser that does not permit the desktop Notification constructor.
- **Affected files:** focus notifications and store, settings permission
  control, and `apps/web/src/service-worker/sw.ts`.
- **Prerequisites:** Shared owned HTTPS setup; the candidate worker is active.
  Record and temporarily grant notification permission only in the owned
  profile. Save the guest fixture and notification settings before changes.
- **Inputs:** The existing paused one-minute QA break; notifications enabled.
  Expected title `Timer complete` and body `Break time is complete.`
- **Steps:** 1. Save notification settings through Settings. 2. Resume the
  paused break through Timer. 3. Let its real deadline expire once. 4. Inspect
  the active registration's notifications and the visible timer. 5. Reload and
  confirm the same break did not create another completion notification.
- **Expected results:** One persistent notification has the expected generic
  title and body. Break completion does not add focus history or task counts.
  Delivery does not call the unsupported constructor or produce an unhandled
  rejection. Permission is never requested automatically.
- **Evidence:** Save sanitized registration notification details, timer/history
  comparisons, logs, worker state, and source revision under
  `qa-artifacts/QA-076/`. Actual mobile-device delivery remains distinct from a
  desktop browser using the persistent-notification path.
- **Cleanup:** Close only case notifications. Restore original permission and
  notification settings. Keep the saved fixture and evidence.
- **Status:** pending. No runtime delivery is claimed by source review.

### [ ] QA-077 — P0 — Deferred notification keeps its workspace owner

- **Purpose:** Do not deliver an old workspace reminder or completion after an
  account or owner-generation change while service-worker lookup is pending.
- **Prerequisites:** Shared setup; two approved isolated identities and
  authenticated workflows from QA-034/035. Notification permission is granted.
  If live identities are unavailable, record the block; do not bypass auth.
- **Inputs:** A one-minute timer owned by identity A; identity B; an A→B→A
  generation change; a delayed service-worker registration lookup.
- **Steps:** 1. Delay registration lookup with target-local browser tooling. 2.
  Reach a real A-owned reminder or completion. 3. Change the verified workspace
  before lookup resolves. 4. Release the lookup. 5. Inspect notifications and
  both stored workspaces. Repeat for the generation change.
- **Expected results:** The old callback dispatches neither persistent nor
  desktop notifications. It does not write to B or mark B's timer complete. A
  fresh operation from the current owner still works. Revoking permission while
  lookup is pending also prevents dispatch.
- **Evidence:** Save owner-generation observations, redacted notification
  details, storage comparisons, and logs under `qa-artifacts/QA-077/`.
- **Cleanup:** Remove only target-local interception, close case notifications,
  and restore original permission. Preserve all other browser state.
- **Status:** pending; approved live identity prerequisites remain external.

### [ ] QA-078 — P1 — Notification opens the timer without losing a form

- **Purpose:** Return to a current timer when a persistent notification is
  activated. Do not navigate an unrelated editor away from its unsaved values.
- **Prerequisites:** QA-076 produced a real persistent notification. The
  candidate worker is active and the owned timer tab remains open.
- **Inputs:** Existing Timer or `/focus` tab, another Settings tab with an
  unsaved reminder value `3`, and the real completion notification.
- **Steps:** 1. Open the independent settings draft without saving. 2. Activate
  the real OS/browser notification. 3. Inspect the focused client, URL,
  notification list, and the untouched settings draft.
- **Expected results:** The notification closes. An existing timer client gains
  focus without navigation or another timer tab. The other form keeps its
  unsaved value and no workspace write occurs. If no timer client exists, one
  same-origin root timer opens; the settings draft remains open.
- **Evidence:** Save native activation evidence, client URLs and focus, logs,
  and before/after draft and workspace observations under
  `qa-artifacts/QA-078/`. Synthetic untrusted events do not establish native
  notification activation.
- **Cleanup:** Close only the case-created extra tab and notification. Discard
  the unsaved settings draft without saving. Restore permission.
- **Status:** pending; native notification activation needs a capable platform.

### [ ] QA-079 — P1 — Desktop notification fallback and delivery errors

- **Purpose:** Keep desktop delivery when no active worker is available, and
  contain platform failures without corrupting timer completion.
- **Prerequisites:** Shared isolated profile; saved fixture; temporary granted
  notification permission; target-local platform interception only.
- **Inputs:** No active registration, a rejected registration lookup, a rejected
  persistent show call, denied/default permission, and unsupported Notification.
- **Steps:** 1. Complete an owned QA interval with no active registration and
  inspect the desktop notification. 2. Repeat with a lookup rejection. 3. With
  an active worker, reject its show call and inspect the resulting warning and
  stored completion. 4. Repeat the permission guard variations.
- **Expected results:** Missing or inaccessible registration uses the desktop
  path where supported. A selected worker's show rejection does not trigger a
  second path or unhandled rejection. Completion remains durable once. No
  notification dispatch or automatic permission prompt occurs without granted
  permission. The explicit settings button can request permission again.
- **Evidence:** Save intercepted call counts, real notification observations,
  expected generic warnings, and timer/history data under
  `qa-artifacts/QA-079/`. Separate intercepted failure evidence from native
  platform acceptance.
- **Cleanup:** Remove all case interception, close notifications, restore
  permission and saved settings, and preserve unrelated data.
- **Status:** pending. No new test library or test runner is required.

### [ ] QA-080 — P1 — Guest import states its timer and settings scope

- **Purpose:** Explain the existing import policy before consent. Do not imply
  that an active guest timer or preferences replace a nondefault account.
- **Affected files:**
  `apps/web/src/features/account/components/account-controls.tsx`; existing
  `crates/db/src/workspaces.rs` import rules remain unchanged.
- **Prerequisites:** Shared owned setup and an approved authenticated identity.
  Preserve the isolated guest and account fixtures. If live issuer access is
  unavailable, record the block rather than creating a fake session.
- **Inputs:** Guest project `Guest import scope`, task `Guest active run`, focus
  duration 5 minutes and a started run. A nondefault account has task
  `Account active run`, focus duration 10 minutes and a separate running timer.
- **Steps:** 1. Prepare those isolated workspaces through the UI. 2. Open
  Account → Import guest work. 3. Inspect the policy text before confirming. 4.
  Confirm within the account timer's duration. 5. Compare the imported records,
  account settings and timer identifiers, and untouched guest source.
- **Expected results:** The dialog identifies projects, tasks, templates and
  focus history as the merged records. It states that account settings and timer
  stay unchanged unless the workspace matches the empty default. The guest
  source remains on this device. Imported records exist, while the nondefault
  account's settings, run ID, start time and deadline stay intact. Natural
  remaining time may decrease; the import does not reset that timer.
- **Evidence:** Save the disclosure, sanitized before/after workspace data,
  request result and logs under `qa-artifacts/QA-080/`. Record the source
  revision.
- **Cleanup:** Remove only case records after saving evidence, restore case
  settings, and stop only its timers. Do not erase either primary workspace.
- **Status:** pending; authenticated runtime prerequisites remain external.

### [ ] QA-081 — P1 — Failed notification delivery is visible

- **Purpose:** Distinguish granted permission from a notification that could not
  be shown. Keep stale platform responses out of a newer workspace.
- **Prerequisites:** Shared owned HTTPS setup and candidate worker; saved guest
  fixture; temporary granted permission in the owned profile.
- **Inputs:** One real QA completion, target-local rejection of its native show
  call, and a later successful completion.
- **Steps:** 1. Reject only the candidate tab's persistent show call and reach
  the real deadline. 2. Inspect Timer and Focus for an accessible failure
  status. 3. Restore the native method and complete a later QA interval. 4.
  Resolve an older delayed rejection after that success. 5. Repeat the late
  result across the approved workspace change from QA-077 when available.
- **Expected results:** The durable completion survives. Permission is not
  falsely described as unsupported. A polite visible status reports the failed
  delivery without private data. A newer success clears it; an older response
  cannot replace newer feedback or show an A-owned error in B. Notifications
  disabled in settings do not produce a warning about wanted delivery.
- **Evidence:** Save observed status text, native call order, completion data,
  permission state and logs under `qa-artifacts/QA-081/`.
- **Cleanup:** Remove target-local interception, close case notifications,
  restore permission and settings, and preserve other storage.
- **Status:** pending; real mobile delivery and owner switches need their stated
  platform and identity prerequisites.

### [ ] QA-082 — P1 — Recovered timer offers sound activation

- **Purpose:** Restore sound through an explicit gesture after a page reload,
  without pausing, resetting, or replacing the recovered run.
- **Prerequisites:** Shared owned profile; saved guest fixture; supported Web
  Audio API; a real running QA timer with an enabled bell alarm. Background
  sound may also be enabled for a focus phase. No other tab handles completion.
- **Inputs:** One-minute focus, bell volume 50, repetition 1, background sound
  volume 50; an existing run with enough time left after reload.
- **Steps:** 1. Start through the actual control and save run identifiers. 2.
  Reload before the deadline without another Start gesture. 3. Inspect the sound
  readiness message. 4. Activate `Enable sound` by keyboard. 5. Inspect the
  native context state, focused control, timer data and completion.
- **Expected results:** A recovered countdown does not claim ready sound before
  the context is running. The explicit control resumes or creates audio inside
  that gesture, keeps focus, and announces readiness. Current focus sound can
  resume, the run identifiers and deadline stay unchanged, and exactly one
  durable completion remains. Device audibility is not inferred only from a
  running context; record native scheduling and actual audible output
  separately.
- **Evidence:** Save context-state transitions, run data, keyboard focus,
  scheduled-node observations, logs and any inspected audio capture under
  `qa-artifacts/QA-082/`. State when physical output cannot be confirmed.
- **Cleanup:** Restore original settings and remove only target-local native API
  observation. Keep the fixture backup; stop only case timers.
- **Status:** pending; no automatic autoplay or sleeping-page guarantee.

### [ ] QA-083 — P1 — A missed alarm does not replay later

- **Purpose:** Do not queue a completion alarm in a suspended audio context for
  playback after a later unrelated click.
- **Prerequisites:** QA-082 setup; target-local observation captures the real
  context without changing native methods. The context can be suspended.
- **Inputs:** Enabled one-minute alarm, a suspended context, then a later
  explicit activation while the timer is idle or a new run is active.
- **Steps:** 1. Suspend the captured native context before a real deadline. 2.
  Let completion persist. 3. Inspect missed-alarm status and scheduling. 4.
  Enable sound through the real control. 5. Observe the resumed graph and next
  run without replaying the completed run's alarm.
- **Expected results:** Completion persists once. No alarm nodes are newly
  scheduled while the context is not running, and pending repeats are stopped on
  suspension. The missed alarm is reported. Later activation clears the relevant
  missed notice only after success and never replays an old alarm.
- **Evidence:** Save native state/node scheduling and the durable session ID
  under `qa-artifacts/QA-083/`; include inspected audio capture if available.
- **Cleanup:** Resume or close only the case context through supported controls,
  restore settings, and remove native observation. Do not clear guest storage.
- **Status:** pending.

### [ ] QA-084 — P0 — Old sound callbacks cannot affect a new owner

- **Purpose:** Keep audio activation, resume results and cleanup bound to the
  workspace and context that initiated them.
- **Prerequisites:** QA-034/035 approved identities, shared setup, and a target-
  local delayed resume result. If identities are unavailable, record the block.
- **Inputs:** A's running timer and retained Enable sound handler; B's distinct
  settings; A→B→A generations; old resume success and rejection.
- **Steps:** 1. Retain A's control callback and delay its resume result. 2.
  Switch verified ownership. 3. Invoke the old callback and resolve or reject
  its old promise. 4. Inspect B's context, sound status and stored workspace. 5.
  Repeat the generation change and perform one fresh current-owner action.
- **Expected results:** Old callbacks construct, resume, synchronize and play
  nothing for B. Old events or promises cannot reset B's status or apply A's
  settings. Closing A invalidates its listener before cleanup. New B activation
  still works. An obsolete timer baseline in the same owner also cannot unlock
  sound as a side effect of a stale Start request.
- **Evidence:** Save owner/context lifecycle, native call counts, current
  status, storage comparisons and logs under `qa-artifacts/QA-084/`.
- **Cleanup:** Remove interception and restore only case resources and settings.
- **Status:** pending; live identity verification is an external prerequisite.

### [ ] QA-085 — P1 — Audio failure does not block a timer

- **Purpose:** Treat optional browser audio failure as feedback, not a failed
  timer write. Keep disabled sound distinct from blocked output.
- **Prerequisites:** Shared isolated profile and saved fixture; target-local
  interception can simulate missing API, constructor failure, resume failure,
  and node-creation failure without changing production code.
- **Inputs:** Start/Resume with bell volume 50; each failure separately; alarm
  `none` and focus sound `none` as the disabled-output variation.
- **Steps:** 1. Apply one platform failure and use the actual Start control. 2.
  Inspect deadline, run ID and visible sound status. 3. Restore the platform and
  retry sound by its explicit control. 4. Repeat the remaining failures, then
  use both disabled sound preferences.
- **Expected results:** Valid timer actions persist and advance despite audio
  failure. Unsupported API is identified without a misleading retry. Recoverable
  failure is visible; cleanup continues across a failed node stop. Resume
  rejection does not become an unhandled promise. Disabled sound has no failed-
  playback warning or forced permission gesture. Stored records stay intact.
- **Evidence:** Save timer/context data, visible statuses, expected generic
  warnings, focus and native call order under `qa-artifacts/QA-085/`.
- **Cleanup:** Restore every intercepted descriptor and original preference.
  Stop only case timers and keep other storage unchanged.
- **Status:** pending; intercepted failures are not proof of native-device
  audibility or multi-tab alarm routing.

## Reload-safe account request journal

Planned affected files: `apps/web/src/features/account/sync-journal.ts`,
`sync.ts`, `sync-contract.ts`, `components/account-controls.tsx`, and the
focus-store persisted-workspace guard if required. Existing transport/schema,
account ownership, guest import and CAS behavior must stay intact. These cases
extend QA-053–059, not replace their prior evidence.

### Shared journal setup

Use the owned HTTPS QA resources from shared setup and the completed candidate.
Use only separately approved isolated identities A and B. Check the real
`GET /api/session` response to discover each user ID. If issuer registration or
identity access is missing, record that blocker; do not fabricate sessions,
weaken token validation, use production workspaces or connect root `.env` data.

Before execution, inspect the final journal module for its actual database,
store, schema and lock names; they are not executable contracts yet. Back up
both isolated account workspaces and the guest source. Record the tested commit,
browser, supported IndexedDB/Web Locks capabilities and initial revisions. Use
Playwriter against real UI requests. Delays must retain the actual request and
forward it at most once. A lost response must not mean a second request. Save
only synthetic record summaries, hashes and safe IDs, never cookies, tokens,
issuer codes, private profiles or raw credential headers. Keep artifacts under
each case's ignored directory. Restore injected APIs/routes in `finally`.

Coverage: QA-054 covers durable save acknowledgment; QA-055 covers immutable
import facts and the persistent changed-local barrier; QA-053 adds journal
awaits to its A/B epoch checks. QA-086–097 cover preparation, serialization,
fences, crash boundaries, visibility and codec failure. No new runner, fixture
library or backend endpoint is authorized or needed for this feature.

### [ ] QA-086 — P0 — Journal preparation failure blocks dispatch

- **Purpose:** A failed durable preparation must not become a network mutation.
- **Prerequisites:** Shared journal setup. One verified account; abort only the
  new journal readwrite transaction before completion.
- **Inputs:** Task `Journal aborted save`; record the original primary bytes,
  stamp and revision.
- **Steps:** 1. Edit the task through the UI. 2. Abort journal preparation
  before commit. 3. Inspect requests and visible recovery feedback. 4. Restore
  IndexedDB and retry.
- **Expected results:** No PUT or import POST is dispatched for the failed
  preparation. Primary work and the prior journal/stamp remain intact; retry is
  allowed only after a completed preparation.
- **Evidence:** Save sanitized operation order, revisions/tokens, primary
  hashes, UI feedback and the asserted result in
  `qa-artifacts/QA-086/journal-abort.txt`.
- **Cleanup:** Restore the injected abort and the isolated task backup.
- **Status:** pending; the candidate and live-identity prerequisites must be
  established before execution. No result is claimed from this plan.

### [ ] QA-087 — P0 — Committed preparation survives a pre-send reload

- **Purpose:** A committed journal is a barrier even if the browser closes
  before dispatch.
- **Prerequisites:** Shared journal setup. One verified account; pause the new
  action after journal commit but before its synchronous final guard.
- **Inputs:** Task `Prepared but not sent`; record the prepared operation token
  and server revision E.
- **Steps:** 1. Commit preparation and confirm that no mutation was sent. 2.
  Reload. 3. Verify the same account. 4. Inspect recovery before confirming a
  resolution.
- **Expected results:** The original record survives. The client does not infer
  that the request was rejected or send an unrelated ordinary save. Primary data
  stays intact until explicit safe recovery.
- **Evidence:** Save sanitized operation order, revisions/tokens, primary
  hashes, UI feedback and the asserted result in
  `qa-artifacts/QA-087/prepared-reload.txt`.
- **Cleanup:** Remove the pause control and resolve only the isolated operation.
- **Status:** pending; the candidate and live-identity prerequisites must be
  established before execution. No result is claimed from this plan.

### [ ] QA-088 — P0 — Corrupt journal remains preserved

- **Purpose:** Invalid stored facts must not be treated as no pending request.
- **Prerequisites:** Shared journal setup. One verified account with an isolated
  pending record; back up its exact value first.
- **Inputs:** Add an unknown field to that record without changing primary
  workspace bytes.
- **Steps:** 1. Write the isolated malformed value using the inspected store
  contract. 2. Reload and verify the same account. 3. Attempt Sync now. 4.
  Compare raw record and primary hashes.
- **Expected results:** An actionable blocked error appears. No save/import
  dispatch occurs, and neither the corrupt record nor primary data is deleted or
  replaced.
- **Evidence:** Save sanitized operation order, revisions/tokens, primary
  hashes, UI feedback and the asserted result in
  `qa-artifacts/QA-088/corrupt-journal.txt`.
- **Cleanup:** Restore the exact saved journal value and isolated workspace.
- **Status:** pending; the candidate and live-identity prerequisites must be
  established before execution. No result is claimed from this plan.

### [ ] QA-089 — P0 — Unknown journal version fails closed

- **Purpose:** An incompatible client must preserve request facts rather than
  migrate silently.
- **Prerequisites:** Shared journal setup. One verified account and backed-up
  pending record.
- **Inputs:** Set only its format version to 999 using the actual schema field.
- **Steps:** 1. Reload the candidate with the unsupported record. 2. Verify the
  account and attempt sync/recovery. 3. Inspect network and stored bytes.
- **Expected results:** The record remains unchanged, no mutation is dispatched,
  and the error explains that recovery data cannot be used. No fallback to an
  empty record occurs.
- **Evidence:** Save sanitized operation order, revisions/tokens, primary
  hashes, UI feedback and the asserted result in
  `qa-artifacts/QA-089/unknown-version.txt`.
- **Cleanup:** Restore the exact original record.
- **Status:** pending; the candidate and live-identity prerequisites must be
  established before execution. No result is claimed from this plan.

### [ ] QA-090 — P0 — Two account tabs serialize request recovery

- **Purpose:** A second cooperating tab must not replace or bypass an active
  operation record.
- **Prerequisites:** Shared journal setup. Two current-version tabs verified as
  the same isolated account; inspect the implemented lock wait/cancel policy.
- **Inputs:** Tasks `Journal tab A` and `Journal tab B`; retain the first
  request and token.
- **Steps:** 1. Hold A after preparation while its real request is active. 2.
  Request sync/import in B. 3. Inspect the record and dispatch order. 4.
  Exercise the supported wait cancellation or busy retry, then release A.
- **Expected results:** B sends no competing mutation and cannot replace A’s
  token while A owns the operation lock. Cancellation/busy feedback is
  accessible. Later recovery uses stored facts, never a stolen lock or an
  assumed rejection.
- **Evidence:** Save sanitized operation order, revisions/tokens, primary
  hashes, UI feedback and the asserted result in
  `qa-artifacts/QA-090/two-tab-lock.txt`.
- **Cleanup:** Release held requests, remove listeners and close only the extra
  QA tab.
- **Status:** pending; the candidate and live-identity prerequisites must be
  established before execution. No result is claimed from this plan.

### [ ] QA-091 — P0 — Delayed storage events cannot upload a stale cache

- **Purpose:** The final guard must use current persisted work, not only a tab’s
  older React snapshot.
- **Prerequisites:** Shared journal setup. Two verified same-account tabs;
  suppress only B’s delivery of storage notifications, not actual localStorage
  writes.
- **Inputs:** Local task notes `older tab` and `newer persisted`; capture both
  exact workspace hashes.
- **Steps:** 1. Keep B’s view stale while A commits the newer local state and
  account acknowledgment. 2. Trigger B sync. 3. Inspect its persisted read,
  journal and final request. 4. Resume events.
- **Expected results:** B refreshes or rejects its stale baseline before
  dispatch. It never prepares/sends the older snapshot against the newer stamp
  as if it were a fresh edit. Newer primary and remote work survives.
- **Evidence:** Save sanitized operation order, revisions/tokens, primary
  hashes, UI feedback and the asserted result in
  `qa-artifacts/QA-091/stale-storage-event.txt`.
- **Cleanup:** Restore storage-event delivery and isolated notes.
- **Status:** pending; the candidate and live-identity prerequisites must be
  established before execution. No result is claimed from this plan.

### [ ] QA-092 — P0 — Server choice fences a delayed original save

- **Purpose:** A GET of the old revision must not allow a late save to overwrite
  a chosen server version.
- **Prerequisites:** Shared journal setup. One verified account and approved
  interception that delays the original request before server dispatch.
- **Inputs:** Original save at E and an explicit Use account work choice of the
  displayed remote workspace at E.
- **Steps:** 1. Retain the original PUT. 2. Read the old remote version and
  confirm the server choice. 3. Let its real same-content CAS PUT commit. 4.
  Release the original PUT. 5. Reload.
- **Expected results:** The fence advances E. The original save cannot commit
  afterward. Retirement requires a strictly newer matching result; final
  local/server work matches the confirmed choice, with newer local edits
  protected.
- **Evidence:** Save sanitized operation order, revisions/tokens, primary
  hashes, UI feedback and the asserted result in
  `qa-artifacts/QA-092/late-save-fence.txt`.
- **Cleanup:** Remove interception and restore isolated account data.
- **Status:** pending; the candidate and live-identity prerequisites must be
  established before execution. No result is claimed from this plan.

### [ ] QA-093 — P0 — Server choice fences a delayed original import

- **Purpose:** An unfinished import must not arrive after the user resolves it
  to account work.
- **Prerequisites:** Shared journal setup. One verified account, guest backup
  and delayed original import request.
- **Inputs:** Original import I at E; choose the displayed account workspace at
  E.
- **Steps:** 1. Retain the original import POST before dispatch. 2. Confirm Use
  account work. 3. Let its real CAS fence commit. 4. Release I. 5. Reload and
  inspect guest/account data.
- **Expected results:** The old import cannot mutate the newer revision. Its
  original facts are retained until safe resolution. A fence does not falsely
  mark its guest digest imported; guest source is unchanged.
- **Evidence:** Save sanitized operation order, revisions/tokens, primary
  hashes, UI feedback and the asserted result in
  `qa-artifacts/QA-093/late-import-fence.txt`.
- **Cleanup:** Release interception and restore both isolated backups.
- **Status:** pending; the candidate and live-identity prerequisites must be
  established before execution. No result is claimed from this plan.

### [ ] QA-094 — P0 — Uncertain replacement fences retain original facts

- **Purpose:** Replacing a resolution slot must not erase an older operation or
  falsely prove a chosen winner.
- **Prerequisites:** Shared journal setup. One verified account; use real held
  CAS requests and the final phase/token contract.
- **Inputs:** Two explicit resolutions A and B captured at the same expected
  revision with different chosen contents.
- **Steps:** 1. Make A uncertain. 2. Explicitly prepare B at that same
  revision. 3. Allow A to win and lose B’s response. 4. Reload and inspect
  recovery. 5. Confirm a fresh choice at the newly observed revision.
- **Expected results:** Original facts survive every transition. Mismatched or
  ambiguous results remain a barrier. No import acceptance is inferred from a
  fence; only the safely confirmed fresh result retires the exact current token.
- **Evidence:** Save sanitized operation order, revisions/tokens, primary
  hashes, UI feedback and the asserted result in
  `qa-artifacts/QA-094/replacement-fence.txt`.
- **Cleanup:** Release all held requests, remove interception and restore the
  isolated workspace.
- **Status:** pending; the candidate and live-identity prerequisites must be
  established before execution. No result is claimed from this plan.

### [ ] QA-095 — P0 — Interrupted local replacement preserves later edits

- **Purpose:** A crash between local replacement and journal retirement must not
  repeat an unsafe replacement.
- **Prerequisites:** Shared journal setup. One verified account; pause a
  successful server-choice finalization after local replacement and before
  journal retirement.
- **Inputs:** Chosen account task `Chosen server`; add later local task
  `After replacement` before reloading.
- **Steps:** 1. Apply the confirmed local replacement. 2. Keep its journal and
  make the later edit. 3. Reload and verify the account. 4. Inspect recovery
  before another explicit choice.
- **Expected results:** The later task remains. Recovery either proves safe
  continuation or keeps an explicit conflict; it never replaces later work
  merely because the earlier target was acknowledged. No ordinary save bypasses
  the record.
- **Evidence:** Save sanitized operation order, revisions/tokens, primary
  hashes, UI feedback and the asserted result in
  `qa-artifacts/QA-095/replacement-crash.txt`.
- **Cleanup:** Restore pause controls and isolated data.
- **Status:** pending; the candidate and live-identity prerequisites must be
  established before execution. No result is claimed from this plan.

### [ ] QA-096 — P1 — Pending import stays discoverable after metadata writes

- **Purpose:** A confirmed-guest digest must not hide an unresolved import
  barrier.
- **Prerequisites:** Shared journal setup. One verified account; retain an
  import record after receipt proof while its local baseline differs.
- **Inputs:** Original guest snapshot and counts; record its confirmed digest,
  then change the current guest source.
- **Steps:** 1. Retain the persistent changed-local conflict and reload. 2. Open
  Account and its pending-import action. 3. Inspect original counts and
  wording. 4. Cancel with Escape. 5. Reopen, change the baseline elsewhere and
  confirm the stale plan.
- **Expected results:** Recovery is visible independently of guest availability.
  It describes/retries the original snapshot, keeps its original replacement
  baseline, restores focus on cancel and rejects stale token/owner/local consent
  without losing data.
- **Evidence:** Save sanitized operation order, revisions/tokens, primary
  hashes, UI feedback and the asserted result in
  `qa-artifacts/QA-096/recovery-dialog.txt`.
- **Cleanup:** Remove delays and restore guest/account backups; close only
  created tabs.
- **Status:** pending; the candidate and live-identity prerequisites must be
  established before execution. No result is claimed from this plan.

### [ ] QA-097 — P0 — Versioned request bytes cannot change silently

- **Purpose:** Schema defaults or altered serialization must not rewrite an
  original retry payload.
- **Prerequisites:** Shared journal setup. One verified account and an exact
  pending-import backup; inspect the current version-1 codec.
- **Inputs:** Remove `focus_color` from the stored guest JSON and set its
  raw-string SHA-256 to that modified string, leaving the rest of the record and
  primary data untouched.
- **Steps:** 1. Install only this isolated incompatible record. 2. Reload and
  verify the account. 3. Open recovery and attempt retry. 4. Compare stored
  bytes and network.
- **Expected results:** Even if the current workspace parser supplies the
  missing default, recovery blocks because the original canonical bytes cannot
  be reproduced. No request is sent and raw facts/primary work remain preserved.
- **Evidence:** Save sanitized operation order, revisions/tokens, primary
  hashes, UI feedback and the asserted result in
  `qa-artifacts/QA-097/codec-mismatch.txt`.
- **Cleanup:** Restore the exact original journal value and remove inspection
  controls.
- **Status:** pending; the candidate and live-identity prerequisites must be
  established before execution. No result is claimed from this plan.

### [ ] QA-098 — P1 — Disabled alerts cancel a deferred delivery

- **Purpose:** Do not revive an old notification when alerts are disabled and
  re-enabled before a pending worker lookup completes. Clear stale feedback.
- **Prerequisites:** Owned guest QA origin, active final-candidate worker,
  granted notification permission and a saved guest backup. Live identities are
  not required. Use target-local interception only and record revision.
- **Inputs:** One-minute focus, notifications enabled, and a deferred real
  completion lookup from `getRegistration("/")`.
- **Steps:** 1. Start the real one-minute focus and hold only its registration
  lookup at completion. 2. Save notifications off in Settings, then save them on
  again without changing workspace identity. 3. Release the old lookup and
  inspect native delivery calls and feedback. 4. Reach a new real completion
  with ordinary lookup restored.
- **Expected results:** The old attempt makes no worker or desktop delivery call
  and cannot publish a late failure. The fresh completion can attempt delivery.
  Only intended settings and real timer transitions affect storage.
- **Evidence:** Save controlled call counts, notification/status observations,
  expected storage changes and logs in `qa-artifacts/QA-098/`.
- **Cleanup:** Restore native lookup, original permission and guest settings;
  dismiss only case-created notifications. Preserve unrelated browser state.
- **Status:** pending; no execution or native delivery result is claimed.

### [ ] QA-099 — P0 — Sign out when account storage is blocked

- **Purpose:** Keep session sign-out available when unsafe account writes are
  blocked by primary-cache or journal failure.
- **Prerequisites:** Journal setup; verified isolated account A, exact primary
  and journal backups, and working session endpoint. Do not forge a session.
- **Inputs:** An A-owned invalid primary value `{` and a target-local blocked
  IndexedDB open. Keep A's owner and verified server identity unchanged.
- **Steps:** 1. Trigger the actual storage error using the second isolated
  same-origin tab. 2. Block journal open. 3. Open Account and choose Sign
  out. 4. Inspect its real POST `/auth/logout`, next session response and UI
  state.
- **Expected results:** Captured user/epoch/owner checks still apply, but logout
  does not require valid workspace bytes, IndexedDB or a journal lock. A real
  204 clears the session and hides A. Corrupt primary bytes and pending request
  facts remain preserved; no workspace save/import occurs and B is untouched.
- **Evidence:** Save safe statuses, request user IDs, owner changes and storage
  hashes in `qa-artifacts/QA-099/`; omit cookie values.
- **Cleanup:** Restore native APIs and exact isolated primary/journal backups;
  sign in again only through the permitted issuer workflow if needed.
- **Status:** pending; verified live identity remains a prerequisite.

### [ ] QA-100 — P0 — Confirmed logout ignores later cache errors

- **Purpose:** Do not leave A visible as signed in after successful server
  logout merely because its workspace becomes unreadable during the request.
- **Prerequisites:** Journal setup; verified isolated A and its second tab;
  approved response-delay tooling and exact primary/journal backups.
- **Inputs:** A real POST logout and an A-owned primary value `{` written by the
  second tab while the committed 204 response is held.
- **Steps:** 1. Start Sign out and hold only its actual successful response. 2.
  Corrupt A's isolated primary from the second tab and observe the storage error
  in the first tab. 3. Release the 204. 4. Inspect the resulting identity and
  next real session response.
- **Expected results:** With the same verified A/epoch/owner still current,
  successful logout hides A and shows guest state despite the new cache error.
  No private A workspace is rendered as an active account. Raw primary and
  journal facts remain recoverable. A changed identity would instead prevent the
  older completion from hiding B.
- **Evidence:** Save response order/status, visible identity, owner changes and
  preserved raw hashes in `qa-artifacts/QA-100/`; omit cookie values.
- **Cleanup:** Release interception and restore exact isolated backups. Close
  only the extra case tab and keep unrelated browser state intact.
- **Status:** pending; no authenticated runtime result is claimed.

### [ ] QA-101 — P1 — Unready workspace cancels sound work

- **Purpose:** Stop optional output and invalidate pending resume results when
  the current workspace becomes unreadable, without failing timer persistence.
- **Prerequisites:** Owned guest profile with backup, native audio support,
  one-minute settings and a second same-origin QA tab. Capture only case-native
  context/node calls. Do not change unrelated page audio or other profiles.
- **Inputs:** A pending native resume result and the active guest primary value
  `{` written by the second tab; a later explicit valid backup restore.
- **Steps:** 1. Start a real timer and retain its resume result. 2. Trigger the
  primary error from the second tab. 3. Inspect node cleanup and sound
  feedback. 4. Release the old resume result. 5. Restore the backed-up workspace
  through the existing confirmed recovery UI and enable sound with a fresh
  gesture.
- **Expected results:** The unready transition stops background/repeat nodes and
  invalidates the old context lifecycle. The old callback does not mark sound
  ready or synchronize old settings afterward. The sound control explains
  unavailable workspace data and cannot activate while unready. A fresh valid
  gesture works after restore; no past alarm replays and no output failure
  overwrites or deletes primary/recovery data.
- **Evidence:** Save context generations, native call order, visible status,
  primary hashes and inspected results in `qa-artifacts/QA-101/`.
- **Cleanup:** Restore native observations, the guest backup and settings; close
  only the extra QA tab. Preserve unrelated browser state.
- **Status:** pending; this plan is not native audio or audibility proof.

### QA-102 — Sign out after session verification fails

- [ ] **P0 — Pending.** Sign out of the displayed account after a failed session
      check without using cached data as authorization.
  - **Purpose:** Cover logout when a new session check fails. Session failure
    must not prevent a server-verified logout of the previously displayed
    account. Account writes must still require current verification.
  - **Affected files:** `apps/web/src/features/account/sync.ts`, the account
    controls, and the existing captured-user logout endpoint. This extends
    QA-099/100. QA-045 covers a different account in the shared cookie.
  - **Prerequisites:** Use the shared owned HTTPS setup and a real, permitted
    isolated account A. Obtain the real account ID from a successful session
    response. Do not create a fake session or weaken authentication. A live
    issuer identity is a blocker until its owner supplies authorized access.
  - **Inputs:** The existing account A, its preserved primary workspace, and a
    saved pending request if one exists. Intercept only the next account session
    request and abort it. Keep the real logout endpoint reachable.
  - **Steps:**
    1. Open the account dialog after a successful session check. Record A's ID
       and sanitized primary and journal digests in the owned profile.
    2. Use Playwriter request routing to abort the next `/api/session` request.
       Trigger an account check and wait for its failure state.
    3. Select Log out and confirm. Observe the actual outgoing request and real
       response. Do not replace the response with a synthetic success.
    4. Remove the interception. Check the session and inspect the account
       partition, journal, visible workspace, and browser errors.
  - **Expected results:** One real `POST /auth/logout` includes the captured
    `X-Pomodoro-User` for A and succeeds with 204 while A's real session is
    valid. The session then has no user. The app shows Guest mode and hides A's
    data. A's primary and pending request bytes remain unchanged. No account
    save or import bypasses failed session verification. Obsolete session
    callbacks must not restore A after logout.
  - **Evidence:** Save sanitized request and response details, before/after
    digests, visible status, and browser logs under `qa-artifacts/QA-102/`.
    Remove cookie values, tokens, email addresses, and nonce values.
  - **Cleanup:** Remove only the routing handler installed for this case. Log
    out the isolated identity, close only owned tabs, and retain local recovery
    data until its owner approves cleanup.
  - **Coverage:** Failed session verification → session-only logout guards;
    captured-user server authorization → real 204; stale callback → no account
    restoration; primary/journal retention → unchanged digests.
  - **Status:** Pending. No runtime result is recorded.

### QA-103 — Missing primary data cannot retire a pending save

- [ ] **P0 — Pending.** A confirmed server write and a saved request must not
      turn a missing local cache into an automatic empty account overwrite.
  - **Purpose:** Preserve account data when primary local storage is removed
    while an uncertain save remains in IndexedDB.
  - **Prerequisites:** Shared owned HTTPS setup, a real permitted isolated
    account A, no other owned writers, an idle timer, and request interception
    that forwards each actual save at most once. Live identity access remains an
    external prerequisite. Do not create fake authenticated sessions.
  - **Inputs:** A task named `QA missing-cache history`, estimate 2. Record the
    real account ID, primary key, revision, and saved journal reference.
  - **Steps:**
    1. Save the task through the UI. Intercept a later estimate change to 3,
       forward its actual save once, and hold the real response after the server
       commits. Confirm the saved request exists before closing that owned tab.
       Do not fabricate a successful response.
    2. From another owned tab, remove only A's primary workspace key. Retain the
       sync stamp and IndexedDB request. Reload with A's real session.
    3. Inspect recovery status and all outgoing workspace writes. Attempt Keep
       local version while the primary is missing.
    4. Select Use account version and confirm the real CAS fence. Inspect the
       restored primary, saved task, sync stamp, and journal.
  - **Expected results:** No empty workspace is sent automatically. The original
    request remains until explicit recovery completes. Keep local version fails
    with a missing-data message and makes no write. Account recovery retains the
    task and estimate 3, restores primary storage, and removes the exact journal
    only after the real fence and stamp succeed. A fresh account with an empty
    server workspace must also create its primary cache before it reports saved
    state.
  - **Evidence:** Save sanitized request traces, before/after digests, actual
    revision changes, recovery status, and browser logs under
    `qa-artifacts/QA-103/`. Do not record cookie or token values.
  - **Cleanup:** Remove only owned interceptors and records after their owner
    approves. Preserve unexpected recovery data and restore any retained
    isolated backup before deleting the case's data.
  - **Coverage:** Journal recovery and final dispatch → missing primary is not
    an intentional empty edit; explicit account choice → restored cache.
  - **Status:** Pending. No runtime result is recorded.

### QA-104 — Restore a missing cache from the account

- [ ] **P0 — Pending.** Restore a missing primary cache when a valid old sync
      stamp remains but no request is pending.
  - **Purpose:** Prevent an old stamp from making an absent cache look like a
    new empty edit.
  - **Prerequisites:** Shared owned HTTPS setup, a real permitted isolated
    account A, no pending journal request, an idle timer, and a saved nonempty
    account. Live identity access remains an external prerequisite.
  - **Inputs:** A saved task named `QA retained server task`, estimate 2. Record
    its real ID, server revision, primary key, and stamp digest.
  - **Steps:**
    1. Wait for saved status. Inspect the real server response and verify that
       no account request is pending.
    2. Remove only A's primary workspace key from an owned tab. Keep its valid
       sync stamp. Reload the app with A's real session.
    3. Inspect the account GET, restored primary, visible task, stamp, and every
       outgoing save or import request.
  - **Expected results:** The task and estimate 2 return from the verified
    account response. The primary is restored before saved status. No empty PUT
    or import is sent and the server revision does not change. A newer local
    stamp or a same-revision hash mismatch must still enter recovery, not
    silently accept a rollback.
  - **Evidence:** Save sanitized request traces, task IDs, revision, primary and
    stamp digests, status, and logs under `qa-artifacts/QA-104/`.
  - **Cleanup:** Remove only the isolated case's task after approval and retain
    evidence. Do not remove other account or guest storage.
  - **Coverage:** Empty local cache plus retained stamp → account pull rather
    than autosave; normal rollback protections → unchanged.
  - **Status:** Pending. No runtime result is recorded.

### QA-105 — Reject a merged workspace above the client budget

- [ ] **P1 — Pending.** Two acceptable requests must not create account data
      that cannot fit a later compact client save.
  - **Purpose:** Cover the missing aggregate byte limit after guest merging.
  - **Prerequisites:** The shared owned database and current migration. Use two
    new synthetic database-only users for direct data-service probes. They are
    not authenticated HTTP sessions. A real permitted isolated identity is
    required separately to confirm HTTP status and browser feedback.
  - **Inputs:** Two validated workspaces based on the current canonical default,
    each with 1,100 distinct UUID tasks. Use titles `QA byte A 0001` and
    `QA byte B 0001` through 1100, estimates 1, actual 0, completed false,
    project IDs null, and notes of 10,000 ASCII `A` characters. Measure each
    complete import envelope and require it to be below 20,000,000 bytes.
  - **Steps:**
    1. Verify ownership of the isolated database from its recorded container and
       private environment. Never use root `.env` connection settings.
    2. Import A with its own real UUID and expected revision 0 through the
       public data service. Record its revision, workspace digest, and receipt.
    3. Import B with a different UUID and the returned revision. Inspect the
       typed result and use a fresh connection to read the workspace/receipts.
    4. Repeat through the actual documented HTTP endpoint only when a real
       isolated session is available. Inspect status, request ID, browser error,
       and retained guest source.
  - **Expected results:** The second import returns the typed size error; HTTP
    returns 413 with the existing safe error shape and request ID. No second
    receipt, revision change, partial merge, or source deletion occurs. The
    first workspace and receipt remain usable and the other user is unchanged.
    Source review establishes the gap, not a passing runtime result.
  - **Evidence:** Save measured envelope sizes, sanitized operation results,
    revision/digest comparisons, and receipt counts under
    `qa-artifacts/QA-105/`. Keep any manual probe local and ignored; add no
    repository test infrastructure or fake authentication.
  - **Cleanup:** Remove only the two owned synthetic users and their dependent
    data after evidence inspection. Preserve unrelated database rows.
  - **Coverage:** Save/import database boundary → aggregate budget; database
    transaction → no changes on rejection; HTTP mapping → typed 413.
  - **Status:** Pending full acceptance. On 2026-11-09, revision `08cb729`
    passed the isolated database probe: two 11,155,898-byte import envelopes
    were each below the request limit, but the second merge returned
    WorkspaceTooLarge. Workspace, revision, receipt and the other user stayed
    unchanged. Inspect `qa-artifacts/QA-105/database-boundary-results.txt`. HTTP
    413/request ID and browser retained-source/recovery behavior remain unrun.

### QA-106 — Check the budget against browser JSON encoding

- [ ] **P1 — Pending.** The database estimate must bound the actual compact
      browser save and its UTF-16 workspace string length.
  - **Purpose:** Cover the 16-digit revision envelope, Unicode escaping, and
    Rust/JavaScript finite-double serialization differences.
  - **Prerequisites:** The completed aggregate guard and its documented size
    model; current Rust and Bun; an owned browser context for actual browser
    serialization. No database or authenticated session is needed for encoding.
  - **Inputs:** Canonical empty workspaces and boundary-sized validated task
    notes; revision values 0 and 9007199254740991. Include Japanese text, emoji,
    quotes, backslashes, newline, backspace, tab, and timer remaining values 0,
    0.000001, 0.0000001, 12.345, 10800, and the smallest positive finite double.
    Use the current required timer/settings fields.
  - **Steps:**
    1. Inspect the implemented constants and compute below, at, and above budget
       inputs without assuming Rust and browser encodings are equal.
    2. Record the Rust estimate. In the owned browser measure the UTF-8 bytes of
       `JSON.stringify({ expected_revision, workspace })` and the UTF-16 length
       of its workspace JSON. Do not write to user storage.
    3. Compare every measurement with the estimate and 20,000,000-byte limit.
  - **Expected results:** The estimate never undercounts actual client save
    bytes or workspace UTF-16 code units. Its documented conservative margin
    explains any rejected near-boundary input. The size limit is inclusive.
    Invalid NUL, nonfinite numbers, and invalid timer ranges stay rejected by
    existing boundary validation, not accepted for this measurement.
  - **Evidence:** Save inputs without personal data, numeric/string cases,
    estimates, actual lengths, and comparison results under
    `qa-artifacts/QA-106/`. Do not describe finite samples as a general proof.
  - **Cleanup:** Close only the owned measurement tab. No stored data needs
    cleanup. Retain the mathematical model with the evidence.
  - **Coverage:** Client envelope and one timer float → conservative bound;
    valid UTF-8 strings → browser storage code-unit bound.
  - **Status:** Pending browser encoding acceptance. Revision `08cb729` accepted
    conservative bounds 19,999,999 and 20,000,000 and rejected 20,000,001
    against fresh and default isolated database accounts on 2026-11-09.
    Evidence: `qa-artifacts/QA-106/database-boundary-results.txt`. This did not
    execute the actual browser Unicode, escape, timer and revision matrix.

### QA-107 — Keep oversized legacy data recoverable

- [ ] **P1 — Pending.** Existing oversized data stays readable and an explicit
      reducing save can recover it without truncation.
  - **Purpose:** Prevent the new guard from making old account data or old
    idempotent receipts unreadable.
  - **Prerequisites:** Owned isolated database, a new database-only user, and a
    prior oversized workspace created only in this fixture. Record the final
    documented serialized-size reduction rule before execution. Do not create a
    browser session or production row to bypass authentication.
  - **Inputs:** The approximately 22 MB merged dataset from QA-105, an existing
    receipt for one of its imports, a strictly smaller valid dataset, and a
    same-size or larger candidate. Use unique owned IDs and no personal data.
  - **Steps:**
    1. Set up the legacy row only in the owned isolated fixture and record its
       validated content, revision, and receipt. Load through the public
       service.
    2. Replay the original receipt with its exact original payload/revision.
    3. Try a non-reducing save and a new over-budget import. Inspect rollback.
    4. Save a smaller valid workspace under the documented reduction rule, then
       reduce it below the budget and perform an ordinary save.
  - **Expected results:** Load and exact receipt replay return existing data.
    New over-budget imports and non-reducing saves reject without changes. Valid
    reducing saves advance exactly one revision and preserve all records not
    explicitly removed. Once within budget, ordinary saves work. No code
    silently truncates notes, deletes history, or invalidates old receipts.
  - **Evidence:** Save sanitized size/revision/digest results and retained
    receipt comparisons under `qa-artifacts/QA-107/`. This does not establish
    authenticated HTTP or cross-device behavior.
  - **Cleanup:** Remove only the fixture user and dependent records after
    inspection. Preserve all unrelated data and prior QA evidence.
  - **Coverage:** Legacy load/replay → unchanged; reducing save → recovery;
    oversize expansion → rollback.
  - **Status:** Pending browser/HTTP recovery acceptance. The isolated database
    probe at `08cb729` on 2026-11-09 loaded and replayed legacy data, rejected
    non-reducing writes, accepted a conservative bound reduction from 22,310,988
    to 22,310,987, then recovered below the limit and saved again. Evidence:
    `qa-artifacts/QA-107/database-boundary-results.txt`. No browser
    storage-quota or transport recovery is proved by these database calls.

### QA-108 — Preserve revision and receipt rules at the size boundary

- [ ] **P1 — Pending.** A size rejection must not weaken CAS, import identity,
      or account isolation.
  - **Purpose:** Cover regressions in the workflows that share the new guard.
  - **Prerequisites:** Owned isolated database, the completed size guard,
    separate database-only fixture users, and the actual service signatures.
  - **Inputs:** A within-budget import and its UUID; the same UUID with changed
    notes; a stale revision; and two parallel imports whose combined result
    exceeds the budget. Use unique fixture IDs and valid references.
  - **Steps:**
    1. Commit the within-budget import and replay it exactly.
    2. Change its payload with the same UUID, then submit a stale-revision
       write. Record the existing conflict results.
    3. Submit both boundary imports concurrently against one expected revision.
       Reload data with a fresh connection and inspect receipts for both users.
  - **Expected results:** Exact replay returns the current account state with no
    new revision. Changed receipt payloads and stale revisions still conflict.
    Only a valid CAS winner can commit; the other request makes no partial write
    or receipt. No outcome leaks or changes the other user's data.
  - **Evidence:** Save sanitized operation outcomes, revision changes, receipts,
    and digests under `qa-artifacts/QA-108/`.
  - **Cleanup:** Delete only owned fixture users and their dependent records.
    Stop no service that this case did not start.
  - **Coverage:** Shared guard → existing CAS, idempotency, atomicity, and
    per-user boundaries remain intact.
  - **Status:** Pending full integration acceptance. The database probe at
    `08cb729` on 2026-11-09 rejected changed receipts and stale revisions with
    Conflict; concurrent imports produced one winner, one conflict and one
    receipt. Evidence: `qa-artifacts/QA-108/database-boundary-results.txt`. Real
    authenticated HTTP and browser source/journal preservation remain unrun. All
    five synthetic database-only users and their dependents were removed;
    `qa-artifacts/QA-105/aggregate-cleanup.txt` records zero owned rows.

### QA-109 — Private snapshot-owner channel fails closed

- [ ] **P1 — Pending.** A worker must not start snapshot work without its live
      owner and a valid invocation; loss of ownership must stop its owned work.
  - **Purpose:** Cover the proposed surviving-process repair for QA-062,
    including the startup interval before ordinary signal handlers can help.
  - **Prerequisites:** Pinned Bun and installed Lefthook in an owned disposable
    repository. Record hashes of the complete runner, worker, rc, and config.
    Use the existing local hook fixture tools, no real remotes or user tree.
    Inspect the final IPC protocol and cleanup grace before running the case.
  - **Inputs:** Direct private-worker invocation without IPC; a dropped channel
    before startup and before invocation; an invalid start message; a valid
    staged invocation followed by ownership loss; and closed stdout/stderr while
    a check is active. No credentials or real project input are needed.
  - **Steps:**
    1. Record the original fixture index/worktree/untracked byte hashes and the
       owned temporary root. Start each input in its own fixture/process owner.
    2. For rejected startup inputs inspect the exit code and temporary root. For
       active ownership loss inspect the owner, command process groups, their
       descendants, and snapshot paths before and after cleanup.
    3. Close each output stream in separate runs. Preserve exit/output evidence
       before removing only owned leftovers. Run actual installed SIGINT and
       SIGTERM scenarios under QA-062 after these protocol checks.
    4. Repeat normal staged/committed operation and QA-063–065 transport,
       secret-output, and path-collision checks with the same runner hashes.
  - **Expected results:** Invalid or lost startup ownership starts no gate or
    snapshot. Active ownership or output loss fails the check and runs cleanup.
    Owned command groups stop before temporary data is removed; no unrelated
    process is signalled through a saved or reused PID. The owner keeps the
    required lifetime until cleanup completes. The outer killed Lefthook may
    return earlier; record that interval rather than claiming it waits. No raw
    environment, remote URL, or invocation values enter diagnostics. Normal
    success requires completed checks and cleanup, not an IPC disconnect.
    Original bytes and actual origin-tip coverage remain unchanged.
  - **Evidence:** Save sanitized protocol/exit/timing records, process identity
    observations, protected byte hashes, and cleanup results under
    `qa-artifacts/QA-109/`; reference QA-062–065 for installed-hook coverage.
  - **Cleanup:** Stop only verified fixture-owned processes, remove their
    disposable repositories and temporary roots, and retain inspected evidence.
    Leave real project hooks, index, remotes, and services untouched by
    fixtures.
  - **Coverage:** Owner handshake → no orphan startup; IPC/output loss → failed
    cleanup path; installed signals → actual lifecycle; ordinary execution → no
    check bypass or content change.
  - **Status:** Pending. The surviving owner is not implemented at planning.

## Import marker ordering and recovery

Task: preserve the original import journal until cache replacement, verified
remote acknowledgment, and guest-marker handling complete. Scope:
`apps/web/src/features/account/sync.ts` and `sync-storage.ts`; Account controls
on `/` and the existing account workspace and guest-import HTTP operations. Use
the shared owned HTTPS and journal setup above. Obtain two real, permitted,
isolated verified identities A and B; this is an external prerequisite. Never
fabricate a session or use production data. Use separate owned browser profiles
and an isolated database, and back up the guest and account workspaces first.
Use the pinned tools and existing ports from the shared setup; check listeners
before starting owned services. Do not run these cases until explicitly
approved.

For each case, create a guest task `QA marker guest`, save an account task
`QA marker account`, and record their real stable IDs. Record A's actual account
ID, revision E, import ID I, original guest digest H, marker key
`pomodoro:sync:v1:<encoded-account-id>:imported-guest`, and journal token from
the real operation. Do not invent IDs or alter journal records. Use browser
debugger breakpoints or controlled storage failures in the owned profile to stop
at the indicated source boundary. Forward real HTTP requests at most once; do
not synthesize successful responses. If a boundary cannot be injected reliably,
record the case as blocked and identify the missing tool. Save only sanitized
data under ignored `qa-artifacts/QA-110/` through `QA-116/`. Record revision,
environment, date and actual outcome when QA is performed. Cleanup for every
case: remove breakpoints and interception, restore the owned backups or remove
only approved isolated records, and stop only processes started for that case.
Preserve unexpected data for recovery.

Coverage: successful ordering and interrupted replacement → QA-110; retained
exact-ID receipt retry → QA-111; both explicit choices and old markers → QA-112
and QA-113; other or absent markers → QA-114; storage and journal failures and
crash ordering → QA-115; owner changes and cooperating tabs → QA-116. Save-only
behavior is covered by QA-103 and QA-094. PWA, payments, SEO and analytics are
not affected by this source-only change.

### QA-110 — Import finalization before marker

- [ ] **P0 — Pending.**
  - **Purpose:** An unsuccessful cache replacement or acknowledgment must not
    create a new import marker or retire the original request.
  - **Prerequisites:** Shared marker setup; A has no marker for H and no pending
    journal; a real successful import response and debugger storage controls.
  - **Inputs:** The shared guest and account tasks, I, E and H.
  - **Steps:** 1. Confirm the guest import and forward the real request. 2.
    After its commit, separately fail the account backup or primary write and
    stop before acknowledgment in a fresh repeat. 3. Inspect A's primary, marker
    and journal, then remove the failure and reload with A verified.
  - **Expected results:** Each failed finalization retains the original I/E/H
    journal. Neither case writes H as a new marker or reports final success. The
    UI offers review of the pending import and preserves guest data. A
    successful repeat replaces the primary and acknowledges the real remote
    before writing H, then removes only its exact journal.
  - **Evidence:** Save sanitized boundary order, response status and revision,
    primary and marker hashes, journal token and UI state in
    `qa-artifacts/QA-110/`.
  - **Cleanup:** Use the shared marker cleanup.
  - **Status:** Pending; authenticated runtime QA has not run.

### QA-111 — Exact receipt retry after marker and before retirement

- [ ] **P0 — Pending.**
  - **Purpose:** Retry a committed original import without changing its ID,
    request data, or captured baseline after finalization stops.
  - **Prerequisites:** Shared marker setup and a way to stop after H is written
    but before exact journal retirement; verified A and a real receipt.
  - **Inputs:** I, E, H and original guest bytes; later guest task
    `QA marker changed guest`.
  - **Steps:** 1. Complete the real import through acknowledgment and marker
    write; stop before retirement. 2. Reload and review the pending import.
    Change the guest source in an owned guest tab without deleting its
    backup. 3. Retry the original snapshot and inspect the real requests and
    result. 4. Repeat the interruption and retry, including a later account
    local edit.
  - **Expected results:** Receipt retry sends I, E and the original bytes, not
    the changed guest. It does not merge the receipt again. Without later local
    edits it safely retires the original journal and offers the changed guest;
    with later local edits it retains a conflict rather than overwriting them. A
    marker alone never hides the pending-import action.
  - **Evidence:** Save sanitized request IDs, revisions, digests, journal token,
    task IDs and UI state in `qa-artifacts/QA-111/`.
  - **Cleanup:** Use the shared marker cleanup.
  - **Status:** Pending; real receipt and identity are required.

### QA-112 — Resolve interrupted import to local work

- [ ] **P0 — Pending.**
  - **Purpose:** An old matching marker must not hide guest data after an
    explicit local choice replaces the imported result.
  - **Prerequisites:** Shared marker setup; create a real committed import with
    its journal retained and H already present, using an older version or the
    post-marker boundary; retain or restore the pre-import account primary.
  - **Inputs:** I, E, H and the shared task IDs.
  - **Steps:** 1. Reload A and open the conflict. 2. Choose Keep local version
    and confirm the real CAS request. 3. Inspect the marker and journal before
    and after retirement. 4. Reload and inspect account and guest actions.
  - **Expected results:** The chosen local account version is retained; only H
    is removed before the exact resolution journal. The guest source remains
    intact and its import action returns. No automatic import occurs.
  - **Evidence:** Save sanitized CAS status/revision, marker and token ordering,
    task summaries and screenshots in `qa-artifacts/QA-112/`.
  - **Cleanup:** Use the shared marker cleanup.
  - **Status:** Pending; no authenticated scenario has run.

### QA-113 — Resolve interrupted import to account work

- [ ] **P0 — Pending.**
  - **Purpose:** A server-choice fence is not proof that the original guest
    snapshot is still present; conservatively reoffer the guest.
  - **Prerequisites:** Shared marker setup; retained original import journal and
    matching H after a real import; A has a current verified server workspace.
  - **Inputs:** I, E, H and the shared stable task IDs.
  - **Steps:** 1. Reload A and choose Use account version. 2. Confirm the real
    CAS fence. 3. Inspect the marker, journal and guest action after reload. 4.
    Explicitly import the unchanged guest again; repeat with an isolated account
    record sharing a guest ID but differing in content.
  - **Expected results:** H is removed before exact journal retirement, even
    when the account choice is used. Guest remains available. On reimport,
    identical projects, tasks, templates and sessions with the same stable IDs
    deduplicate; differing items with the same ID conflict rather than being
    silently overwritten. Timer/session ID collisions also conflict. Inspect the
    actual response and retained data rather than assuming import success.
  - **Evidence:** Save sanitized CAS/import status, stable IDs, item counts,
    conflict details and marker/journal order in `qa-artifacts/QA-113/`.
  - **Cleanup:** Use the shared marker cleanup.
  - **Status:** Pending; real isolated accounts and controllable records needed.

### QA-114 — Preserve absent or different import marker

- [ ] **P0 — Pending.**
  - **Purpose:** Resolution must not remove an absent, malformed, stale or newer
    marker that does not match the original digest.
  - **Prerequisites:** Shared marker setup; create separate real retained import
    resolutions for A. Use owned storage only; obtain a different valid digest
    from an actual changed guest snapshot.
  - **Inputs:** Original digest H, changed guest digest H2, absent marker and a
    malformed marker value in separate runs.
  - **Steps:** 1. At the pre-cleanup boundary inspect each initial marker. 2.
    Independently set the owned marker to absent, H2, or malformed data. 3.
    Finish a real explicit resolution and reload. 4. Inspect marker and exact
    journal, including guest availability for each valid digest.
  - **Expected results:** Absent stays absent; H2 and malformed bytes stay
    unchanged. Successful resolution retires the exact journal and does not
    erase a newer or different marker. Guest availability reflects the current
    validated marker; malformed data is not treated as H.
  - **Evidence:** Save sanitized before/after marker values, current guest
    digest, token and UI state in `qa-artifacts/QA-114/`.
  - **Cleanup:** Use the shared marker cleanup.
  - **Status:** Pending; controlled owned storage is required.

### QA-115 — Marker and journal failure recovery

- [ ] **P0 — Pending.**
  - **Purpose:** A failed marker read, removal, write or journal retirement must
    not lose durable recovery facts; cleanup must precede retirement.
  - **Prerequisites:** Shared marker setup; real committed responses, matching
    H, and reliable isolated fault injection at localStorage and IndexedDB
    calls.
  - **Inputs:** I, E, H and exact original/resolution tokens.
  - **Steps:** 1. In separate fresh runs fail marker write during import, marker
    read during resolution, marker removal during resolution, and exact journal
    deletion after marker handling. 2. Inspect each error and persisted
    record. 3. Stop after removal but before deletion, reload, and resume
    recovery. 4. Remove each fault and retry through the real UI.
  - **Expected results:** Each error leaves the corresponding journal; no
    success is reported prematurely. Read/remove failures do not delete H. A
    crash after removing H leaves a recoverable resolution journal; repeating
    cleanup with no marker is safe. After marker-write or deletion failure the
    original facts remain available for the proper recovery path.
  - **Evidence:** Save sanitized fault boundary, error state, marker and journal
    tokens before/after reload and retry in `qa-artifacts/QA-115/`.
  - **Cleanup:** Use the shared marker cleanup.
  - **Status:** Pending; fault injection and real identity must be available.

### QA-116 — Owner changes and concurrent account operations

- [ ] **P0 — Pending.**
  - **Purpose:** Stale owner continuations cannot change markers or retire a
    journal, and cooperating same-account tabs cannot bypass the operation lock.
  - **Prerequisites:** Shared marker setup; real isolated verified A and B, two
    current-version A tabs, and controlled breakpoints around stamp lock.
  - **Inputs:** A's I, H and token; B's independently recorded marker and token.
  - **Steps:** 1. Pause A before marker write and, in a separate run, before
    marker removal. 2. Change the active verified owner to B, then release the
    stale continuation. 3. Reverify A and inspect its retained record. 4. Hold
    A's account operation in one tab while requesting recovery in the other;
    release it and inspect real dispatch and journal ordering.
  - **Expected results:** Stale A work does not write or remove either owner's
    marker and does not retire A's journal. B's storage is unchanged. The second
    A tab cannot dispatch a competing mutation or replace the first token while
    the operation lock is held; it reloads current journal state before acting
    after release.
  - **Evidence:** Save sanitized owner IDs, lock order, markers, journal tokens,
    request order and UI results in `qa-artifacts/QA-116/`.
  - **Cleanup:** Use the shared marker cleanup and close only owned extra tabs.
  - **Status:** Pending; both real identities remain external prerequisites.

## Current release evidence — 2026-11-09

- Revision `ccc8349` built from a clean committed archive with frozen frontend
  dependencies. Inspected build output contains no warning, error or deprecation
  diagnostics; final worker precache contains 34 entries and 882.23 KiB.
  Evidence: `qa-artifacts/release-current/final-build/`.
- With user approval, only the old owned SSR process was replaced, at the same
  `127.0.0.2:13001` address. The API, databases and edge were not changed.
- Reused an existing tab in the green `pomodoro-qa` group through session 3. The
  HTTPS page rendered, but its worker script failed certificate validation in
  that browser. No certificate bypass or global trust change was made.
- QA-082 P1 has partial evidence on the same tab at the isolated loopback origin
  `http://127.0.0.2:13001`, which Chrome reports as a secure context. The worker
  registered. Starting a one-minute guest timer, reloading, and activating
  Enable sound produced the ready status. Natural completion saved exactly one
  60-second completed session and advanced to idle short break. Evidence:
  `qa-artifacts/QA-082/current/`. This does not prove audible output. The origin
  began with no project storage; only created project storage was restored to
  that baseline after observation. The original HTTPS/user data was not cleared.
- Direct SSR has no backend proxy, so its account discovery 404 is expected and
  not account acceptance. Initial browser Permissions-Policy warnings remain
  recorded. Timer and sound activation interaction logs were empty.
- Native notification delivery, HTTPS worker acceptance and authenticated
  recovery remain pending. No browser permission was granted or reset.
- QA-074 P1 remains pending: the current Bun audit reports minimatch and
  unpatched deepmerge. No compatible complete dependency repair was verified.
  Rust production graph excludes the locked optional RSA/MySQL path; this does
  not remove the lockfile advisory. Evidence: `qa-artifacts/QA-074/current/`.

### [ ] QA-117 — P1 — Field validation does not repeat identical messages

- **Purpose:** Remove the observed repeated task-title message without removing
  blur or submit validation, distinct errors, field associations or focus.
- **Prerequisites:** Current production build in the existing project-group tab;
  isolated empty loopback guest workspace. Shared FieldMessages callers include
  task, template, settings, project, history and CSV forms. No identity needed.
- **Inputs:** Empty task title; empty project/template names; invalid CSV range;
  out-of-range setting values; separate distinct messages where the actual
  schema produces them. Do not invent validation rules.
- **Steps:**
  1. Open Add task and submit with the title empty. Inspect the displayed error,
     the input aria-invalid and aria-describedby attributes, its linked message
     and focus. Blur the field and submit again.
  2. Repeat invalid blur and submit in the other existing form workflows.
     Inspect actual validation messages and confirm distinct errors remain.
  3. Correct the inputs and inspect error removal; cancel without saving.
     Compare isolated storage with its initial value.
- **Expected results:** Each identical message appears once in its field error,
  with distinct messages retained in original order. Validation timing is
  unchanged. The task title has aria-invalid true, task-title-error as its
  description and focus after invalid submission. No record is created.
- **Evidence:** Save snapshots, direct attribute/focus observations and logs in
  `qa-artifacts/QA-117/`, recording the built revision. Do not infer missing
  attributes from cleaned HTML, which removes them.
- **Cleanup:** Cancel the form and restore only owned fixture changes, if any.
  Keep the existing tab, user data, permissions and other project tabs intact.
- **Status:** Partial pass on f2d264a, 2026-11-09. After the clean production
  build and explicit Update and reload consent, empty task submit showed one
  title message, aria-invalid true, task-title-error as its description, and
  first-invalid focus. Interaction logs were empty. The before/after evidence is
  in `qa-artifacts/QA-117/`. Cancel made no project-storage write. Remaining
  form and distinct-message scenarios keep this case unchecked. The update
  prompt and explicit reload worked on loopback; this is not HTTPS acceptance.

## Authenticated localhost QA evidence — 2026-11-10

- The user completed real issuer login through the existing project-group tab.
  The issuer accepted `http://localhost:13001/auth/callback`; Google returned to
  `https://auth.yopem.com/google/callback`. No Google registration, issuer
  settings, certificate bypass or fabricated session was needed.
- The owned QA API uses its existing development-mode localhost configuration
  against the same isolated database. This is not production HTTPS acceptance.
  Web artifact: f2d264a. The API binary predates the latest source changes.
- Initial verified account workspace was revision 0 with no tasks, projects,
  templates or history. A UI-created Unicode QA task reached server revision 1
  with matching response ownership and survived a full reload.
- QA-054 has partial lost-response evidence: one UI-created second QA task
  triggered exactly one intercepted PUT. Its real server response was 200, then
  only that response was aborted. Server revision became 2. The route
  interception was removed before reload. After reload the app reported synced,
  each QA title appeared once, revision remained 2 and the journal was empty.
  This does not establish a crash with a known pending journal: reconciliation
  might have finished before reload. That scenario remains pending.
- Evidence: `qa-artifacts/QA-054/current-authenticated/`. Records are clearly
  named QA tasks and retained temporarily for follow-up recovery cases. The
  empty original workspace is retained in browser-memory state for comparison.
  No user profile, tokens, cookies or authorization codes are in this evidence.
- QA-015, QA-017, QA-054 and the durable-journal cases remain unchecked until
  their complete acceptance scenarios and cleanup have been inspected.

### Known-pending accepted-save reload subcase

- Source f2d264a, 2026-11-10, existing localhost project-group tab and real
  user-completed session. QA-086 has partial accepted-save recovery evidence.
- A one-shot route forwarded one UI task save to the real isolated API, received
  200, and held the response without delivering it to the app. IndexedDB
  inspection confirmed one request record while response was held.
- Reload completed before releasing the held old response. After reload the task
  appeared exactly once, server revision was 3 and journal count was 0. The
  route was released and removed. Interaction logs were empty.
- Evidence: `qa-artifacts/QA-086/current-authenticated/`. Three clearly named QA
  tasks remain for subsequent recovery checks. Full QA-086 remains pending:
  before-send abort, unaccepted requests, import and concurrent-edit branches
  were not exercised. No cross-account or production HTTPS proof is implied.

## Authenticated denial and unsent-save evidence — 2026-11-10

- Source web f2d264a, localhost development QA API and real permitted session.
  QA-045 exercised GET without captured user (400), random nonmatching user on
  GET/PUT/import/logout (409), and a real-user stale revision PUT (409). Every
  response had no-store and matching JSON/header request IDs. Workspace and
  revision stayed identical at 3; real session remained authenticated. Evidence:
  `qa-artifacts/QA-045/current-authenticated/`. Random header mismatch is not a
  substitute for two actual identities or shared-cookie race checks.
- QA-086 additionally exercised an unsent save. One route-aborted PUT had zero
  server forwards. Server stayed revision 3 with three tasks and no new title,
  while IndexedDB held one request. Reload retained the local QA task and
  presented uncertain-save review instead of silently overwriting the server.
- After removing interception, Keep local version required its confirmation.
  Explicit confirmation produced revision 4, four tasks, one matching new QA
  title and zero journal records. No new interaction errors were logged after
  the expected intercepted disconnection.
- Evidence: `qa-artifacts/QA-086/current-authenticated-unsent/`. Four clearly
  named QA tasks remain temporarily for subsequent checks. Cases stay unchecked
  for remaining import, server-choice, concurrent-edit and cross-user branches.

### Real account-version conflict choice

- Web f2d264a with the real isolated localhost session, 2026-11-10. Opened the
  first QA task editor at account revision 4. A direct authenticated CAS request
  changed only that QA task note on the server to QA server-side conflict note,
  producing revision 5. The already open form saved QA local conflict note.
- The UI stopped autosync and required version review instead of silently
  replacing the server. Use account version displayed explicit replacement
  consent. Confirmation retained all four tasks and restored the server note in
  both local storage and server workspace. The fenced revision became 6.
  Post-choice interaction logs were empty.
- Evidence: `qa-artifacts/QA-017/current-authenticated-conflict/`. This
  exercises actual server divergence and account-choice confirmation on one
  identity, not a real second-device or cross-account switch. Full QA-017
  remains pending.
