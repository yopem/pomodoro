# Web application QA

Current tooling policy: remove the custom snapshot checker and Bun pinning, not
Lefthook or Turbo. Keep their requirements in AGENTS.md. QA-062–065, QA-109 and
QA-120 retain historical evidence only; their former snapshot/pin acceptance
criteria no longer apply. They are not new passes. QA-121 covers CI's three
checks; QA-123 covers the requested removal.

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

Current authenticated browser QA uses `http://localhost:13001` in the existing
project-group Chrome tab. The edge routes backend requests to the owned API at
`127.0.0.1:18001` and other requests to the copied standalone SSR artifact at
`127.0.0.2:13001`. The API uses isolated development configuration for this
loopback origin; do not report it as production HTTPS acceptance. The user
completed real issuer login on this origin. The previous HTTPS hostname was
rejected by the issuer and its certificate is not trusted by this browser. Do
not bypass TLS validation or change issuer or Google configuration.

Use existing connected project-group tabs first. Do not launch another browser,
create a profile, restart Chrome, install trust, clear user storage, or use
another project's tabs. A temporary peer tab in the same project group is
permitted only for a required two-tab scenario; close only that owned peer.
These restrictions supersede older profile suggestions in individual cases. Read
`qa-artifacts/runtime/context.json` and current progress notes before using any
process. Do not print private environment values. Check listeners before
starting a service. Do not start a second web server or change project ports.
Use only identified QA fixtures and guarded record-specific cleanup.

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

### [x] QA-086 — P0 — Journal preparation failure blocks dispatch

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
- **Status:** Passed on 2026-11-09, built f25b09c5, real localhost account.
  Aborted the actual journal readwrite transaction before completion; no PUT or
  import POST was emitted. Server workspace/revision 24 and sync stamp stayed
  exact, local work remained once, and journal count stayed zero. Visible
  Account feedback reported unavailable recovery storage and Retry sync. After
  restoring native IndexedDB, the real retry was paused before forwarding to
  inspect its committed save journal (expected revision 24). Exactly one PUT
  then completed at revision 25, the task existed once, history stayed at two,
  and journal count returned to zero. Logs were empty. Removed the owned fault
  injection, listener and route, then deleted only the QA task through its
  guarded UI confirmation: revision 26, 15 tasks and two history records.
  Evidence is under `qa-artifacts/QA-086/preparation-abort/`. This proves the
  transaction-abort branch, not native quota exhaustion or every storage
  failure.

### [x] QA-087 — P0 — Committed preparation survives a pre-send reload

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
- **Status:** Passed on 2026-11-09, built f25b09c5, real localhost account. Held
  the journal completion callback only after a native strict transaction
  committed; prototype restoration occurred at that event. Confirmed one
  committed record, server revision 26/title absent and zero PUTs. Reload
  retained the exact original record and primary bytes and displayed explicit
  uncertain-save review without dispatch. Following the separate QA-088 fixture
  restore, Keep local version consent sent one revision-26 PUT, yielding
  revision 27/title once/journal zero. Guarded UI deletion of only the owned
  task restored 15 tasks/two history records at revision 28. No pause globals
  remained after reload, and interaction logs were empty. Evidence:
  `qa-artifacts/QA-087/current-authenticated/`. This is an instrumented
  native-commit/reload boundary, not an OS power-loss test.

### [x] QA-088 — P0 — Corrupt journal remains preserved

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
- **Status:** Passed on 2026-11-09, built f25b09c5, real localhost account.
  Added only the owned `qaUnexpectedField` value to the backed-up pending save
  using exact-record CAS. Reload displayed invalid/unsupported recovery
  feedback. The malformed record and primary bytes stayed exact, server revision
  26/tasks 15/title absent stayed unchanged, and zero PUTs were emitted.
  Exact-fixture CAS restored the original record; reload again required review
  rather than treating it as missing. The explicit QA-087 resolution and guarded
  task deletion completed cleanup at revision 28. Logs were empty. Evidence:
  `qa-artifacts/QA-088/current-authenticated/`. This covers the specified
  unknown-field corruption, not arbitrary browser database damage or every
  future codec.

### [x] QA-089 — P0 — Unknown journal version fails closed

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
- **Status:** Passed on 2026-11-09 UTC, built f25b09c5, real localhost account.
  Changed only a genuine pending import's version to 999. Reload and retry
  preserved exact journal, primary, stamp and guest bytes and emitted no
  workspace mutation; invalid/unsupported recovery feedback remained visible.
  Exact-record CAS restored the original version. A later database crash
  temporarily returned 503, so replay/cleanup waited for real readiness and
  verified session recovery. The original import then replayed once with the
  same ID, expected revision and complete body SHA-256; revision 29 stayed
  unchanged, its title existed once and the journal cleared. Guarded deletion of
  only the fixture task and exact guest-key removal returned the complete
  original 15-task/two-history workspace at revision 30. Logs after recovery
  were empty. Evidence: `qa-artifacts/QA-089/current-version-codec/`. This is
  the specified version-999 branch, not every future migration.

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
- **Status:** Pending full acceptance. Built f25b09c5 held A’s real successful
  PUT response with its original save journal present. B added its own task
  while A held the operation lock; no B PUT occurred, and the exact journal
  stayed unchanged through 27.9 seconds. Closing only the queued owned peer
  cancelled that tab’s wait. After A was released, it acknowledged revision 23
  and saved the later local task at revision 24. Both titles existed once,
  history stayed at two, and journal count was zero; interaction logs were
  empty. Evidence is under `qa-artifacts/QA-090/current-authenticated/`.
  Accessible queued/busy feedback was not inspected, so the full case remains
  unchecked; this run does not prove every import or cancellation branch.

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

### [x] QA-097 — P0 — Versioned request bytes cannot change silently

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
- **Status:** Passed on 2026-11-09 UTC, built f25b09c5, real localhost account.
  In a genuine pending import, removed only `settings.focus_color` from original
  `guestJson`, recomputed that raw string's SHA-256, and changed only those
  fields by exact-record CAS. The frozen codec rejected the record; retry stayed
  unavailable/disabled rather than applying a live-schema default. Exact altered
  facts, primary, stamp and guest were preserved and no mutation was emitted.
  After exact restoration and separate DB availability recovery, explicit
  original retry sent the same complete body SHA-256
  `053f4ab6a33f99372f198c4516d5de25decb3525bdcd3fd6f04c9603f582af69`. Idempotent
  receipt stayed at revision 29/title once/journal zero; account focus
  remained 25. Exact guest removal and guarded fixture deletion restored the
  full baseline at revision 30. Evidence:
  `qa-artifacts/QA-097/current-version-codec/`. Final interaction logs were
  empty; this covers the specified missing-default codec mismatch only.

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
  - **Status:** Pending full acceptance. The surviving owner is implemented.
    Earlier installed-hook SIGINT evidence found copied-index cleanup before an
    owned group had stopped. The group-drain repair keeps detached group IDs
    until signal-0 probes return `ESRCH`; it sends no further signals from
    retained IDs. Probe errors or the five-second limit fail the check and
    retain all temporary directories. Immutable ordinary, SIGINT and SIGTERM
    fixtures passed the observed subcases in
    `qa-artifacts/QA-109/group-drain-final/`. No sampled live group remained
    after a temporary directory disappeared. Sampling does not prove the exact
    syscall order. Probe-error injection, output-loss causality and
    final-completion races remain pending. Zombie-only groups can cause safe
    timeout and retained temporary files.

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
  user-completed session. QA-054 has partial accepted-save recovery evidence.
- A one-shot route forwarded one UI task save to the real isolated API, received
  200, and held the response without delivering it to the app. IndexedDB
  inspection confirmed one request record while response was held.
- Reload completed before releasing the held old response. After reload the task
  appeared exactly once, server revision was 3 and journal count was 0. The
  route was released and removed. Interaction logs were empty.
- Evidence: `qa-artifacts/QA-086/current-authenticated/`. Three clearly named QA
  tasks remain for subsequent recovery checks. Full save-recovery coverage
  remains pending: before-send abort, unaccepted requests, import and
  concurrent-edit branches were not exercised. No cross-account or production
  HTTPS proof is implied.

## Authenticated denial and unsent-save evidence — 2026-11-10

- Source web f2d264a, localhost development QA API and real permitted session.
  QA-045 exercised GET without captured user (400), random nonmatching user on
  GET/PUT/import/logout (409), and a real-user stale revision PUT (409). Every
  response had no-store and matching JSON/header request IDs. Workspace and
  revision stayed identical at 3; real session remained authenticated. Evidence:
  `qa-artifacts/QA-045/current-authenticated/`. Random header mismatch is not a
  substitute for two actual identities or shared-cookie race checks.
- QA-054 additionally exercised an unsent save. One route-aborted PUT had zero
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

## Authenticated import and report durability subcases

- Web f2d264a, real isolated localhost session, device local date 2026-11-09.
  Earlier fixture task names end in 2026-11-10 as literal safe input strings;
  that suffix does not represent the observed local execution date.
- QA-018 HTTP subcase: importing a canonical guest workspace with one new QA
  task returned 200 and revision 7 from revision 6. Exact import-ID/payload/
  revision replay returned 200 at revision 7, with one imported task. Reusing
  the ID with changed content returned 409 and a matching request ID; the
  original note, settings, timer and revision stayed unchanged. Sync now loaded
  the imported task into the app. UI guest preparation, uncertain import reload
  and two-account cases are still pending. Evidence:
  `qa-artifacts/QA-018/current-authenticated/`.
- QA-044 UI subcase: added two 25-minute Unicode-named QA history records dated
  local today 2026-11-09 and yesterday 2026-11-08. Year reports show 50 minutes,
  two active days and a two-day streak. Authenticated server reads returned two
  sessions totalling 3000 seconds at revision 9. Full browser reload and then
  restart of only the owned isolated API retained the session, IDs/history and
  report values. No database restart or user settings change was involved.
  Evidence: `qa-artifacts/QA-044/current-authenticated/`. New-device acceptance
  is separate; this case remains unchecked.
- QA-104 missing-cache subcase: saved the current account primary value in
  browser-memory state, removed only that account primary localStorage key, and
  reloaded. Verified remote data repopulated the primary exactly: five QA tasks,
  two sessions and 3000 seconds. Server revision stayed 9, with no empty
  overwrite. Existing stamps/journal were retained, so this is not a completely
  fresh-device test. Evidence: `qa-artifacts/QA-104/current-authenticated/`.
- Five QA tasks and two QA history records remain for follow-up or guarded
  cleanup. Original account workspace was empty; no existing user work was
  overwritten. The owned API restarted as bt-130 using the same isolated DB.

### Unknown request-journal version fails closed

- QA-089 P0 partial subcase, web f2d264a, real authenticated localhost account,
  device-local date 2026-11-09. Verified no pending account request existed,
  then inserted one synthetic account-owned IndexedDB record with version 999
  and QA marker unknown-version-2026-11-09. No token or owner capability was
  stored. Reload showed unsupported recovery data and blocked sync.
- The exact unknown-version record remained. Server revision stayed 9 with five
  tasks and two history records. No overwrite or automatic journal deletion
  occurred. Removed only the fixture after checking both its version and marker
  in the same transaction, then reloaded; reports and account data remained.
- Evidence: `qa-artifacts/QA-089/current-authenticated/`. UI evidence omits the
  account display name. Other malformed shapes, blocked storage, quota failures
  and version coexistence are separate cases; no complete pass is inferred.
- Earlier save-response/unsent-save evidence paths use a QA-086 directory name,
  but those results support QA-054, not journal-preparation failure acceptance.
  QA-086 preparation failure and QA-087 pre-send crash remain pending.

## Durable authenticated import reload result

- QA-055 partial, web f2d264a, same real localhost session. Fixture setup wrote
  one canonical isolated guest workspace while the account stayed signed in: one
  uniquely identified QA task, focus 17 minutes, idle focus timer 1020 seconds,
  no history. Existing guest primary was confirmed absent first. This is
  controlled fixture setup, not guest editor acceptance.
- The actual Import guest work UI disclosed that nonempty account settings and
  timer stay unchanged. Confirm import forwarded once, server returned 200, and
  the response was held. IndexedDB held an original import journal. Server
  revision became 10 with exactly one imported task and focus still 25 minutes.
- Reload before releasing the held response exposed Review pending import. Its
  consent described the saved original snapshot. Retry original import sent the
  exact same import ID, expected revision and task count. Server stayed revision
  10, imported title count stayed 1, and the journal cleared. The guest source
  remained. Raw IDs and payloads were not logged.
- Evidence: `qa-artifacts/QA-055/current-authenticated/`. Payload-identity proof
  is limited here to the saved snapshot inputs, ID, revision and task count;
  future checks must hash actual full dispatch bytes for byte-for-byte proof.
- A Chrome blocked-aria-hidden warning appeared after recovered-import closure.
  Data recovery passed this subcase, but accessibility acceptance is failed
  until the nested-dialog focus transition is repaired and rerun.

### [x] QA-118 — P1 — Account import completion returns focus safely

- **Purpose:** Fix the observed focused-descendant/aria-hidden warning after
  recovered import completion without losing original import facts or focus.
- **Prerequisites:** Real isolated account, guest fixture and durable-import
  setup from QA-055. Existing project-group browser only. Built repair needed.
- **Inputs:** One QA guest task; nonempty account; hold the first successful
  import response, reload, then review and retry the original import.
- **Steps:**
  1. Repeat QA-055 known-pending import setup and capture dialog names/focus.
  2. Confirm original retry, wait for complete closure and inspect focus and
     modal state. Repeat normal import, Cancel and Escape.
  3. Inspect logs and verify no extra import, changed account preference or
     journal loss. Restore only the owned fixture data.
- **Expected results:** Focus never stays inside an aria-hidden ancestor. Modal
  transitions do not warn, leave an invisible trap or focus behind a dialog.
  Focus returns to an existing visible account control; immutable request and
  owner guards, explicit consent and journal finalization remain unchanged.
- **Evidence:** Save sanitized snapshots, focus observations and warnings in
  `qa-artifacts/QA-118/`; match each result to its built revision.
- **Cleanup:** Release only owned request handlers; remove only QA guest/task
  fixtures after guarded comparison. Keep the real user session and other tabs.
- **Status:** Passed on 2026-11-09, built f25b09c5, existing localhost test
  account. Preserved the f2d264a warning as prior failure evidence. A real 200
  response was held after one forward and the import journal existed before
  reload. Original retry matched ID, revision and full request-body SHA256; one
  task existed, account focus stayed 25, journal count became zero, and focus
  returned to the parent close button with one remaining dialog. Normal import,
  Cancel and Escape also returned focus to that button. Parent closure returned
  focus to Account. Interaction logs had no warning or error. Exact owned guest
  fixtures were removed; imported account QA tasks remain until guarded account
  cleanup. Evidence is under `qa-artifacts/QA-118/current-authenticated/`; build
  metadata is under `qa-artifacts/QA-118/build-production-https/`. This is
  localhost browser acceptance, not production HTTPS or screen-reader
  certification.

## Current API HTTP budget and phone-dialog evidence

- Rebuilt committed Rust API e03cb575 from a clean archive with locked
  dependencies and two Cargo jobs. Release build completed without compiler
  warnings. Replaced only the owned localhost API process on the same isolated
  database. Health/readiness returned 200; real session and revision 10 with six
  tasks/two history records survived. Evidence:
  `qa-artifacts/release-current/api-release-build.txt` and `api-auth-smoke.txt`.
- QA-105 authenticated HTTP subcase: a 1100-task import request of 11162487
  UTF-8 bytes returned 200 at revision 15. Another same-size distinct import
  returned 413 before aggregate mutation. Error request IDs matched, no-store
  was present, revision remained 15 and the full workspace was unchanged.
- Guarded cleanup returned 200 at revision 16 and restored the pre-test
  workspace byte-for-byte. Replaying the successful original import returned the
  advanced receipt at revision 16 without re-adding fixtures. Six tasks and two
  history records remained, with zero large budget fixtures. Evidence:
  `qa-artifacts/QA-105/current-authenticated-http/`.
- Two earlier harness attempts lost results to an execution deadline and an
  intervening navigation. Independent reads confirmed both cleanup runs
  completed, leaving no large fixtures at revisions 12 and 14. They are not
  acceptance evidence. The final split-step run supplies the results above.
- QA-073 task-dialog subcase at measured 320 by 568 CSS pixels: popup bounds
  were x0/y48/width320/height520. Save task was x24/y472/width272/height36. An
  ordinary pointer save created one QA phone task at revision 17, closed the
  dialog and returned focus to Add task. Interaction logs were empty; device
  emulation was cleared. Evidence: `qa-artifacts/QA-073/current-authenticated/`.
  Other dialog forms, keyboard combinations and viewport cases remain pending.

## Installed-hook cleanup ordering regression

- QA-062 and QA-109 remain failed for full acceptance. Immutable e03cb575
  installed-hook SIGINT observation found the copied-index temp removed while
  the recorded owned check process group was still live. The group later exited,
  all observed resources cleaned up and protected bytes matched.
- Evidence: `qa-artifacts/QA-109/current-causal/` and ignored report
  `docs/hook-output-final-qa.md`. The native Bun process itself was not proven
  live at that sample; the owned group-exit-before-any-temp-removal contract
  nevertheless failed. A source repair and fresh causal rerun are required.
- Output-write causality, worker SIGINT status and final-completion race were
  not established. Prior partial signal successes do not override this failure.

### [x] QA-119 — P1 — Simultaneous new tasks converge across account tabs

- **Purpose:** Investigate the observed uncertain-save review after two
  current-version tabs add distinct tasks, without assuming a network rejection
  or discarding a genuine pending request.
- **Prerequisites:** Existing project-group browser and one additional owned QA
  tab, same real isolated account, matching current artifact and baseline.
  Preserve journal facts and current local work before any repair.
- **Inputs:** QA concurrent tab A and QA concurrent tab B; distinct new-task
  IDs. At observation server revision 17 held seven QA tasks; primary had nine.
- **Steps:**
  1. Open Add task in both tabs before either saves. Enter one distinct title
     per tab and activate both Save task controls concurrently.
  2. Capture actual mutation dispatch, operation-lock/journal ordering and
     local/server counts without logging cookies or personal identifiers.
  3. Determine whether a still-owned preparation was definitely never sent, or
     whether network uncertainty requires review. Exercise the legitimate
     recovery path and repeat after a narrowly scoped fix if needed.
- **Expected results:** Both new tasks stay present exactly once. Operation
  locks and immutable journal ownership remain enforced. A proven unsent
  preparation can be retired only by its owner through exact CAS before retry;
  genuinely uncertain requests must retain facts and explicit review. Safe
  autosync should not be stranded merely by another local edit.
- **Evidence:** `qa-artifacts/QA-119/`; save dispatch order, safe hashes/counts,
  revisions, record identity comparisons, accessible feedback and logs.
- **Cleanup:** Release only owned interceptors and close only the temporary peer
  tab after recording results. Retain or remove only guarded QA records.
- **Status:** Passed the stated simultaneous-addition scenario on 2026-11-09
  with built f25b09c5 and the existing real localhost account. Preserve the
  f2d264a usability failure and its unproved dispatch cause in `before/`. That
  original pending record was recovered by explicit Keep local version, not
  silently discarded. In the rebuilt two-tab run, request listeners observed A
  send revision 20 with 12 tasks and receive 200/revision 21, then B send
  revision 21 with 13 tasks and receive 200/revision 22. Both new titles existed
  once, primary/server contained 13 tasks, history stayed at two, journal count
  was zero, and both tabs reported synced without log warnings or errors. No
  request was intercepted in this rerun. Owned listeners were removed and only
  the temporary peer was closed. Evidence is under
  `qa-artifacts/QA-119/current-authenticated/`. This does not establish the
  separately held-active-request QA-090 or every uncertainty branch.

### [ ] QA-120 — P1 — Official project Bun revision is reproducible

- **Purpose:** Resolve the mismatch between the declared official Bun package
  and the revision of the previously tested host binary. The user approved a
  project-only revision update on 2026-11-09, conditional on successful checks.
- **Prerequisites:** Leave global Bun, shell profiles and system tools
  unchanged. Use a new owned private cache and a clean committed archive. Read
  registry integrity metadata and exact platform package before selecting bytes.
- **Inputs:** Declared `bun@1.4.4-canary.20261104.1` and corresponding official
  Linux x64 platform package. The observed published binary revision differs
  from `a8fcd319b`; discover and record the full actual revision/checksums.
- **Steps:**
  1. Record the current global executable path, checksum, version and revision.
  2. Verify the official package bytes against published integrity, extract only
     into the private cache and run its version/revision commands.
  3. With only subprocess PATH changed, execute the actual configured native
     lint, format and workspace types, explicit ignored-config coverage, route
     generation, production web build and required Rust static gates.
  4. Recheck the global executable and profiles. Only after compatibility
     passes, align the project pin, packaging recipe and documented bootstrap.
  5. Rebuild from the committed pin and rerun relevant browser and installed
     hook regressions; identify earlier evidence tested with the old runtime.
- **Expected results:** The declared artifact installs exact verified bytes
  reproducibly. No rules, hook checks or type safety are weakened. The global
  installation and unrelated files remain unchanged. All required checks succeed
  without warnings before adopting the candidate.
- **Evidence:** `qa-artifacts/QA-120/`; record registry URLs/integrity, binary
  checksums, exact revisions, sanitized gates and protected-file comparisons.
- **Cleanup:** Retain the verified cache for approved project commands; remove
  only disposable compatibility archives and owned failed candidates.
- **Status:** Pending post-pin acceptance. Official registry/SRI, archive and
  executable checks passed for b9f2ec363. Fresh source archive 5f78d042 with no
  copied node_modules passed frozen installation, the real snapshot gate,
  representative allowed/rejected policies and a production web build. Global
  Bun and profile hashes stayed unchanged. Exact README bootstrap checks also
  passed. Evidence: `qa-artifacts/QA-120/fresh-install-policy/` and
  `docs/official-bun-clean-policy.md`. Project pin/container consumers now use
  the verified artifact. Full Compiler semantics, post-pin browser/container
  acceptance and the complete installed-hook regression set remain unproved.

### [ ] QA-121 — P1 — CI runs lint, format checks and typechecks

- **Purpose:** Run only the three user-requested check categories after verified
  tool and frozen dependency setup. CI is not full release acceptance.
- **Prerequisites:** Installed Bun canary and the pinned Rust toolchain. Read
  the actual root/workspace scripts. No database, account or credentials are
  needed.
- **Inputs:** Clean checkout, Bun canary and the pinned Rust toolchain.
- **Steps:**
  1. Review immutable actions, read-only permissions, no persisted credential,
     and official canary setup without exact Bun version/revision assertions.
  2. Inspect setup plus exactly Typecheck, Lint and Format check. Typecheck runs
     first to generate routes required by type-aware lint. Lint includes tracked
     JS/TS with config coverage, zero warnings and Clippy; format uses
     nonwriting native Bun and Rustfmt checks. Workspace typecheck includes
     Cargo check.
  3. Confirm there are no build, audit, snapshot, contract-drift, test,
     migration or deployment steps and no failure suppression.
  4. Run focused local workflow syntax/policy checks. A hosted run needs a
     separately permitted push; do not push merely to test this workflow.
- **Expected results:** These check failures fail CI. Setup selects the official
  Bun canary. No app service or database starts. Local checks do not imply
  hosted success. Advisory findings remain unresolved outside this explicitly
  limited CI scope.
- **Evidence:** `qa-artifacts/QA-121/`; save exact policy/syntax commands and
  results, tool setup evidence and any separately permitted hosted run URL.
- **Cleanup:** Remove only owned fixtures and temporary files.
- **Status:** Pending hosted acceptance. Workflow source contains only setup and
  the three requested check categories. No hosted workflow has run. Earlier
  build/audit/drift workflow draft was replaced at the user's request, not
  presented as a passing audit or complete release gate.

### [ ] QA-122 — P1 — Database process supervision contains orphan failure

- **Purpose:** Prevent an unrelated adopted helper failure from restarting
  PostgreSQL and interrupting account recovery. The owned QA container logged
  untracked-child SIGPIPE followed by full backend reinitialization twice; its
  memory event counters were zero. The exact original child source is unknown.
- **Prerequisites:** Verify owned container labels and immutable PostgreSQL
  image. Use new disposable containers with no host ports or external network
  and new isolated data. Never use the real QA account volume or another
  project's DB for destructive fault reproduction. Inspect Podman's supported
  `--init` and Compose's documented `init` behavior before changing deployment
  configuration.
- **Inputs:** Pinned PostgreSQL 18.6 image, existing `pg_isready` health
  command, generated private bootstrap credentials, and one adopted helper that
  exits with SIGPIPE. Do not log credentials or SQL statement contents.
- **Steps:**
  1. In an unsupervised disposable control, record database process IDs and
     readiness; run the bounded helper-failure reproduction and inspect fixed
     recovery messages plus the outcome of an active harmless SQL request.
  2. Repeat with supported container init enabled and the same image, limits,
     health command and helper. Inspect init/PG process ownership and readiness.
  3. Apply only a proven supervision change to source Compose configuration.
     Validate Compose syntax and effective init setting using synthetic env.
  4. Verify graceful stop and owned fixture cleanup. If replacing the original
     owned QA container later, first finish pending operations, preserve its
     exact volume/credentials, and verify account data after replacement.
- **Expected results:** Init reaps the unrelated orphan without invoking
  PostgreSQL crash recovery; active SQL/readiness remain available. Normal
  signals reach PostgreSQL and bounded shutdown completes. Configuration does
  not change DB credentials, schema, existing user records or unrelated
  services.
- **Evidence:** `qa-artifacts/QA-122/`; record exact sanitized commands,
  immutable image and labels, process/health observations, safe recovery
  messages, active SQL outcomes, shutdown results and complete owned-resource
  cleanup.
- **Cleanup:** Stop/remove only new labeled probe containers and their temporary
  data/credentials. Never delete or reset the account QA volume.
- **Status:** Pending. Database availability recovered, but causal reproduction
  and a supervised control have not run. Do not label this an OOM or an issuer
  failure without evidence.

### [x] QA-123 — P1 — Remove snapshot hooks and Bun version locks

- **Purpose:** Follow the user's request: no custom snapshot system, Bun version
  pin or revision gate; retain only lint, format checks and typechecks in CI.
- **Prerequisites:** Clean initial Git status; installed native-capable canary.
  Preserve global Bun, app processes, browser, data and user-managed Git hooks.
- **Inputs:** Current installed canary, existing Bun lockfile and the official
  setup-bun action with `bun-version: canary`. Do not install a global runtime.
- **Steps:**
  1. Inspect and back up only this task's generated Lefthook pre-commit/pre-push
     files, then remove them. Preserve any unrelated or custom hooks.
  2. Remove the snapshot scripts/config/dependencies and script-only TS project.
     Remove Bun metadata/package-manager pin and hardcoded container checks.
  3. Verify native Bun workspace dispatch needs no version declaration; all four
     existing workspace typechecks must still run.
  4. Parse CI YAML and shell blocks. Inspect that setup selects canary and the
     only check steps are Typecheck, Lint and Format check. Preserve strict
     rules, zero-warning lint, nonwriting formats and Rust checks.
  5. Run available static checks with the unchanged installed Bun. Search
     maintained source/config/docs for active snapshot and Bun-pin references.
     Do not push, start services, or run browser/database/build QA.
- **Expected results:** Local commits/pushes no longer invoke the custom helper;
  no fixed Bun version/revision is required. CI's quality rules remain intact.
  No user files/data or global tools change; no new hook framework is added.
- **Evidence:** `qa-artifacts/QA-123/`; preserve managed-hook backup, source
  inspection, shell/YAML results and static command outputs. No credentials.
- **Cleanup:** No app/data cleanup. Preserve user hooks and running services.
- **Status:** Passed for the requested static-only removal on 2026-11-10.
  Installed global a8 canary passed all four workspace lint, format and
  typecheck scripts, explicit type-aware zero-warning source lint, full format,
  CI YAML/shell assertions and synthetic-env Compose config. The global Bun hash
  matches its original value. No running app, browser, data or service was
  changed. The supported Turbo opt-out still recursed; native workspace dispatch
  replaced it rather than restoring a version declaration. An initial
  unsupported Compose CLI option was corrected before successful rendering.
  Historical snapshot/pin evidence is not a pass for this configuration. Hosted
  CI and dev/build launch remain unrun; see QA-121 and QA-124.

User clarification supersedes the hook-removal/native-dispatch parts of this
historical run. Retain Lefthook and Turbo; only fixed Bun settings and the
custom snapshot checker should remain removed. See QA-125.

### [ ] QA-124 — P1 — Native workspace development and build dispatch

- **Purpose:** Preserve dev/build entrypoints after removing Turbo's runtime
  declaration dependency. Static checks must still cover all four workspaces.
- **Prerequisites:** Requested later launch/build approval; stop or reuse
  existing owned development services first. Preserve the user's current manual
  session.
- **Inputs:** Existing root scripts, the installed Bun and the four workspaces.
- **Steps:**
  1. Inspect that dev uses native parallel workspace dispatch and build uses
     native workspace dispatch, skipping only workspaces without those scripts.
  2. In a separately approved run, use `bun run dev` from the repository root;
     verify web/API start on their configured ports and stop cleanly together.
  3. In a separately approved build run, use `bun run build`; verify both
     existing application builds finish and their outputs remain usable.
- **Expected results:** Existing names and leaf commands remain unchanged, with
  no recursive root task, version gate, added helper or project Git hooks.
- **Evidence:** `qa-artifacts/QA-124/`; command logs, artifact revision and
  owned process cleanup. Current static-only run must not be reported as launch
  proof.
- **Cleanup:** Stop only processes explicitly started for the approved case.
- **Status:** Superseded. The user requires Turbo; native root task dispatch was
  an overly broad change and is restored under QA-125. No dev/build launch is
  needed to accept removal of exact Bun pins.

### [x] QA-125 — P1 — Retain Turbo and Lefthook without Bun pins

- **Purpose:** Apply the user's correction: keep Turbo monorepo dispatch,
  Lefthook staged/push checks and their AGENTS instructions. Remove only fixed
  Bun version/revision gates and custom snapshot scripts.
- **Prerequisites:** Existing installed native-capable canary and Rust tools;
  clean initial worktree. Preserve global tools, manual app/browser and data.
- **Inputs:** Four existing workspaces; restored turbo.json and lefthook.yml. CI
  still selects canary and has only lint, format checks and typechecks.
- **Steps:**
  1. Restore existing Turbo root tasks/dependency/config without a fixed Bun
     version/revision. Inspect supported package-manager detection and dry task
     graph; all four check workspaces must remain present.
  2. Restore Lefthook as a root dev dependency. Inspect supported configuration,
     install its managed pre-commit/pre-push hooks and preserve user hooks.
  3. Check staged JS/TS explicitly with type-aware zero-warning native lint;
     check supported staged text formatting without writes. Include Rust checks
     for staged Rust sources/manifests and full owning-project typechecks.
  4. Run pre-push checks for all current tracked source/config files plus full
     workspace typechecks, Clippy and Rustfmt. Do not make a real remote push.
  5. Make the requested commit through the installed pre-commit hook; inspect
     source, effective config, hook output and final Git status.
- **Expected results:** Neither hook calls a snapshot script or checks the Bun
  version/revision. Relevant failures block commit/push; rules remain strict.
  Turbo and Lefthook instructions remain in AGENTS.md. Normal built-in staged
  handling is used, not custom snapshot exports. Pre-push checks the current
  checkout; no distinct pushed-tip snapshot coverage is claimed.
- **Evidence:** `qa-artifacts/QA-125/`; dry graph, configuration and static hook
  logs with tested revision and global-tool preservation.
- **Cleanup:** Preserve installed requested hooks. No app/data cleanup or
  service changes. Do not reset the user's manual records or push to a remote.
- **Status:** Passed for scoped static restoration at source `170765b` on
  2026-11-10 UTC. True Turbo monorepo dry graph selected all four workspace
  typechecks. Installed pre-commit all-files checks and all five pre-push jobs
  passed with zero warnings; actual commit hook passed workspace typechecks and
  staged formatting. Exact committed blobs matched the worktree. Full formatting
  checked 123 files. Original global Bun SHA256 stayed unchanged. Evidence:
  `qa-artifacts/QA-125/implementation-commit.txt`, `full-pre-push.txt`,
  `turbo-dry-graph.json` and `global-tool-preservation.json`. Initial diagnostic
  pre-push runs skipped argument-free jobs; final all-files activation fixed
  that and all five ran. Earlier broad removal is superseded. No real push,
  hosted CI, dev/build launch, browser, service or data action ran; no new
  partial-staging/signal fixtures or separate pushed-tip isolation are claimed.
  Hosted CI QA-121 P1 stays pending.

## Timer loading layout

Scope: `/` and `/focus`; loading placeholders only. The timer store, hydration,
settings, task commands, and persistence contracts must not change.

### [ ] QA-128 — P1 — Loading layout and hydration transition

- **Purpose:** replace the blank loading screen without showing false task or
  timer data or exposing controls before the workspace is ready.
- **Prerequisites:** local Vite server at `http://localhost:13001`, existing
  isolated browser profile; no containers are required for guest loading. Use
  browser network throttling and disable cache. Do not clear stored data.
- **Inputs:** `/`, `/focus`; widths `1440`, `1024`, `768`, `390`, `320`;
  light/dark themes; reduced motion; an existing guest workspace.
- **Steps:** 1. Reload `/` with throttling and capture the initial loading
  UI. 2. Wait for hydration and capture the ready UI at the same width. 3.
  Repeat at each width and in both themes. 4. Reload `/focus`. 5. Tab through
  the loading view; check its screen-reader status announcement. 6. Repeat with
  reduced motion. 7. Reload without throttling.
- **Expected results:** loading has a circular timer outline, control
  placeholders, daily summary, and task placeholders; narrow widths stack in the
  same order as the real workspace. No invented time, counts, or task text. No
  placeholder receives focus or exposes a false control name. A concise loading
  status is available to assistive technology. Hydration removes all
  placeholders and preserves saved state. No overflow at 320px. Reduced motion
  stops placeholder animation. Fast loads have no artificial delay.
- **Evidence:** save and inspect paired screenshots under
  `qa-artifacts/loading/` and sanitized browser findings in
  `qa-artifacts/loading/results.txt`; use the existing ignored artifact folder.
- **Cleanup:** restore network, cache, viewport, and accessibility settings;
  stop only servers started for this case. Do not remove stored workspace data.
- **Status:** pending; browser QA has not run.

Coverage: loading hierarchy, responsiveness, theme, motion, accessible status,
and saved-state transition → QA-128. No HTTP, auth, database, or migration
contracts change; those categories are not applicable to this task. Native lint,
format, and owning web typechecks run during implementation. Production build
and browser checks remain deferred to the QA pass.

## Login navigation

### [ ] QA-129 — P1 — Signed-out login and signed-in account controls

- **Purpose:** show a Log in link instead of guest/account-check UI, and use a
  dedicated login page without changing OAuth or account ownership rules.
- **Prerequisites:** local app at `http://127.0.0.1:13001`; isolated signed-out
  browser and a test account with the existing configured OpenAuth issuer.
- **Inputs:** `/`, `/login`, `/auth/login`; API available and unavailable.
- **Steps:** 1. Open `/` signed out, including when the API is unavailable. 2.
  Select Log in. 3. Reload `/login` directly. 4. Select its sign-in action. 5.
  Complete existing issuer sign-in. 6. Open Account and use existing sync
  controls. 7. Log out and return to `/`. 8. Check keyboard navigation and phone
  layout on `/login`.
- **Expected results:** signed-out users see Log in, not Guest mode or Retry
  account check; no account-error dialog is exposed to them. Login is a real
  route with a page title, heading, issuer action, and return-to-timer link. The
  issuer action uses `/auth/login`; tokens remain server-side. Signed-in users
  keep sync, conflict, import, and logout actions. Failure does not falsely
  report sign-in success or expose another account's workspace.
- **Evidence:** inspect `qa-artifacts/login/signed-out.png`, `login.png`, and
  `qa-artifacts/login/results.txt`; omit credentials and tokens.
- **Cleanup:** log out of the isolated test account; restore network settings.
- **Status:** pending; runtime account QA has not run.

Coverage: signed-out header, dedicated login, existing OAuth entry, account
control regression, and unavailable API UI → QA-129. The session discovery
request remains necessary to detect existing sessions; this change removes its
signed-out UI, not server authentication checks.

## Local API environment

### [ ] QA-130 — P1 — Load root environment for native API development

- **Purpose:** prevent the missing DATABASE_URL error caused by a workspace
  command starting outside the root environment-file directory.
- **Prerequisites:** Bun, Rust, and a user-approved native PostgreSQL service; a
  private root `.env` with valid DATABASE_URL; required migrations already
  applied to that isolated target. No Podman or Docker is needed.
- **Inputs:** root `bun run dev`; direct `bun run --cwd apps/server dev`.
- **Steps:** 1. Stop any owned dev processes on ports 13001 and 18001. 2. Set
  DATABASE_URL in the root `.env` to the approved native database. 3. Run each
  command separately, from the repository root. 4. Stop each started process
  before the next command. 5. On an isolated copy, remove DATABASE_URL and
  repeat to check failure.
- **Expected results:** both commands load the root file; valid configuration
  starts the API on port 18001 without a missing-variable error. Missing or
  invalid values still fail safely. No secret value is logged. An unavailable
  database is reported as a connection failure, not a successful startup.
- **Evidence:** inspect sanitized startup output in
  `qa-artifacts/native-dev/startup.txt`; never save environment values.
- **Cleanup:** stop only owned processes; restore the isolated config copy.
- **Status:** blocked pending a user-approved native PostgreSQL target. The
  environment-file loading check is complete without opening a connection.

Coverage: workspace cwd, root env loading, safe missing configuration, and
native startup → QA-130. No database schema or production configuration changes.

## Error and offline pages

Setup: local app at `http://127.0.0.1:13001`. Use an isolated browser profile
and existing guest work; do not clear storage. Service-worker checks need an
approved production build and installed worker, not only the Vite dev page. Save
evidence under the existing ignored `qa-artifacts/error-pages/` directory. No
containers are required by these page changes.

### [ ] QA-131 — P1 — Unknown page recovery

- **Purpose:** provide a useful 404 without losing the workspace.
- **Prerequisites:** shared setup above; one saved local task.
- **Inputs:** `/missing-page-qa-131`; widths 1440, 768, 390, and 320.
- **Steps:** 1. Direct-load the missing URL. 2. Reload it. 3. Tab to Return to
  timer and activate it. 4. Repeat with dark theme and 200% zoom.
- **Expected results:** the page states Error 404 and Page not found; the timer
  link returns to `/`; the saved task remains. Focus is visible and content does
  not overflow. SSR returns a missing-page response, not a success page.
- **Evidence:** inspect `qa-artifacts/error-pages/404.png` and sanitized
  response status in `qa-artifacts/error-pages/results.txt`.
- **Cleanup:** restore viewport and zoom; keep saved work unchanged.
- **Status:** pending; browser and HTTP QA have not run.

### [ ] QA-132 — P1 — Global route error recovery

- **Purpose:** offer recovery without exposing internal error details.
- **Prerequisites:** shared setup; an isolated local route error triggered with
  browser developer tools. Do not add a committed failing route.
- **Inputs:** pause a route chunk request and fail it during navigation to
  `/reports`; if the browser cannot inject this error, record the case blocked.
- **Steps:** 1. Trigger the isolated route-load failure. 2. Inspect the error
  page and keyboard controls. 3. Restore the request and select Reload page. 4.
  Repeat the failure and select Return to timer.
- **Expected results:** the global error UI offers reload and full-document
  timer recovery; no stack, token, or provider data is printed. Recovery works
  after restoring the request. Saved workspace data stays unchanged.
- **Evidence:** inspect `qa-artifacts/error-pages/global-error.png` and the
  recovery details in `qa-artifacts/error-pages/results.txt`.
- **Cleanup:** remove only injected request failures; restore browser settings.
- **Status:** pending; error injection and recovery have not run.

### [ ] QA-133 — P1 — PWA offline fallback and recovery

- **Purpose:** show a complete offline document without claiming sync success.
- **Prerequisites:** approved production build, installed worker, and shared
  setup. Build and service-worker browser checks need QA approval.
- **Inputs:** `/offline.html`, then an uncached `/reports` navigation offline;
  widths 390 and 320; keyboard only; reduced motion.
- **Steps:** 1. Load the installed app online. 2. Go offline with browser
  developer tools and navigate to the uncached route. 3. Inspect its
  fallback. 4. Reconnect and select Try opening the timer. 5. Inspect saved
  local work.
- **Expected results:** offline title, icon, stylesheet, guidance, and recovery
  link render from local assets. The link requests `/`; saved work remains. No
  account check or guest-mode label is shown. The fallback stays noindex.
- **Evidence:** inspect `qa-artifacts/error-pages/offline.png` and the worker,
  offline navigation, and recovery results in `results.txt` in that folder.
- **Cleanup:** reconnect and restore browser settings; keep stored work.
- **Status:** pending; installed-worker QA has not run.

### [ ] QA-134 — P0 — Preserve private cache exclusions

- **Purpose:** ensure offline recovery does not cache account or auth content.
- **Prerequisites:** QA-133 installed-worker setup; an isolated signed-in test
  session; never use production credentials or print token values.
- **Inputs:** `/api/session`, `/api/workspace`, and `/auth/login`. Read
  workspace data through the existing typed client, which supplies the
  `X-Pomodoro-User` header for the isolated signed-in account.
- **Steps:** 1. Inspect worker cache entries after online account navigation. 2.
  Go offline and request API and auth paths. 3. Inspect responses and caches.
- **Expected results:** private JSON and authenticated HTML are not cached;
  API/auth requests do not return the offline HTML document. No sensitive data
  is written to the evidence. Existing worker exclusions remain effective.
- **Evidence:** sanitized cache path list and response content types in
  `qa-artifacts/error-pages/cache-exclusions.txt`; inspect every entry.
- **Cleanup:** restore connectivity and log out of the isolated session.
- **Status:** pending; service-worker security QA has not run.

Coverage: 404 → QA-131; global error recovery → QA-132; offline fallback,
reconnect, metadata, layout, and accessibility → QA-133; private/API/auth cache
isolation → QA-134. Service-worker caching policy is unchanged. Payment,
migration, and new integration checks are not applicable to these changes.

## Workspace detail polish

### [ ] QA-135 — P2 — Remove the global backup reminder

- **Purpose:** remove the footer reminder without removing backup controls.
- **Prerequisites:** local web app at `http://127.0.0.1:13001`; no API needed.
- **Inputs:** `/`, `/settings`, `/login`.
- **Steps:** 1. Open each route. 2. Inspect the footer. 3. Open Settings and
  inspect the existing backup controls. 4. Check any PWA update notice.
- **Expected results:** Export a backup in Settings is absent from the footer;
  settings backup controls and PWA update notices remain available.
- **Evidence:** inspect `qa-artifacts/polish/footer.png` and record findings in
  `qa-artifacts/polish/results.txt`; use the existing ignored artifact root.
- **Cleanup:** no data changes; restore the viewport if changed.
- **Status:** pending; runtime QA has not run.

### [ ] QA-136 — P1 — Daily summary hierarchy and responsive values

- **Purpose:** improve the daily summary while preserving its calculations.
- **Prerequisites:** same local app; isolated tasks and saved focus history.
- **Inputs:** empty workspace; task `Summary check` with estimate `2`; a saved
  focus session; 12h and 24h settings; widths 1440, 768, 390, and 320.
- **Steps:** 1. Inspect the empty summary. 2. Add the isolated task and select
  it. 3. Inspect sessions left and estimated finish. 4. Add focus history
  through the existing manual entry UI. 5. Repeat in both clock formats and
  themes. 6. Inspect the initial skeleton during a reload.
- **Expected results:** three aligned metrics with clear values and labels; each
  metric has supporting text. Empty finish has a clear unavailable value. Counts
  and time match the saved data; no new calculations or fake values. Phone
  layout reflows without narrow clipped columns; loading order matches.
- **Evidence:** inspect `qa-artifacts/polish/summary-{width}-{theme}.png` and
  record observed values in `qa-artifacts/polish/results.txt`.
- **Cleanup:** remove only the isolated task and manual entry; restore settings.
- **Status:** pending; responsive and runtime checks have not run.

### [ ] QA-137 — P1 — Simple centered login and OAuth entry

- **Purpose:** match the simple structure at
  `https://read.yopem.com/auth/login`.
- **Prerequisites:** local app at `http://127.0.0.1:13001`; isolated signed-out
  browser; configured issuer only for sign-in. Do not use production accounts.
- **Inputs:** `/auth/login`; widths 1440, 768, 390, 320; both themes; 200% zoom.
- **Steps:** 1. Direct-load and reload `/auth/login`. 2. Inspect the centered
  content. 3. Tab to the single sign-in button. 4. Activate it and inspect the
  existing `/auth/authorize` redirect. 5. Repeat at each width and theme. 6.
  Open `/` and confirm normal app navigation remains available.
- **Expected results:** plain full-height page with Welcome, one short sentence,
  and one login button. No split panel, decorative mark, header, or footer. No
  clipping; visible keyboard focus. Same-origin OAuth entry is unchanged; do not
  label the button Google without confirming this project's provider.
- **Evidence:** inspect `qa-artifacts/polish/login-{width}-{theme}.png` and
  sanitized redirect results in `qa-artifacts/polish/results.txt`.
- **Cleanup:** log out of the isolated session and restore browser settings.
- **Status:** pending; reference inspected, local browser and OAuth QA not run.

Coverage: footer request → QA-135; summary hierarchy and calculations → QA-136;
login redesign and existing issuer entry → QA-137. No database, migrations, API
contract, cache policy, or account ownership changes are in scope.

### [ ] QA-138 — P0 — Login page and OAuth route separation

- **Purpose:** serve the login page at `/auth/login` without losing OAuth
  protections, backend errors, or private-response cache exclusions.
- **Prerequisites:** isolated local web and API, configured issuer for
  successful redirects; no production data. Deployment proxy must route the
  login page to web SSR before forwarding the other `/auth/*` paths to Axum.
- **Inputs:** `/auth/login`, `/auth/login/`, `/auth/login?example=1`,
  `/auth/authorize`, `/auth/callback`, `/auth/logout`, `/auth/unknown`.
- **Steps:** 1. Direct-load each login URL through the web origin and inspect
  HTML. 2. Use the header Log in link from `/`. 3. Submit the login button and
  inspect the redirect to the configured issuer through `/auth/authorize`. 4.
  Repeat with authentication unconfigured and inspect the API error. 5. Request
  callback without a valid challenge; confirm rejection. 6. Inspect rate
  limiting and private/no-store response headers for the OAuth paths. 7. Repeat
  through the deployment proxy and installed service worker.
- **Expected results:** login URLs render noindex HTML with one sign-in button;
  no automatic issuer redirect. OAuth starts only through `/auth/authorize`;
  invalid callbacks fail safely; unavailable auth returns 503 JSON. Existing
  rate limits, PKCE, state, cookies, return-path validation, and API errors
  remain enforced. Unknown auth endpoints return backend 404, not HTML. The
  service worker does not cache login HTML or OAuth responses.
- **Evidence:** inspect sanitized responses and redirects in
  `qa-artifacts/polish/auth-routing.txt`; exclude cookies and OAuth codes.
- **Cleanup:** remove the isolated session and stop only owned QA processes.
- **Status:** pending; local routing, issuer, and cache checks have not run.

Coverage addition: canonical login URL, proxy routing, OpenAPI, OAuth error and
security regressions → QA-138.

### [ ] QA-139 — P1 — SSR login exception and backend fallback

- **Purpose:** fix Backend route is unavailable on the new login page without
  allowing other backend paths to reach frontend HTML.
- **Prerequisites:** existing isolated web origin at `http://127.0.0.1:13001`;
  use the same cases against Bun SSR in a requested production-build QA pass. No
  database or issuer is needed to render the page.
- **Inputs:** `/auth/login`, `/auth/login/`, `/auth/login?example=1`,
  `/auth/login/extra`, `/auth/authorize`, `/auth/callback`, `/auth/unknown`,
  `/api/unknown`, and `/`.
- **Steps:** 1. Direct-load the three login URLs. 2. Confirm Welcome and one
  sign-in action. 3. Inspect response headers and body. 4. Request all remaining
  auth and API paths and confirm they do not render frontend HTML. 5. Open `/`
  and confirm the normal shell still renders.
- **Expected results:** exact login paths render the login route, not the
  Backend route is unavailable JSON error. Query strings do not change routing.
  HTML retains no-store, noindex, CSP, and request ID headers. Only the two
  exact login path forms bypass the SSR backend guard; unknown nested login
  paths and all other backend routes retain the existing rejection/proxy rules.
- **Evidence:** inspect sanitized bodies and headers in
  `qa-artifacts/polish/login-ssr-boundary.txt` and a login screenshot in
  `qa-artifacts/polish/login-ssr.png`.
- **Cleanup:** stop only processes started for this case; no data cleanup.
- **Status:** pending; source review identifies the cause, runtime QA not run.

Coverage addition: SSR backend-guard regression → QA-139; related routing and
OAuth cases QA-137 and QA-138 remain pending.

### [x] QA-140 — P1 — Nitro development API and login proxy

- **Purpose:** fix the reproduced login failure when Nitro handles requests
  before Vite's development proxy.
- **Prerequisites:** existing native web/API listeners at 13001 and 18001;
  Playwriter Pomodoro group; issuer configuration for a full login. No restart
  or new service without checking the existing process. No production writes.
- **Inputs:** `/auth/login`, `/health`, `/api/session`, `/openapi.json`,
  `/auth/authorize`, `/auth/unknown`.
- **Steps:** 1. Open login in Playwriter. 2. Observe the welcome and login
  button. 3. Request health/session/spec through the web origin and record safe
  response status and content type, without tokens or account fields. 4. Click
  the button. 5. Inspect the issuer page or safe error without recording OAuth
  query values. 6. If the browser already has a valid issuer session, verify
  return to the timer and signed-in account controls. Ask for user action if
  sign-in needs credentials or account selection. 7. Inspect unknown auth path
  rejection.
- **Expected results:** health/session/spec reach the listening Rust API, not
  the SSR Backend route is unavailable fallback. The login page remains HTML and
  its button starts OAuth. Cookies, return paths, query strings and methods
  retain their contracts. Unknown backend paths never return frontend HTML.
- **Evidence:** inspect `qa-artifacts/login-proxy/results.json` and sanitized
  screenshots in the same ignored directory. Never save OAuth URLs or cookies.
- **Cleanup:** remove only added network listeners; preserve existing sessions
  and processes. Do not clear storage or stop the user's dev servers.
- **Status:** passed on 2026-11-10 with native web/API at 13001/18001. Tested
  revision: `236073f` plus the source hashes saved in the report. Health,
  readiness, session and OpenAPI returned 200 through the web origin; both login
  paths returned 200 no-store/noindex HTML. Unknown auth returned 404 JSON. The
  user completed Google selection; Playwriter confirmed timer return,
  authenticated session, Account control and persistence after reload. Inspected
  `qa-artifacts/login-proxy/results.json`, `account-button.png`,
  `login-page.png`, and `migration.txt`. The user approved the exact database
  target and existing up migration; no reset, down or manual data edit ran.
  Backend transport now uses Nitro devProxy, before the SSR fallback.

Coverage addition: native development transport and real login entry → QA-140.

### [x] QA-141 — P1 — Login button under the existing CSP

- **Purpose:** start OAuth through actual pointer and keyboard activation, not
  only direct navigation. Preserve the restrictive form-action policy.
- **Prerequisites:** QA-140 transport and schema setup; existing Pomodoro
  Playwriter group and native web/API servers; no production data changes.
- **Inputs:** `/auth/login`, Log in with Yopem button, pointer click and Enter.
- **Steps:** 1. Open the login route. 2. Click its button and record the OAuth
  endpoint status and destination origin/path without query values. 3. Return to
  the login page and activate the button with Enter. 4. Inspect browser
  securitypolicyviolation events and the existing response CSP. 5. Return to the
  timer without logging out or changing workspace data.
- **Expected results:** each real activation reaches `/auth/authorize`, gets 303
  and reaches the issuer/Google chooser; no form-action violation occurs. CSP
  remains unchanged. The existing signed-in session survives reload.
- **Evidence:** sanitized observations in
  `qa-artifacts/login-proxy/button-results.json`; no OAuth queries or names.
- **Cleanup:** remove only added event listeners, preserve user sessions, and
  leave the timer open. Temporary challenge records expire by existing rules.
- **Status:** passed on 2026-11-10. Tested revision: `236073f` plus the source
  hashes in `qa-artifacts/login-proxy/button-results.json`. Real pointer and
  Enter activation each returned 303 from `/auth/authorize` and reached Google's
  chooser. No form-action block occurred with the new top-level navigation; the
  response CSP was not changed. The signed-in session remained valid after
  reload. Inspected the sanitized JSON report. Removed added listeners and
  closed only the extra QA tab. Existing app tab, user session, storage,
  workspace data and dev processes were preserved.

Coverage addition: real pointer/keyboard login activation and CSP → QA-141.

## Account menu and Settings redesign

Shared setup: use the existing native web/API at `http://127.0.0.1:13001`
and 18001. Use the signed-in Pomodoro Playwriter group. Do not restart servers,
clear storage, log out, or replace backups during visual QA. Save sanitized
evidence under ignored `qa-artifacts/account-settings/`. Use no production
workspace records. Record unknown fixture prerequisites instead of guessing.

### [ ] QA-142 — P1 — Account dropdown and recovery actions

- **Purpose:** replace the account modal trigger with a compact action menu
  while retaining sync, import, conflict and logout safeguards.
- **Prerequisites:** shared setup; signed-in account. A separate isolated
  profile/fixture is required for destructive and conflict outcomes.
- **Inputs:** Account trigger, Settings link, Account details item, Log out;
  1440, 768, 390 and 320 widths; pointer, Enter, arrow keys and Escape.
- **Steps:** 1. Open the menu by pointer and keyboard. 2. Inspect status and
  item labels. 3. Follow Settings and verify the route. 4. Open account/sync,
  inspect existing sync/import feedback, close and inspect focus return. 5. Open
  logout confirmation, cancel it and verify the session is unchanged. 6. Repeat
  narrow layouts and both themes. 7. On an isolated fixture, check
  offline/retry, stale owner, guest import and conflict confirmation behavior
  against the existing captured-owner contract.
- **Expected results:** anchored menu fits the viewport; meaningful accessible
  names and keyboard operation; Settings navigates directly. Advanced sync
  workflows retain their confirmation and expected-version checks. Escape and
  cancel return focus without logging out or changing workspace data. Signed-out
  users still see only the Log in link.
- **Evidence:** inspect sanitized menu screenshots and action outcomes in
  `qa-artifacts/account-settings/menu-results.json`; omit names and IDs.
- **Cleanup:** cancel destructive dialogs, close only extra QA tabs, restore
  viewport/theme. Do not alter the existing session or workspace.
- **Status:** Partial on 2026-11-10. Pointer and ArrowDown opening, Settings
  navigation, account-dialog focus return, logout cancellation and Escape focus
  return passed. The 320px menu fits the viewport. Full theme/zoom and isolated
  recovery checks remain pending. Evidence:
  `qa-artifacts/account-settings/menu-results.json`; tested source hashes and
  parent revision are in that file.

### [ ] QA-143 — P1 — Settings organization and save workflow

- **Purpose:** organize settings into clear sections without changing field
  values, validation, sync ownership, or the backup workflow.
- **Prerequisites:** shared setup; record current settings before any edit.
  Backup replacement and stale-owner tests need a separate isolated workspace.
- **Inputs:** `/settings`; actual timer, appearance, sound and notification
  settings; focus duration 0, 1, 25 and 181; widths 1440, 768, 390 and 320.
  Confirm implementation bounds before entering boundary values.
- **Steps:** 1. Direct-load Settings. 2. Use section navigation by keyboard. 3.
  Inspect field labels, help text, headings and saved/draft feedback. 4. Edit
  one non-destructive preference and save; reload and confirm it. 5. Restore the
  original value and save. 6. Enter invalid values, blur and submit; inspect
  errors and first-invalid-field focus. 7. Inspect backup placement without
  importing or replacing live data. 8. Repeat both themes and narrow widths. 9.
  Use an isolated fixture for stale baseline/owner save rejection, active timer
  changes, invalid backup and restore cancellation.
- **Expected results:** grouped fields, consistent edges and a clear save
  action; no horizontal overflow or hidden errors; all existing controls stay
  reachable. Only valid submitted changes persist. Invalid or stale saves leave
  stored settings unchanged. Backup retains owner/version safeguards.
- **Evidence:** inspect sanitized screenshots and results in
  `qa-artifacts/account-settings/settings-results.json`; never save backup data.
- **Cleanup:** restore changed preferences, cancel confirmations, remove only
  isolated fixtures and restore viewport/theme.
- **Status:** partial on 2026-11-10. Save/reload/restore each passed through
  automatic PUT 200 requests. Focus duration 0 shows a field error and focuses
  the invalid input. Keyboard backup-section navigation passed. Desktop and
  390px images were inspected; 320/768/1440px DOM checks show no horizontal
  overflow. Other numeric boundaries, backup replacement and notification
  permission checks remain pending. Evidence and tested source hashes:
  `qa-artifacts/account-settings/`.

### [ ] QA-144 — P0 — Confirmation trigger composition

- **Purpose:** retain captured target/data/owner and pending/error behavior if
  ConfirmAction gains menu trigger composition.
- **Prerequisites:** shared setup; safe cancel checks on the active account;
  separate isolated tasks and two-owner fixture for actual destructive checks.
- **Inputs:** menu Log out, existing task delete/clear and reset confirmations.
- **Steps:** 1. Open each confirmation and cancel by button and Escape. 2.
  Inspect focus return. 3. On isolated data, confirm one delete and inspect its
  exact result. 4. Change ownership while a confirmation is open and verify
  rejection. 5. Trigger a known isolated save failure and inspect retry
  feedback, without changing validation rules or production services.
- **Expected results:** custom triggers change only presentation; existing
  confirmation callers keep their behavior. Cancel never mutates data. Duplicate
  pending confirmations and stale-owner writes remain rejected. Errors stay
  visible and a pending mutation cannot be dismissed incorrectly.
- **Evidence:** sanitized outcomes in
  `qa-artifacts/account-settings/confirmation-results.json`.
- **Cleanup:** remove only isolated fixtures; preserve the current user session.
- **Status:** partial on 2026-11-10. Logout opens from the native-button menu
  trigger. Cancel leaves the session intact and returns focus to Log out; Escape
  then returns focus to Account. Capture and duplicate-submit code is unchanged.
  Cross-owner, repeated-submit and destructive default-trigger scenarios need
  isolated fixtures. Evidence and tested source hashes:
  `qa-artifacts/account-settings/menu-results.json`.

Coverage: menu/navigation/focus → QA-142; settings/save/backup/validation →
QA-143; shared confirmation safety → QA-144. No backend schema, authentication
protocol, PWA caching, payments, deployment or analytics changes are planned.

### [x] QA-145 — P1 — Automatic workspace sync without a manual control

- **Purpose:** make existing automatic sync clear and remove routine manual
  synchronization from the signed-in account interface.
- **Prerequisites:** existing signed-in Pomodoro browser and native services;
  record current First day of week before the reversible preference change.
- **Inputs:** `/settings`, First day of week, Save settings, Account details.
  Choose Monday if the original is Sunday; otherwise choose Sunday.
- **Steps:** 1. Inspect Account details and confirm no normal Sync now
  button. 2. Change First day of week and save settings. 3. Observe the
  automatic `/api/workspace` PUT and safe status feedback without clicking a
  sync action. 4. Reload and confirm the preference. 5. Restore the original
  preference, save and observe a second automatic write. Reload and verify
  restoration. Offline recovery is QA-146. Conflict safeguards are QA-144.
- **Expected results:** normal saves sync automatically without a manual sync
  action. The normal account dialog has no Sync now or Retry sync button. All
  changes saved identifies the clean state. The changed preference and the
  restored original preference each persist after reload. The signed-in session
  remains intact.
- **Evidence:** inspect sanitized request statuses and preference restoration in
  `qa-artifacts/account-settings/autosync-results.json`; omit request bodies,
  user IDs, authentication headers, cookies and backup contents.
- **Cleanup:** restore the recorded preference and network setting; remove only
  listeners added for this case. Preserve user session and workspace.
- **Status:** passed on 2026-11-10 against the source hashes and parent revision
  in `autosync-results.json`. Two automatic PUT responses returned 200. The
  changed preference survived reload; the original Monday value also survived
  reload after restoration. No manual sync action was used. The signed-in
  session remains intact. Evidence was inspected.

Coverage addition: existing autosave contract and routine manual-control removal
→ QA-145. Offline retry is QA-146. Conflict safeguards remain part of QA-144.

### [ ] QA-146 — P1 — Automatic recovery and conditional retry

- **Purpose:** verify the retry-only UI when automatic sync cannot reach the
  API.
- **Prerequisites:** shared setup and a separate isolated signed-in profile. Do
  not change network state for the live user profile or other project tabs.
  Record the original First day of week.
- **Inputs:** `/settings`, Monday and Sunday, Account details, Retry sync.
- **Steps:** 1. Set only the isolated tab offline with page-scoped browser
  tools. 2. Change First day of week and save. 3. Open Account details and
  inspect offline/error feedback and Retry sync. 4. Restore the connection and
  observe automatic recovery. 5. Reload, inspect the saved preference, open
  Account details, and confirm Retry sync is absent in the saved state. 6.
  Restore the original preference and confirm automatic saving.
- **Expected results:** changes remain on the device during failure. Retry sync
  appears only for offline/error. Reconnection starts recovery without a routine
  manual sync action. Saved status appears only after successful persistence. No
  repeated write loop or automatic conflict overwrite occurs.
- **Evidence:** save sanitized statuses and results in
  `qa-artifacts/account-settings/offline-recovery.json`; omit bodies and IDs.
- **Cleanup:** restore the original preference and the isolated tab's network
  state. Remove only listeners added for this case.
- **Status:** blocked; an isolated signed-in recovery fixture is required.

Account/Settings validation record, 2026-11-10: scoped native format/lint, web
app/tools/service-worker typechecks and production web build passed. The build
artifact and `qa-artifacts/account-settings/build.log` were inspected. Browser
emulation was reset and the original preference was restored. The existing
LoginRoute code-splitting warning remains. Screenshot automation was
intermittent; only saved desktop/mobile captures were reviewed. No full visual
skill gate, screen-reader pass or destructive backup/conflict run is claimed.

### [x] QA-147 — P2 — Lazy login route and metadata

- **Purpose:** remove the LoginRoute code-splitting warning without changing the
  login page, URL, CSP-safe navigation or noindex metadata.
- **Prerequisites:** existing native web/API services and project browser tab.
  Preserve the signed-in session and do not complete a new OAuth flow.
- **Inputs:** `/auth/login`, `/auth/login/`, Welcome, Log in with Yopem.
- **Steps:** 1. Direct-load each login URL. 2. Inspect the Welcome heading, one
  login action and noindex/nofollow metadata. 3. Inspect the rendered action and
  retained `/auth/authorize` page-navigation handler in source. 4. Reload the
  app and inspect new console logs for the old LoginRoute code-splitting
  warning. 5. Run scoped lint/format, web typecheck and build.
- **Expected results:** login UI loads from its lazy route. The metadata stays
  in the eager route. Both URLs render and no LoginRoute export warning is
  produced. Existing session, backend routing and OAuth behavior stay unchanged.
- **Evidence:** sanitized results and source hashes in
  `qa-artifacts/account-settings/login-lazy-results.json`, plus build log.
- **Cleanup:** return the same tab to Settings and keep the session.
- **Status:** passed on 2026-11-10 against source hashes in the evidence. Both
  URLs load Welcome and exactly one action; slash normalizes to the canonical
  path. Noindex metadata remains and fresh logs contain no LoginRoute split
  warning. Native checks and production build passed. UI and navigation handler
  are unchanged. OAuth callback/security coverage remains in the existing
  authentication cases; this case does not claim that coverage.

### [x] QA-148 — P1 — Invalid backup cannot replace the workspace

- **Purpose:** verify safe backup validation in the reorganized Settings page.
- **Prerequisites:** existing Settings tab; do not submit a valid restore or
  write a backup with personal data. Use in-memory file inputs only.
- **Inputs:** `invalid.json` containing `{`; `wrong-shape.json` containing `{}`;
  `invalid-utf8.json` bytes `ff`; `too-large.json` with 10,485,761 safe bytes.
- **Steps:** 1. Record visible settings and monitor workspace PUT responses. 2.
  Upload each input through Backup JSON file. 3. Inspect the specific validation
  error and verify no replacement confirmation becomes available. 4. Reload
  Settings and confirm the same visible settings and session.
- **Expected results:** malformed JSON, unsupported shape, invalid UTF-8 and
  over-10-MB files are rejected before replacement. No workspace PUT occurs. No
  raw backup data or private identifiers appear in errors or artifacts.
- **Evidence:** input names/sizes, sanitized error strings and write count in
  `qa-artifacts/account-settings/backup-validation-results.json`.
- **Cleanup:** reload to clear the file input and remove only the added response
  listener. Do not change existing user records.
- **Status:** Passed on 2026-11-10 against source hash and parent revision in
  the evidence. All four invalid files were rejected without a dialog or
  workspace write. New file selection cleared old errors. Reload retained the
  original focus value and signed-in account. Valid replacement and owner-race
  tests remain QA-144.

### [ ] QA-149 — P1 — Numeric Settings draft boundaries

- **Purpose:** finish numeric validation checks without writing preferences.
- **Prerequisites:** existing Settings tab; record the original focus value.
- **Inputs:** Focus minutes values `0`, `1`, `180`, `181`, empty and `1.5`.
- **Steps:** 1. Monitor workspace PUTs. 2. Enter each value and blur. 3. Inspect
  aria-invalid and the linked error. 4. Submit only invalid values and verify
  focus returns to Focus minutes. 5. Restore the original input without saving
  and reload to verify the persisted preference is unchanged.
- **Expected results:** 1 and 180 are valid; 0, 181, empty and non-integer 1.5
  show errors. Invalid submits do not write. Every error is connected through
  aria-describedby; the first invalid field receives focus.
- **Evidence:** sanitized validation flags/errors, focused control IDs and
  no-write count in `qa-artifacts/account-settings/numeric-results.json`.
- **Cleanup:** restore original draft, reload and remove the response listener.
- **Status:** pending. This case does not submit valid boundary changes.

### [x] QA-150 — P1 — Valid backup review and cancellation

- **Purpose:** retain the destructive confirmation for a valid backup while
  rejecting malformed files before that prompt.
- **Prerequisites:** use `createEmptyWorkspace` from the existing focus schema
  to create an empty local fixture under ignored
  `qa-artifacts/account-settings/`. Never export private user data or confirm
  replacement of the live workspace.
- **Inputs:** `empty-workspace.json`, generated with the existing helper.
- **Steps:** 1. Monitor workspace PUT responses. 2. Select the fixture in
  Settings and click Import backup. 3. Inspect Replace workspace and its
  warning. 4. Cancel and inspect closed state and focus return to Import
  backup. 5. Repeat and press Escape; inspect the same focus return. 6. Reload
  and inspect the original visible preference and account control.
- **Expected results:** valid data reaches explicit confirmation, but Cancel and
  Escape do not replace or sync the workspace. The original preference and
  signed-in session remain. Existing restore guards remain in source.
- **Evidence:** sanitized outcomes and source hashes in
  `qa-artifacts/account-settings/backup-cancel-results.json`.
- **Cleanup:** reload to clear selected file; remove only the added listener.
  Keep the safe empty fixture ignored for a repeat run.
- **Status:** Passed on 2026-11-10 against source hash and parent revision in
  the evidence. The safe empty fixture reached confirmation. Cancel and Escape
  both closed it and returned focus to Import backup. No workspace PUT occurred;
  reload retained the original preference and account. Actual replacement
  remains blocked on isolated data.

### [x] QA-151 — P1 — Settings saved status follows the current draft

- **Purpose:** never show Settings saved for edits that were not submitted.
- **Prerequisites:** existing signed-in Settings tab; record original week
  preference and focus value. Use reversible preferences only.
- **Inputs:** First day of week Monday/Sunday and original focus value + 1.
- **Steps:** 1. Toggle week preference and save; wait for automatic PUT 200. 2.
  Inspect Settings saved. 3. Edit Focus minutes without saving and inspect
  Unsaved changes. 4. Restore focus draft without saving. 5. Restore original
  week value, save, reload and verify restoration.
- **Expected results:** success feedback describes only the last saved values. A
  new edit shows Unsaved changes. Original preferences are retained at end.
- **Evidence:** `qa-artifacts/account-settings/settings-draft-results.json`;
  sanitized statuses only, no private workspace content.
- **Cleanup:** restore original preferences and remove the added listener.
- **Status:** passed, 2026-11-10, native dev browser. Saved feedback clears for
  a new draft; local save and later cloud PUT 200 pass. Evidence:
  settings-draft-results.json and select-results.json under
  qa-artifacts/account-settings/. Source hashes identify the tested working
  tree.

### [ ] QA-152 — P1 — Explicit reload after an external Settings change

- **Purpose:** recover a stale form baseline without silently dropping drafts.
- **Prerequisites:** existing signed-in project tab and one owned peer tab in
  the same project group; no new profile, account, server or database. Record
  original focus and week values. This non-destructive peer case is allowed by
  shared setup. Keep all unrelated preferences unchanged.
- **Inputs:** current draft Focus minutes + 1; peer First day of week toggle.
- **Steps:** 1. Keep an unsaved focus draft in the main tab. 2. In the peer,
  change only First day of week and save. 3. Observe main-tab external-change
  feedback and disabled stale Save; verify draft remains. 4. Click Reload
  settings explicitly and verify current settings replace the old draft. 5. Save
  a reversible preference change successfully, restore originals and reload. 6.
  Close only the owned peer tab.
- **Expected results:** external changes do not silently discard a dirty draft.
  Reload refreshes values and expected baseline. Subsequent Save succeeds. Owner
  guards remain; account transitions remount both Settings and backup controls
  so drafts and selected files do not cross owners.
- **Evidence:** `qa-artifacts/account-settings/settings-external-results.json`;
  source hashes, safe field values, request statuses and restoration result.
- **Cleanup:** restore all changed preferences, close the owned peer and remove
  only added listeners. Preserve session and other tabs.
- **Status:** partial, 2026-11-10. Peer local change preserves main draft 26,
  disables stale Save and exposes Reload. Reload updates the baseline and resets
  focus to 25. Later saves and original Monday restoration return PUT 200.
  Initial peer PUT observer timed out at 12s; a repeat peer did not regain
  Account in 8s. Do not claim peer cloud-write verification. Evidence:
  settings-external-results.json. Original values retained; owned peer closed.

### [ ] QA-153 — P1 — Settings loading skeleton

- **Purpose:** replace plain loading text with layout-matched Yopem skeletons.
- **Prerequisites:** existing project tab and services. Preserve session and
  preferences. Use only page-scoped script delay for the loading observation;
  release every held request and remove only the added route handler.
- **Inputs:** `/settings`, widths 1440/768/390/320, both color schemes and
  reduced motion. Existing loaded Settings layout is the reference.
- **Steps:** 1. Inspect server HTML for Loading settings and skeleton markup. 2.
  Delay scripts in only this tab and load Settings. 3. Inspect sidebar,
  field-card, toggle-row, save-area and backup placeholders, one loading
  announcement, aria-hidden placeholders and absence of fake inputs/values. 4.
  Inspect narrow layout and reduced-motion styles. 5. Release scripts and verify
  real labelled controls replace placeholders; loading announcement
  disappears. 6. Restore browser emulation and inspect retained preferences.
- **Expected results:** placeholders match the loaded structure and responsive
  breakpoints. No horizontal overflow or focusable placeholder controls. One
  polite loading announcement remains outside hidden decorative content. Reduced
  motion suppresses shimmer. Hydration retains session and values.
- **Evidence:** sanitized screenshots, source hashes, structural counts and
  hydration outcomes in `qa-artifacts/account-settings/loading-results.json`.
- **Cleanup:** release held script requests, unregister only the owned handler,
  restore emulation and keep the original tab and user session.
- **Status:** partial after the backup layout change. The full loading pass at
  697acd7 remains recorded in loading-results.json. The backup placeholder now
  matches the stacked export/restore layout; repeat its visual and hydration
  checks with QA-155 before treating that changed region as passed.
  placeholders, single announcement, both themes, reduced motion and replacement
  on hydration pass. Loading screenshots and loading-results.json inspected.
  Existing inline-style CSP warning remains a separate open issue.

### [x] QA-154 — P1 — Settings uses Yopem Select

- **Purpose:** replace native Settings dropdowns with installed Yopem Select
  without changing accepted values or saving behavior.
- **Prerequisites:** existing Settings tab and account; record original
  preferences. Use only reversible draft selections until the save case.
- **Inputs:** Alarm Bell/Chime; Focus sound None/Rain; the existing seven
  colors; Theme System/Light/Dark; week Monday/Sunday/Saturday; 12/24-hour.
- **Steps:** 1. Inspect labels and displayed current values for all eight
  selects. 2. Open by pointer and keyboard, navigate options and select a
  reversible value. 3. Escape without a choice and verify focus returns. 4.
  Confirm draft status and no write before Save. 5. Save a reversible week
  preference, observe automatic PUT 200 and reload. 6. Restore the original
  preference and inspect narrow popup bounds and theme contrast.
- **Expected results:** real Yopem combobox/listbox controls, proper labels,
  selected-value text, keyboard support and focus return. Values remain
  schema-validated. Blur/submit validation remains; no native select remains in
  Settings. Save and automatic sync preserve existing contracts.
- **Evidence:** sanitized role/value/focus/write results and screenshots in
  `qa-artifacts/account-settings/select-results.json`.
- **Cleanup:** restore changed preferences, close popups and restore emulation.
- **Status:** passed, 2026-11-10, native dev browser. Eight labelled Yopem
  comboboxes replace native selects. Pointer/keyboard/focus, both theme
  screenshots, Sunday PUT 200, remote read and reload pass. Monday restored with
  PUT 200 and remote read. Evidence: select-results.json and
  select-320-final/light.png.

### [ ] QA-155 — P1 — Backup file selection panel

- **Purpose:** replace the raw file input with a clear, accessible selection
  panel. Keep preflight checks and the separate restore confirmation.
- **Prerequisites:** existing Settings tab. Use only local in-memory fixtures or
  `qa-artifacts/account-settings/empty-workspace.json`. Do not restore data.
- **Inputs:** the existing valid empty-workspace fixture; malformed `{"`;
  filename `a-very-long-backup-name-for-the-settings-layout.json`; no file.
- **Steps:** 1. Open `/settings#settings-backup`. Inspect the empty panel and
  JSON/10 MB guidance. 2. Activate Choose file by pointer and keyboard; cancel
  the native picker and check focus. 3. Use the native input to select the valid
  fixture; inspect filename and size. 4. Change, remove, and reselect the same
  file. 5. Inspect Remove focus return and 320px wrapping in both themes. 6.
  Review malformed JSON and inspect the existing alert without a dialog. 7.
  Review the valid fixture and Cancel; inspect the retained selection,
  invoking-button focus and zero workspace writes. Do not confirm replacement.
- **Expected results:** visible Yopem controls open the native single-file
  picker; no fake drop affordance or immediate import. Labels and help remain
  available. Removing a selection never deletes a file or workspace data.
  Pending state blocks selection changes. Existing size, UTF-8, schema, owner,
  expected-workspace and confirmation checks remain intact.
- **Evidence:** sanitized screenshots and selection/focus/write results at
  `qa-artifacts/account-settings/upload-results.json`.
- **Cleanup:** remove the selected file, close only the owned confirmation,
  restore emulation and keep the original session and workspace unchanged.
- **Status:** pending. Final production build passes with no warnings or errors.
  Source review, scoped lint, format and all web typechecks pass. Native picker
  cancellation needs user observation if Chrome automation cannot inspect the
  operating-system picker.

## Select and calendar replacement

Task: replace native selects and report date inputs with Yopem Select and
Calendar. Affected routes: `/`, `/projects`, `/templates`, and `/reports`. Use
the shared isolated setup above. Do not use production data. Use a guest
workspace with two projects, `QA green` and `QA blue`, and one archived project.
Evidence goes in the ignored `qa-artifacts/` directory. Run P1 before P2.

Coverage: project/task/template selection: QA-156; report filtering and date
navigation: QA-157; session editing: QA-158; CSV export: QA-159; keyboard,
accessibility, layout, and theme regressions across controls: QA-160. Auth, API
contracts, payments, migrations, and external integrations are unchanged.

### [ ] QA-156 — P1 — Project selection and persistence

- **Purpose:** Preserve project color and task/template project choices.
- **Prerequisites:** Shared setup; isolated guest workspace and projects above.
- **Inputs:** Green and blue colors; active and archived projects; no project.
- **Steps:** 1. In `/projects`, create a green project and edit it to blue. 2.
  On `/`, add and edit a task with an active project, then select no project. 3.
  In `/templates`, create two tasks with distinct projects; change the second
  after removing the first. 4. Reload and inspect saved values. 5. Edit a task
  that already references the archived project.
- **Expected results:** Each saved color and project persists, including the
  correct remaining template task. No-project saves without an ID. The current
  archived task project remains visible; unrelated archived projects do not.
- **Evidence:** `qa-artifacts/QA-156-selects.png`; inspect selections and saved
  results without personal data.
- **Cleanup:** Delete only isolated QA tasks, templates, and projects.
- **Status:** pending.

### [ ] QA-157 — P1 — Report filters and local date

- **Purpose:** Preserve report project and local date filtering and URL state.
- **Prerequisites:** Shared setup; guest project and dated focus records.
- **Inputs:** 2024-02-29; all projects; no project; `QA green`.
- **Steps:** 1. Open `/reports`; select 2024-02-29 in the date calendar. 2.
  Select each project filter and move between periods. 3. Reload and use back
  and forward navigation.
- **Expected results:** Selected date and project appear in the controls and
  URL, relevant records and totals update, and navigation restores state. A
  local date does not shift to an adjacent day.
- **Evidence:** `qa-artifacts/QA-157-filters.png`; inspect date, filter, URL,
  and matching report results.
- **Cleanup:** Remove only isolated focus records and projects.
- **Status:** pending.

### [ ] QA-158 — P1 — Focus record date and project

- **Purpose:** Preserve focus record create and edit validation and assignment.
- **Prerequisites:** Shared setup; isolated guest workspace and active project.
- **Inputs:** 2024-02-29, task `QA focus`, 25 minutes, no project and QA green.
- **Steps:** 1. Open `/reports` and add focus time with the specified date and
  project. 2. Edit it and choose no project. 3. Open the date picker, choose
  Clear date, and submit. 4. Set the date again, save, and reload the report.
- **Expected results:** Saved date and project are correct after reload. Invalid
  required dates do not save, validation is announced, and focus reaches the
  invalid control. Editing does not create a duplicate record.
- **Evidence:** `qa-artifacts/QA-158-session.png`; inspect form feedback and
  saved report row.
- **Cleanup:** Delete the isolated record and project.
- **Status:** pending.

### [ ] QA-159 — P1 — CSV date range and options

- **Purpose:** Preserve date range, unit, delimiter and safe CSV export.
- **Prerequisites:** Shared setup; isolated dated records including a task named
  `=1+1`; browser downloads directed to ignored `qa-artifacts/`.
- **Inputs:** From 2024-02-28 through 2024-02-29; hours and tab; then an end
  date earlier than the start.
- **Steps:** 1. Open `/reports` and Download report. 2. Select the dates, hours
  and tab; download the CSV. 3. Reopen and select an end date before the start;
  submit. 4. Clear each date and submit. 5. Inspect the downloaded CSV.
- **Expected results:** CSV contains only in-range records, hours, tab-separated
  columns and an escaped formula-like task name. A reversed range or a cleared
  required date shows an error and does not download.
- **Evidence:** `qa-artifacts/QA-159-export.csv` and
  `qa-artifacts/QA-159-validation.png`; inspect values and error.
- **Cleanup:** Delete only the isolated records; retain sanitized evidence.
- **Status:** pending.

### [ ] QA-160 — P2 — Popup interaction and responsive layout

- **Purpose:** Preserve accessible select and calendar interaction in dialogs.
- **Prerequisites:** Shared setup; light and dark themes; desktop and 320 CSS
  pixel viewport; keyboard and screen reader.
- **Inputs:** Project, color, date, unit and delimiter controls on affected
  routes; Escape and arrow keys.
- **Steps:** 1. Use Tab and keyboard to open, change and dismiss each select and
  calendar, including within dialogs. 2. Check focus after Escape and after
  choosing a value. 3. Repeat at narrow width and in both themes.
- **Expected results:** Controls have labels and visible focus; arrows select
  options and dates; popups dismiss and restore focus; dialogs remain usable. No
  controls or calendar days are clipped or obscured.
- **Evidence:** `qa-artifacts/QA-160-keyboard.png`; inspect focus, labels and
  popup placement.
- **Cleanup:** Restore viewport and theme; remove isolated records.
- **Status:** pending.

## TanStack Form for report filters and backup selection

Task: migrate the immediately applied report filters and the backup restore file
selection to TanStack Form without changing their behavior. Affected files:
`apps/web/src/features/reports/components/report-filters.tsx`,
`apps/web/src/features/settings/components/workspace-backup.tsx`, and
`apps/web/src/features/settings/components/backup-file-picker.tsx`. Routes:
`/reports/` and `/settings#settings-backup`. Use the shared isolated setup
above, the existing `13001` web port, installed Bun and the repository lockfile.
Use an isolated guest workspace, not production data. Save only sanitized
artifacts under ignored `qa-artifacts/`. Run P0 cases first. These cases are
pending; written plans are not runtime evidence. Existing QA-155 and QA-157 also
cover related behavior. No API, payments, SEO, or migration contract is changed
by this task.

Coverage: backup data and identity safety: QA-161 and QA-162; backup picker,
validation and confirmation: QA-162 and QA-163; URL state, periods and
navigation: QA-164, QA-165, and QA-167; accessibility, pending and errors:
QA-163 and QA-165; static tooling: QA-166.

### [ ] QA-161 — P0 — Restore remains bound to the reviewed workspace

- **Purpose:** prevent a pending restore or corrupt recovery from replacing a
  different workspace or account after the user reviews a backup.
- **Prerequisites:** shared isolated setup; two isolated guest/account owners if
  available; a valid isolated empty workspace backup; never use production. If
  safe owner switching or the fixture is unavailable, mark the case blocked.
- **Inputs:** the isolated valid JSON backup and a different workspace with a
  uniquely named task `QA restore guard`.
- **Steps:** 1. From `/settings#settings-backup`, select the fixture and choose
  Import backup. 2. Before confirming, change the workspace or owner through an
  isolated second tab. 3. Confirm the first dialog. 4. Repeat with Recover
  corrupt workspace only against an isolated corrupt fixture.
- **Expected results:** stale confirmation fails closed; no replacement crosses
  owners or overwrites changed data; an actionable error is visible. Recovery
  retains corrupt data as specified by the existing workflow.
- **Evidence:** `qa-artifacts/QA-161-restore-guard.txt`, sanitized owner-change,
  alert, and before/after data checks; inspect for absence of a write.
- **Cleanup:** close owned dialogs and tabs; remove only isolated fixtures.
- **Status:** pending.

### [ ] QA-162 — P1 — Backup selection and confirmation lifecycle

- **Purpose:** preserve select, replace, remove, reselect, cancel and confirm
  behavior after migration.
- **Prerequisites:** shared setup; isolated guest workspace and a valid exported
  backup saved under `qa-artifacts/`; backup the isolated current state first.
- **Inputs:** the valid backup file and no file.
- **Steps:** 1. Open `/settings#settings-backup`; choose, change and remove the
  file, then reselect it. 2. Choose Import backup and Cancel. 3. Review again
  and confirm replacement only in the isolated workspace. 4. Reload Settings.
- **Expected results:** filename and size track the selection; removal returns
  focus; cancel retains selection and does not write; successful replacement
  clears selection and displays success; restored contents survive reload.
- **Evidence:** `qa-artifacts/QA-162-backup-lifecycle.txt` and
  `qa-artifacts/QA-162-backup-lifecycle.png`; inspect focus, dialog, and data.
- **Cleanup:** restore only the isolated workspace backup and close owned tabs.
- **Status:** pending.

### [ ] QA-163 — P1 — Invalid backups do not reach confirmation

- **Purpose:** preserve boundary validation, pending state and accessible error
  feedback for the migrated file field.
- **Prerequisites:** shared isolated setup and a guest workspace with a known
  task; prepare local files in ignored `qa-artifacts/`.
- **Inputs:** invalid JSON `{`, valid JSON `{}`, invalid UTF-8 bytes, and a file
  larger than 10 MiB; also cancel the file chooser without selecting.
- **Steps:** 1. Choose each invalid file on `/settings#settings-backup` and
  activate Import backup. 2. Observe alerts, dialog state, and workspace. 3.
  During file reading check that selection and action controls are disabled. 4.
  Use keyboard to choose and remove a file and inspect focus and labels.
- **Expected results:** each invalid file produces the existing relevant error,
  no confirmation or workspace write; cancellation does not import; pending
  controls are disabled, accessible labels and focus behavior remain intact.
- **Evidence:** `qa-artifacts/QA-163-backup-errors.txt` and
  `qa-artifacts/QA-163-backup-errors.png`; inspect errors and unchanged data.
- **Cleanup:** remove isolated inputs and selection; keep sanitized evidence.
- **Status:** pending.

### [ ] QA-164 — P1 — Report filters synchronize with URL navigation

- **Purpose:** preserve immediately applied report filters, paging reset, and
  back/forward and direct-link synchronization.
- **Prerequisites:** shared setup; isolated guest project `QA green` and dated
  focus records with and without a project; existing `/reports/` route.
- **Inputs:** date 2024-02-29, day/week/month/year, QA green, No project, and
  All projects; use the existing report pagination controls when available.
- **Steps:** 1. Open `/reports/`, select each period, set the date, then each
  project filter. 2. Change the filter after moving to another history page. 3.
  Use previous and next period, reload, then browser Back and Forward. 4. Open
  the resulting URL directly in an owned tab.
- **Expected results:** each action updates the URL and matching rows and totals
  without a submit button; page returns to 1; date remains local; controls match
  the URL after direct navigation, reload, Back and Forward.
- **Evidence:** `qa-artifacts/QA-164-report-filters.txt` and
  `qa-artifacts/QA-164-report-filters.png`; inspect URL, controls and records.
- **Cleanup:** delete only isolated records/project and close the owned tab.
- **Status:** pending.

### [ ] QA-165 — P1 — Report filter keyboard and failure handling

- **Purpose:** retain keyboard interaction, pending controls and safe handling
  of invalid or failed navigation without stale values.
- **Prerequisites:** shared setup; a way to simulate navigation failure without
  production changes. If unavailable, mark the failure subcase blocked.
- **Inputs:** an invalid date in a direct URL; keyboard Tab, arrows, Enter and
  Escape; rapid date/project/period changes.
- **Steps:** 1. Use keyboard on date and project controls on `/reports/`. 2.
  Navigate to `/reports/?date=2024-02-30`. 3. Rapidly change filters and inspect
  the displayed value against the URL. Attempt two Next period actions before
  the control disables. 4. Simulate a failed navigation and inspect the alert
  and recovery with a valid selection.
- **Expected results:** labels and focus remain usable; invalid values do not
  become accepted filter state; pending controls block conflicting actions;
  accepted consecutive Next actions advance two periods. Errors are announced
  and a later valid action recovers without stale values. See QA-167 for the
  queued navigation regression.
- **Evidence:** `qa-artifacts/QA-165-filter-errors.txt` and
  `qa-artifacts/QA-165-filter-focus.png`; inspect URL, alert and focus.
- **Cleanup:** restore normal navigation and close only owned tabs.
- **Status:** pending.

### [ ] QA-166 — P2 — Static checks for the migrated workflows

- **Purpose:** check lint, formatting and web types without executing QA.
- **Prerequisites:** repository root with installed dependencies and Bun canary.
- **Inputs:** the changed files and their owning web TypeScript projects.
- **Steps:** 1. From the repository root run `bun run lint` and
  `bun run format:check`. 2. Run `bun run typecheck` after reviewing its
  tasks. 3. With separate approval, review the React Doctor regression check
  command and its package requirements before running it against the changed
  files.
- **Expected results:** commands pass with no new diagnostics; the standard
  checks do not run tests, deploy, or connect to application services.
- **Evidence:** `qa-artifacts/QA-166-static-checks.txt`; inspect exit status and
  diagnostics. If execution is not requested, record command results separately.
- **Cleanup:** none; keep sanitized evidence.
- **Status:** pending.

### [ ] QA-167 — P1 — Queued report moves use the current URL

- **Purpose:** prevent two accepted period actions from using the same starting
  date and verify navigation across a month boundary.
- **Prerequisites:** shared isolated setup; an owned Playwriter tab in the
  project tab group; web app at `http://localhost:13001`; no production data.
- **Inputs:** `/reports/?period=day&date=2024-02-28&page=2`; two rapid Next
  actions and two rapid Previous actions.
- **Steps:** 1. Open the input URL. 2. Use Playwriter to click Next twice as
  quickly as possible. Record how many activations the control accepts before it
  disables, and the final URL. 3. Repeat with Previous from the final date. 4.
  Use Back and Forward and inspect the selected date and report heading.
- **Expected results:** each accepted Next or Previous action changes the day
  once, including leap day; two accepted Next actions end on `2024-03-01`, and
  two accepted Previous actions return to `2024-02-28`. Page is reset to 1.
  Disabled controls do not dispatch another action. Back and Forward keep the
  selected date and heading consistent with the URL. If two activations cannot
  be accepted before the control disables, mark the two-action subcase blocked.
- **Evidence:** `qa-artifacts/QA-167-report-moves.txt`; save sanitized action
  counts, URLs, headings, and browser errors. Inspect each result.
- **Cleanup:** close only tabs opened for this case. No data cleanup is needed.
- **Status:** pending.

## Header navigation redesign and theme switch

Task: redesign the header shown in the supplied screenshot. Keep Yopem UI, typed
routes, Account actions, focus mode, and the existing theme contract. Affected
files: `apps/web/src/components/app-shell.tsx`,
`apps/web/src/components/theme-switcher.tsx`, and the header variants in
`apps/web/src/components/ui/box.tsx`. No endpoint or schema change.

### Shared setup and coverage

Use the existing approved non-production web environment from Scope and setup.
Do not start another server or change ports. Use an isolated guest workspace for
preference changes. Record the current theme and dark-while-running setting. Use
the installed Bun and existing web lint, format, and typecheck scripts. Save
sanitized evidence in ignored `qa-artifacts/header-redesign/`. Run QA-168,
QA-169, then QA-170. Header acceptance and navigation regressions map to QA-168;
persistence, Settings integration, and timer override map to QA-169; keyboard,
responsive states, and motion map to QA-170. API, migrations, payments, new
analytics, and SEO are not applicable: their contracts do not change.

### [ ] QA-168 — P1 — Header navigation and Account regression

- **Purpose:** Confirm the new header retains all existing destinations and
  actions.
- **Prerequisites:** Shared setup; guest and approved signed-in session.
- **Inputs:** `/`, `/projects`, `/templates`, `/reports`, `/settings`, `/focus`.
- **Steps:** 1. Open `/`. 2. Follow each navigation link and use
  Back/Forward. 3. Open Account; close with Escape. 4. Open `/focus` and timer
  fullscreen. 5. Check guest sign-in and `/auth/login`.
- **Expected results:** The current link alone is active; links keep their URLs;
  Account retains its actions and focus return; focus/fullscreen hides the
  header; login has no app header. No timer, task, or account data changes.
- **Evidence:** Save and inspect `qa-artifacts/header-redesign/navigation.json`
  with routes, active link, Account actions, and browser errors.
- **Cleanup:** Close owned popups and return to `/`; keep the session.
- **Status:** Pending.

### [ ] QA-169 — P1 — Theme toggle persistence and timer override

- **Purpose:** Use the existing guarded Settings mutation, not a second theme
  store.
- **Prerequisites:** Shared setup; isolated guest; record original preferences.
- **Inputs:** Light, dark, system with OS light/dark; `dark_while_running`
  on/off.
- **Steps:** 1. Set theme Light in Settings, then use the header theme
  button. 2. Reload and inspect Settings; toggle back. 3. Repeat from System
  under each OS scheme. 4. Enable dark while running and start a timer. Inspect
  the disabled theme control and its explanation; pause, then toggle. 5. Attempt
  repeated clicks while saving. 6. In an isolated failure fixture, deny local
  storage writes.
- **Expected results:** Toggle chooses the opposite resolved theme and persists
  to the current workspace. Settings and reload agree. The system preference
  becomes an explicit choice only on toggle. Active dark-while-running override
  is explained and cannot produce a misleading light selection. Loading prevents
  duplicate clicks. Failed writes show an alert, not a false success; no other
  settings, timer, or owner data are overwritten. Not-ready workspaces are
  disabled.
- **Evidence:** Save and inspect `qa-artifacts/header-redesign/theme.json` with
  before/after preferences, resolved theme, error, and unchanged settings.
- **Cleanup:** Restore OS emulation, original settings, and storage permission;
  stop only the isolated timer created here.
- **Status:** Pending; write-failure fixture needs discovery before execution.

### [ ] QA-170 — P2 — Header layout, keyboard, and static checks

- **Purpose:** Confirm usable navigation and theme controls on desktop and
  mobile.
- **Prerequisites:** Shared setup; source checkout with dependencies installed.
- **Inputs:** 1440, 1024, 768, 390, 320 CSS-pixel widths; both themes; reduced
  motion.
- **Steps:** 1. Inspect each width with long Account state and guest sign-in. 2.
  Tab through brand, all routes, theme, and Account; activate with keyboard. 3.
  Inspect focus visibility, active contrast, 200% zoom, and reduced motion. 4.
  From `apps/web`, run `bun run lint`, `bun run format:check`, and
  `bun run typecheck`. Production build and runtime checks need the requested QA
  pass.
- **Expected results:** Equal header/content edges; all links accessible without
  page overflow; mobile navigation on its own row; controls at least 44px high;
  meaningful theme action label and visible keyboard focus; reduced motion
  rests; static checks pass without rule changes.
- **Evidence:** Inspect screenshots under `qa-artifacts/header-redesign/` and
  save static diagnostics in `docs/header-redesign-checks.log`.
- **Cleanup:** Restore viewport, zoom, theme, and motion settings.
- **Status:** Pending.

Static validation for the header working-tree change: `bun run lint`,
`bun run format:check`, and `bun run typecheck` passed from `apps/web`.
Typecheck covered app, tools, and service worker; route generation also passed.
`git diff --check` passed from the repository root. Logs are local at
`docs/header-redesign-lint.log`, `docs/header-redesign-format.log`, and
`docs/header-redesign-typecheck.log`. QA-168, QA-169, and QA-170 remain pending:
these static results do not establish browser or runtime behavior.

## Report loading skeleton

Task: show report skeletons like the home page. Source:
`apps/web/src/routes/reports/index.lazy.tsx` and
`apps/web/src/features/reports/components/reports-loading.tsx`. No API or data
contract changes.

Setup: use the existing isolated web environment at `http://localhost:13001` and
its project browser group. Do not start replacement servers. Save evidence in
ignored `qa-artifacts/`. Run QA-171 before QA-172. Lint, format, and typecheck
are allowed now; browser checks and builds need a separate QA pass. Coverage:
report loading and hydration map to QA-171; responsive layout and accessibility
map to QA-172. Authentication, migrations, and external integrations are not
applicable because these contracts do not change.

### [ ] QA-171 — P1 — Report loading and hydration

- **Purpose:** Replace the report loading text with home-style placeholders
  without changing report data or controls.
- **Prerequisites:** Shared setup; isolated guest workspace. Use browser network
  throttling to observe initial hydration. Do not clear user storage.
- **Inputs:** `/reports/?period=week&date=2024-02-28&page=1`, then `/`.
- **Steps:** 1. Open the reports URL with throttling. 2. Inspect the loading
  heading, announcement, summary, filters, charts, and history placeholders. 3.
  Remove throttling and wait for hydration. 4. Change period and date. 5. Return
  home and inspect its existing loading state on reload.
- **Expected results:** Reports shows skeletons until hydration, not zero totals
  or an empty history. Real report content replaces them. Filters and URL state
  still work. The home skeleton and workspace records do not change.
- **Evidence:** Save and inspect `qa-artifacts/QA-171-reports-loading.png` and
  `qa-artifacts/QA-171-reports-loaded.png`, plus sanitized browser errors.
- **Cleanup:** Restore network settings; no data cleanup is needed.
- **Status:** Pending.

### [ ] QA-172 — P2 — Skeleton layout and accessibility

- **Purpose:** Keep report placeholders responsive and noninteractive.
- **Prerequisites:** Shared setup and a visible report loading state from
  QA-171.
- **Inputs:** 1440, 768, and 320 CSS-pixel widths; light and dark themes;
  reduced motion enabled; keyboard and screen reader.
- **Steps:** 1. Inspect loading at each width and theme. 2. Tab through the
  page. 3. Inspect the accessibility tree and loading announcement. 4. Enable
  reduced motion. 5. Complete hydration and inspect the report controls.
- **Expected results:** No horizontal page overflow. Placeholders are hidden
  from assistive technology and cannot receive focus. One polite loading status
  is exposed. Reduced motion stops the shimmer. Real controls remain usable.
- **Evidence:** Save and inspect `qa-artifacts/QA-172-reports-accessibility.txt`
  and viewport screenshots under `qa-artifacts/QA-172/`.
- **Cleanup:** Restore viewport, theme, and motion preferences.
- **Status:** Pending.

Static checks passed from `apps/web`: `bun run lint`, `bun run format:check`
(107 files), and `bun run typecheck` (app, tools, and service worker, with route
generation). Root `git diff --check` passed. Logs:
`docs/reports-errors-lint.log`, `docs/reports-errors-format.log`, and
`docs/reports-errors-typecheck.log`. Browser QA remains pending; static checks
do not prove browser behavior.

## Error-page header visibility

Task: hide header navigation on 404 and 500 pages. Source:
`apps/web/src/components/app-shell.tsx`. No API or data contract changes.

Setup: use the existing isolated web environment at `http://localhost:13001` and
its project browser group. Do not start replacement servers. Save evidence in
ignored `qa-artifacts/`. QA-173 covers error navigation and recovery. Lint,
format, and typecheck are allowed now; browser checks and builds need a separate
QA pass. Authentication, migrations, and external integrations are not
applicable because these contracts do not change.

### [ ] QA-173 — P1 — Error header visibility and recovery

- **Purpose:** Hide the app header on both missing and failed routes without
  losing recovery controls or normal navigation.
- **Prerequisites:** Shared setup; an isolated route error fixture. Discover a
  reversible development-only loader or render failure before the 500 subcase;
  no error trigger endpoint is added by this task.
- **Inputs:** `/missing-report-qa-173`, `/reports`, `/`, and the isolated
  failure.
- **Steps:** 1. Open the missing URL directly and through client navigation. 2.
  Inspect the 404 page. 3. Use Return to timer. 4. Trigger the isolated route
  failure and inspect the 500 fallback. 5. Remove the failure and use Reload
  page, then visit reports.
- **Expected results:** Neither error page shows the app header, brand, Account,
  theme toggle, or main navigation. Error headings and recovery buttons remain.
  Recovery restores the normal header. Reports and home retain navigation; focus
  and login keep their existing header rules. No workspace data changes.
- **Evidence:** Save and inspect `qa-artifacts/QA-173-errors.txt` and sanitized
  screenshots of 404, 500, and recovered routes.
- **Cleanup:** Remove the isolated failure and close only owned temporary tabs.
- **Status:** Pending; the 500 fixture needs discovery before execution.

Static checks passed from `apps/web`: `bun run lint`, `bun run format:check`
(107 files), and `bun run typecheck` (app, tools, and service worker, with route
generation). Root `git diff --check` passed. Logs:
`docs/reports-errors-lint.log`, `docs/reports-errors-format.log`, and
`docs/reports-errors-typecheck.log`. Browser QA remains pending; static checks
do not prove browser behavior.

## Timer progress ring

Task: make the existing circular timer face show elapsed interval progress.
Affected files: `apps/web/src/features/timer/components/focus-timer.tsx`,
`apps/web/src/features/focus/store.ts`, and
`apps/web/src/components/ui/box.tsx`. Routes: `/` and `/focus`. Reuse the
existing phase duration calculation and phase color. No timer mutation, storage,
API, or authentication contract changes.

Setup: use the existing isolated guest workspace at `http://localhost:13001`. Do
not replace an active server. Record original settings and timer state. Use an
idle workspace with no active real task. Set each interval to 1 minute and turn
off automatic starts for repeatable checks. Run QA-174 before QA-175. Save
evidence in ignored `qa-artifacts/`. Browser runs and production builds need a
separate QA request. Lint, format, and typecheck can run now. Coverage: running,
paused, reset, completion, and phase changes map to QA-174. Home/focus reuse,
mobile sizing, theme, and accessibility map to QA-175. API, auth, and migrations
are not applicable because no such contracts change.

### [ ] QA-174 — P1 — Progress follows the interval clock

- **Purpose:** Keep ring progress consistent with elapsed time, including pause,
  resume, phase selection, reset, and completion.
- **Prerequisites:** Shared setup; idle isolated guest; all interval lengths set
  to 1 minute; automatic starts disabled.
- **Inputs:** Focus, Short break, and Long break; 01:00, about 00:30, and 00:00.
- **Steps:** 1. Open `/` and start Focus. 2. Inspect the ring near 00:30. 3.
  Pause, wait 5 seconds, and inspect again. 4. Resume and reload the page before
  completion. 5. Wait for completion. 6. Start a new interval, then reset and
  confirm interruption if asked. 7. Select each break and repeat start, pause,
  and reset. 8. Change phase during Focus and confirm.
- **Expected results:** The ring starts empty and fills clockwise from the top.
  Near 00:30 it is half full. Pausing holds its position; resuming continues
  from that position. Reload recovers progress from the stored deadline.
  Progress never falls below 0% or exceeds 100%, even after the deadline.
  Completion and reset show the new interval's empty ring. Each selected phase
  uses its own duration and color. Existing confirmation and recording rules
  remain unchanged; no extra sessions are created by drawing the ring.
- **Evidence:** Save and inspect `qa-artifacts/QA-174-timer-ring.txt` with
  displayed clocks, ring offsets, phase changes, and session counts, plus
  screenshots at half progress and after reset.
- **Cleanup:** Restore settings; reset only the isolated timer and remove only
  sessions created by this case through existing history controls.
- **Status:** Pending.

### [ ] QA-175 — P2 — Ring layout, themes, and accessibility

- **Purpose:** Preserve timer usability while the ring changes.
- **Prerequisites:** Shared setup; running interval from QA-174 or a new
  isolated 1-minute interval.
- **Inputs:** `/`, `/focus`, fullscreen; 1440 and 320 CSS-pixel widths; light
  and dark themes; reduced motion; keyboard and screen reader.
- **Steps:** 1. Inspect both routes at each width. 2. Enter and leave timer
  fullscreen. 3. Inspect each theme and enable reduced motion. 4. Use keyboard
  Start, Pause, Resume, Reset, and phase controls. 5. Inspect the accessibility
  tree while the clock updates.
- **Expected results:** Ring stays circular and fits its existing track without
  covering clock text, controls, or causing page overflow. Both routes show the
  same progress. Drawing does not block clicks or add a keyboard stop. Existing
  timer name and remaining time stay available; decorative SVG is hidden from
  assistive technology and does not announce every tick. No independent
  animation runs, including under reduced motion.
- **Evidence:** Save and inspect screenshots in `qa-artifacts/QA-175/` and
  `qa-artifacts/QA-175-accessibility.txt` with keyboard and browser errors.
- **Cleanup:** Restore viewport, theme, motion settings, and fullscreen; reset
  only the isolated timer created for this case.
- **Status:** Pending.

Timer ring static validation passed from `apps/web`: `bun run lint`,
`bun run format:check`, and `bun run typecheck`, including route generation and
app, tools, and service-worker configs. Root `git diff --check` passed. Logs:
`docs/timer-ring-lint.log`, `docs/timer-ring-format.log`, and
`docs/timer-ring-typecheck.log`. QA-174 and QA-175 remain pending. No browser,
automated tests, builds, or endpoint checks ran.

## Task section radius and save notifications

Task: align the Tasks section with the card radius and add Yopem UI save
notifications. Affected paths include `apps/web/src/components/ui/box.tsx`,
`apps/web/src/components/ui/toast.tsx`, `apps/web/src/routes/__root.tsx`, and
save forms under `apps/web/src/features/` and `apps/web/src/routes/projects/`.
Use the shared setup above and isolated guest data. Save sanitized evidence in
`qa-artifacts/`. Do not use production data. Execute these cases only in a
separately requested QA pass.

Coverage map: section and loading radius: QA-176; successful saves and feedback:
QA-177; failed validation and storage: QA-178; keyboard, theme, and responsive
behavior: QA-179; fullscreen and focus-window icons: QA-180. Authentication,
payments, API contracts, and migrations are not changed by this task.

### [ ] QA-176 — P2 — Task section radius

- **Purpose:** match the Tasks section radius to other cards without changing
  its contents or loading layout.
- **Prerequisites:** shared setup; isolated guest workspace; web app at
  `http://localhost:13001`.
- **Inputs:** empty task list and one task named `QA radius task`.
- **Steps:** 1. Open `/` and compare the Tasks outer border with another
  card. 2. Add the task and compare again. 3. Reload and inspect the loading
  state.
- **Expected results:** outer Tasks corners match card corners in empty, filled,
  and loading states; content remains visible and usable.
- **Evidence:** `qa-artifacts/QA-176-radius.png`; inspect corner sizes and
  layout.
- **Cleanup:** delete the isolated task; stop only processes started for QA.
- **Status:** pending.

### [ ] QA-177 — P1 — Save success notifications

- **Purpose:** confirm explicit saves show one success toast only after a save.
- **Prerequisites:** shared setup; isolated guest workspace; web app available.
- **Inputs:** task `QA toast task`, project `QA toast project`, template
  `QA toast template`, a manual focus record, and a valid settings change.
- **Steps:** 1. Create and edit each item through its form on `/`, `/projects`,
  `/templates`, and `/reports`. 2. Save a valid change on `/settings`. 3. Reload
  each page and confirm the saved data.
- **Expected results:** each successful save persists and displays one relevant
  success toast; the form closes where appropriate and the toast dismisses.
- **Evidence:** `qa-artifacts/QA-177-saves.txt` and screenshots; inspect each
  toast and the persisted results.
- **Cleanup:** remove only isolated QA data and restore the changed setting.
- **Status:** pending.

### [ ] QA-178 — P1 — Save errors remain visible

- **Purpose:** prevent a success toast for invalid or failed saves and preserve
  actionable errors.
- **Prerequisites:** shared setup; isolated guest workspace; browser tools able
  to reproduce a local storage write failure without affecting other projects.
- **Inputs:** empty task title and a valid `QA failed save` title.
- **Steps:** 1. Submit an empty task title. 2. Restore a valid title, simulate a
  storage write failure, and submit again. 3. Restore storage and retry.
- **Expected results:** invalid and failed saves show their existing errors,
  remain open, and do not show success; a successful retry shows one toast.
- **Evidence:** `qa-artifacts/QA-178-errors.txt`; inspect errors, toasts, and
  saved task state. Record a blocker if safe failure injection is unavailable.
- **Cleanup:** restore storage access and delete only the isolated task.
- **Status:** pending.

### [ ] QA-179 — P2 — Toast accessibility and layout

- **Purpose:** check announcements, keyboard access, themes, and small screens.
- **Prerequisites:** shared setup; isolated guest workspace; screen reader and
  keyboard; light and dark theme options.
- **Inputs:** a valid task named `QA accessible toast`; desktop and 320px views.
- **Steps:** 1. Save with keyboard in each theme and viewport. 2. Listen for the
  notification and continue using the form until it closes automatically. 3.
  Repeat with reduced motion enabled.
- **Expected results:** the toast is announced and readable, closes
  automatically, and does not block keyboard use, obscure essential controls, or
  overflow.
- **Evidence:** `qa-artifacts/QA-179-accessibility.txt` and screenshots; inspect
  announcements, focus, and layouts.
- **Cleanup:** delete the isolated task and restore theme and motion settings.
- **Status:** pending.

### [ ] QA-180 — P1 — Icon-only browser focus controls

- **Purpose:** retain fullscreen and focus-window behavior after replacing text
  buttons with icons in `browser-focus-controls.tsx`.
- **Prerequisites:** shared setup; isolated guest workspace and a browser that
  supports fullscreen and permits popups for `http://localhost:13001`.
- **Inputs:** Full screen, Exit full screen, and Focus window controls; Escape.
- **Steps:** 1. Open `/` and use keyboard to focus Full screen. 2. Activate it,
  confirm the exit label and icon, then press Escape. 3. Activate Focus
  window. 4. Block popups and repeat; then restore the browser setting.
- **Expected results:** both icons have clear accessible names and visible
  focus; fullscreen enters and exits correctly; the focus window opens `/focus`,
  or the existing popup-blocked message and link appear when blocked.
- **Evidence:** `qa-artifacts/QA-180-focus-controls.txt` and screenshot; inspect
  accessible names, fullscreen state, popup URL, and error recovery.
- **Cleanup:** close only the QA popup and restore browser popup settings.
- **Status:** pending.

## Public homepage SEO update

Task: improve the public timer page without indexing personal workspace data.
Affected files: `apps/web/src/routes/index.tsx`, `index.lazy.tsx`, and
`__root.tsx`. Existing discovery controls in `apps/web/src/server.ts` stay in
place. Use the shared isolated setup above. Production-like QA needs an approved
build with HTTPS `PUBLIC_ORIGIN`; local source changes do not update old builds.
Coverage: public content and metadata use QA-181; structured data uses QA-182;
crawl controls and personal-page privacy use QA-061; timer titles use QA-048.
Payments, backend writes, new routes, and external integrations are not
affected.

### [ ] QA-181 - P1 - Public timer content and metadata

- **Purpose:** Make the public page clear before hydration and preserve timer
  titles, personal route metadata, and usable layout.
- **Prerequisites:** Shared setup; approved current production-like build and
  browser/HTTP QA; JavaScript-disabled browser inspection or saved SSR HTML.
- **Inputs:** `/`, `/?source=seo-check`, `/focus`, `/projects`, `/reports`,
  `/settings`; one isolated guest timer with no personal task names.
- **Steps:**
  1. Request `/` and `/?source=seo-check` at the approved web origin. Save the
     HTML and response headers before browser hydration.
  2. Inspect the title, description, canonical, Open Graph and Twitter tags.
     Confirm one visible `h1` says `Pomodoro timer` and the introduction
     explains focus intervals and breaks before and after hydration.
  3. Open `/` at 375 and 1280 CSS pixels. Use keyboard controls to start and
     pause the timer. Navigate to each input route, then return to `/`.
  4. Repeat metadata inspection in non-production and run QA-061 crawl controls.
- **Expected results:** SSR title is `Pomodoro Timer - Focus, Tasks & Breaks`.
  The description matches the visible app. Social images use the absolute
  configured origin and `/icon-512.png`, with descriptive alternative text.
  Canonical and social URLs omit query strings. There is one title and one
  canonical. The live clock and paused title still update. Personal pages remain
  noindex and retain their route titles. Non-production stays noindex. Text
  remains readable without horizontal overflow or lost controls.
- **Evidence:** Save sanitized HTML, headers, title observations, and
  screenshots under ignored `qa-artifacts/QA-181/`; inspect tags and both
  viewport captures.
- **Cleanup:** Reset the isolated timer and restore browser settings. Stop only
  processes started for this case. Do not clear user storage.
- **Status:** pending; no browser, HTTP, or build execution for this update.

### [ ] QA-182 - P2 - Accurate public application structured data

- **Purpose:** Describe the actual browser app without invented ratings or
  offers.
- **Prerequisites:** QA-181 setup and production-like build; approved browser
  QA.
- **Inputs:** `/`, `/?source=seo-check`, `/reports`, and non-production `/`.
- **Steps:**
  1. Save the homepage SSR HTML and parse its `application/ld+json` block.
  2. Compare the name, description, URL, category, and operating system with
     visible content. Inspect the hydrated head and navigate to `/reports`.
  3. Repeat with the query string and non-production inputs.
- **Expected results:** Production homepage has one valid Schema.org
  `WebApplication` with its canonical URL, productivity category, and browser
  platform. No user data, query strings, ratings, prices, or fabricated claims
  appear. Personal routes and non-production do not receive this block. Rich
  results or ranking changes are not guaranteed by valid markup.
- **Evidence:** Save sanitized HTML and parsed JSON in `qa-artifacts/QA-182/`;
  inspect the values and route removal after navigation.
- **Cleanup:** No stored data changes. Close only case-owned tabs.
- **Status:** pending; rendered structured data has not been checked.

## Loading skeleton alignment

Task: align existing timer, focus, reports, and settings skeletons with their
loaded layouts. Use the shared isolated guest setup and the web origin above. No
data changes are required. Capture loading states by using browser developer
tools to throttle script delivery, then allow hydration to finish. Run P1 before
P2. Keep artifacts in the ignored `qa-artifacts/` directory.

### [ ] QA-194 — P1 — Timer and focus loading placeholders

- **Purpose:** Check the timer, phase controls, action buttons, task list, and
  daily summary against their loaded layouts. Check that the home skeleton and
  loaded content have the same width.
- **Prerequisites:** Shared setup; a fresh page load and throttled scripts.
- **Inputs:** `/` and `/focus`; viewport widths 390 and 1440 CSS pixels.
- **Steps:** 1. Open each route with scripts throttled and capture its
  skeleton. 2. Let hydration finish and capture the same view. 3. Compare button
  heights, spacing, dial, task and summary placement at each width. Compare the
  left and right edges of the home timer and task columns before and after
  hydration.
- **Expected results:** Placeholders follow the same responsive layout and
  button scale as the loaded interface. The home grid and its columns have the
  same width and edges before and after hydration, without horizontal overflow.
  The focus route does not show the task list or daily summary. The loading
  announcement is available to assistive technology; decorative placeholders are
  hidden.
- **Evidence:** Save sanitized before-and-after screenshots in
  `qa-artifacts/QA-194/`; inspect both routes and widths.
- **Cleanup:** Restore normal network settings; stop only case-owned processes.
- **Status:** pending. On 2026-11-11, a focused browser check at revision
  `7ed34fa` with the uncommitted home skeleton fix found matching grid and
  timer-card left edges and widths at 390px and 1440px. The grid also starts at
  the same vertical position. See `qa-artifacts/QA-194/home-layout.txt`. The
  loading check blocked scripts, which caused expected resource errors. The
  loaded page also returned HTTP 500 for `/api/session` because the local API
  was not running. Focus-route, full visual, and accessibility checks remain
  pending.

### [ ] QA-195 — P1 — Reports loading placeholders

- **Purpose:** Check report header, filter, summary, chart, and history
  skeletons.
- **Prerequisites:** Shared setup; throttled scripts; isolated report data.
- **Inputs:** `/reports`; viewport widths 390 and 1440 CSS pixels.
- **Steps:** 1. Open the report route with scripts throttled and capture it. 2.
  Allow hydration and compare header, filter controls, metrics, and panels.
- **Expected results:** Placeholder shapes and spacing follow the loaded report
  layout at both widths. The loading announcement remains available and no
  report data is changed.
- **Evidence:** Save sanitized before-and-after screenshots in
  `qa-artifacts/QA-195/`; inspect both widths.
- **Cleanup:** Restore normal network settings; stop only case-owned processes.
- **Status:** pending.

### [ ] QA-196 — P1 — Settings loading placeholders

- **Purpose:** Check section, field, action, navigation, and backup
  placeholders.
- **Prerequisites:** Shared setup; throttled scripts; isolated guest workspace.
- **Inputs:** `/settings`; viewport widths 390 and 1440 CSS pixels.
- **Steps:** 1. Open settings with scripts throttled and capture the
  skeleton. 2. Allow hydration and compare each section, field grid, and action
  row.
- **Expected results:** Skeleton sections and control heights follow the loaded
  settings layout. The loading message remains available and no setting changes.
- **Evidence:** Save sanitized before-and-after screenshots in
  `qa-artifacts/QA-196/`; inspect both widths.
- **Cleanup:** Restore normal network settings; stop only case-owned processes.
- **Status:** pending.

### [ ] QA-197 — P2 — Skeleton theme and motion

- **Purpose:** Check visibility and reduced-motion behavior for changed loading
  placeholders across the existing routes.
- **Prerequisites:** Shared setup; browser theme and reduced-motion controls;
  throttled scripts.
- **Inputs:** `/`, `/focus`, `/reports`, and `/settings`; light and dark themes.
- **Steps:** 1. Load each route in both themes with scripts throttled. 2. Repeat
  with reduced motion enabled and inspect the accessibility tree.
- **Expected results:** Placeholders remain visible in both themes and stop
  animating with reduced motion. Decorative content is hidden from assistive
  technology and the loading status remains available.
- **Evidence:** Save sanitized screenshots and accessibility-tree notes in
  `qa-artifacts/QA-197/`.
- **Cleanup:** Restore theme, motion, and network settings; stop only case-owned
  processes.
- **Status:** pending.

## Local Yopem UI style refresh

Task: apply the unpublished source-owned Yopem UI style across the web app.
Affected files: web UI components, shared tokens, shell, route presentation,
feature presentation, and loading placeholders. No HTTP or data contract
changes. Use the shared setup above. Confirm the current server before
execution; the web dev script uses port 13001. Do not start a second server. Use
an isolated guest workspace and approved account only. Use installed Bun and
locked dependencies. Save evidence under ignored `qa-artifacts/QA-198/` through
`qa-artifacts/QA-204/`. Run P0, P1, then P2. Browser and build work needs a
separate QA request. Lint, format, and typecheck run during implementation.

Coverage: shared styles QA-198; navigation and responsive layout QA-199; timer
and tasks QA-200; collections and reports QA-201; settings and account safety
QA-202; accessibility and overlays QA-203; loading, SSR, themes and build
QA-204. API, migrations, payments, and new integrations are not applicable: this
change does not alter them. Existing behavior cases remain applicable.

### [ ] QA-198 — P1 — Shared component style

- **Purpose:** Check the style refresh and regression behavior for all routes
  and shared controls.
- **Prerequisites:** Shared refresh setup; preserve existing local data with an
  existing backup before using an isolated workspace. Populated reports need a
  completed isolated focus session. Account checks need an approved test
  account; otherwise mark that part blocked.
- **Inputs:** all routes and shared controls; light and dark themes; safe
  example records stated in the steps.
- **Steps:** 1. Record the starting route, theme, viewport, and workspace. 2.
  Open /, /projects, /templates, /reports, and /settings in both themes. Compare
  buttons, fields, cards, badges, menus, and headings with the local Yopem UI
  source. 3. Inspect browser errors and save sanitized evidence.
- **Expected results:** Controls use the new source-owned styles. Labels,
  disabled states, errors, focus indicators, and selected states remain clear.
- **Evidence:** Save screenshots and action/result notes in
  `qa-artifacts/QA-198/`. Inspect each result and record revision, environment,
  and date before marking passed.
- **Cleanup:** Remove only isolated records, restore recorded settings and
  network controls, and stop only processes started for this case. Do not clear
  existing user storage.
- **Status:** pending.

### [ ] QA-199 — P1 — Navigation and page layout

- **Purpose:** Check the style refresh and regression behavior for /, /focus,
  /projects, /templates, /reports, /settings.
- **Prerequisites:** Shared refresh setup; preserve existing local data with an
  existing backup before using an isolated workspace. Populated reports need a
  completed isolated focus session. Account checks need an approved test
  account; otherwise mark that part blocked.
- **Inputs:** /, /focus, /projects, /templates, /reports, /settings; light and
  dark themes; safe example records stated in the steps.
- **Steps:** 1. Record the starting route, theme, viewport, and workspace. 2.
  Visit each route at 390, 768, 1024, and 1440 CSS pixels. Use each navigation
  link, reload, and use Back. Open /focus and enter browser fullscreen from the
  timer. 3. Inspect browser errors and save sanitized evidence.
- **Expected results:** Navigation identifies the current route with neutral
  text and a neutral surface, not blue accent text. Keyboard focus remains
  visible. Page edges align. Content has no horizontal overflow. Focus and
  fullscreen keep their existing reduced layout.
- **Evidence:** Save screenshots and action/result notes in
  `qa-artifacts/QA-199/`. Inspect each result and record revision, environment,
  and date before marking passed.
- **Cleanup:** Remove only isolated records, restore recorded settings and
  network controls, and stop only processes started for this case. Do not clear
  existing user storage.
- **Status:** pending.

### [ ] QA-200 — P1 — Timer and task presentation

- **Purpose:** Check the style refresh and regression behavior for / and /focus.
- **Prerequisites:** Shared refresh setup; preserve existing local data with an
  existing backup before using an isolated workspace. Populated reports need a
  completed isolated focus session. Account checks need an approved test
  account; otherwise mark that part blocked.
- **Inputs:** / and /focus; light and dark themes; safe example records stated
  in the steps.
- **Steps:** 1. Record the starting route, theme, viewport, and workspace. 2.
  Create task Design review with estimate 2. Select it, start and pause the
  timer, then reset. Open and cancel interruption confirmation. Change each
  phase and inspect the daily summary. 3. Inspect browser errors and save
  sanitized evidence.
- **Expected results:** Clock, progress, selected phase, actions, and task
  states are readable. Cancel changes no timer state. Existing session and
  estimate rules are unchanged.
- **Evidence:** Save screenshots and action/result notes in
  `qa-artifacts/QA-200/`. Inspect each result and record revision, environment,
  and date before marking passed.
- **Cleanup:** Remove only isolated records, restore recorded settings and
  network controls, and stop only processes started for this case. Do not clear
  existing user storage.
- **Status:** pending.

### [ ] QA-201 — P1 — Collections and report presentation

- **Purpose:** Check the style refresh and regression behavior for /projects,
  /templates, /reports.
- **Prerequisites:** Shared refresh setup; preserve existing local data with an
  existing backup before using an isolated workspace. Populated reports need a
  completed isolated focus session. Account checks need an approved test
  account; otherwise mark that part blocked.
- **Inputs:** /projects, /templates, /reports; light and dark themes; safe
  example records stated in the steps.
- **Steps:** 1. Record the starting route, theme, viewport, and workspace. 2.
  Create project Design review and template Review with one task Read notes,
  estimate 2. Open their editors and cancel. Open /reports, change the period
  and project filters, and inspect empty and populated history. 3. Inspect
  browser errors and save sanitized evidence.
- **Expected results:** Cards, editors, filters, chart, history, and empty
  states follow the shared style. Cancel preserves records. Filters and report
  values keep their existing meaning.
- **Evidence:** Save screenshots and action/result notes in
  `qa-artifacts/QA-201/`. Inspect each result and record revision, environment,
  and date before marking passed.
- **Cleanup:** Remove only isolated records, restore recorded settings and
  network controls, and stop only processes started for this case. Do not clear
  existing user storage.
- **Status:** pending.

### [ ] QA-202 — P0 — Settings and account controls

- **Purpose:** Check the style refresh and regression behavior for /settings and
  /auth/login.
- **Prerequisites:** Shared refresh setup; preserve existing local data with an
  existing backup before using an isolated workspace. Populated reports need a
  completed isolated focus session. Account checks need an approved test
  account; otherwise mark that part blocked.
- **Inputs:** /settings and /auth/login; light and dark themes; safe example
  records stated in the steps.
- **Steps:** 1. Record the starting route, theme, viewport, and workspace. 2.
  Record current settings. Change the focus color and theme, save, and reload.
  Open backup import and cancel without choosing a file. Open account controls
  and sign-in; do not exchange or replace workspace data. 3. Inspect browser
  errors and save sanitized evidence.
- **Expected results:** Saved preferences remain after reload. Phase colors
  remain distinct. Cancel does not change data. Account errors and actions stay
  readable; no private data enters evidence.
- **Evidence:** Save screenshots and action/result notes in
  `qa-artifacts/QA-202/`. Inspect each result and record revision, environment,
  and date before marking passed.
- **Cleanup:** Remove only isolated records, restore recorded settings and
  network controls, and stop only processes started for this case. Do not clear
  existing user storage.
- **Status:** pending.

### [ ] QA-203 — P1 — Keyboard and overlay presentation

- **Purpose:** Check the style refresh and regression behavior for all changed
  routes and dialogs.
- **Prerequisites:** Shared refresh setup; preserve existing local data with an
  existing backup before using an isolated workspace. Populated reports need a
  completed isolated focus session. Account checks need an approved test
  account; otherwise mark that part blocked.
- **Inputs:** all changed routes and dialogs; light and dark themes; safe
  example records stated in the steps.
- **Steps:** 1. Record the starting route, theme, viewport, and workspace. 2.
  Navigate using Tab, Shift+Tab, Enter, Space, and Escape. Open task, project,
  template, confirmation, calendar, select, account, and theme controls. Inspect
  labels and focus return. Repeat at 200% zoom and 400% reflow. 3. Inspect
  browser errors and save sanitized evidence.
- **Expected results:** All controls remain operable and labelled. Focus is
  visible, returns to the trigger, and stays inside modal dialogs. Content and
  actions remain reachable.
- **Evidence:** Save screenshots and action/result notes in
  `qa-artifacts/QA-203/`. Inspect each result and record revision, environment,
  and date before marking passed.
- **Cleanup:** Remove only isolated records, restore recorded settings and
  network controls, and stop only processes started for this case. Do not clear
  existing user storage.
- **Status:** pending.

### [ ] QA-204 — P2 — Loading, theme, and extracted styles

- **Purpose:** Check the style refresh and regression behavior for /, /focus,
  /reports, /settings.
- **Prerequisites:** Shared refresh setup; preserve existing local data with an
  existing backup before using an isolated workspace. Populated reports need a
  completed isolated focus session. Account checks need an approved test
  account; otherwise mark that part blocked.
- **Inputs:** /, /focus, /reports, /settings; light and dark themes; safe
  example records stated in the steps.
- **Steps:** 1. Record the starting route, theme, viewport, and workspace. 2.
  Repeat QA-194 through QA-197 with throttled scripts in both themes and with
  reduced motion. With build approval, run bun run build from the repository
  root and inspect the resulting app on the shared origin. 3. Inspect browser
  errors and save sanitized evidence.
- **Expected results:** Loading and loaded layouts match. Theme has no light
  flash in dark mode. Reduced motion remains supported. Extracted styles load
  without hydration or missing-token errors.
- **Evidence:** Save screenshots and action/result notes in
  `qa-artifacts/QA-204/`. Inspect each result and record revision, environment,
  and date before marking passed.
- **Cleanup:** Remove only isolated records, restore recorded settings and
  network controls, and stop only processes started for this case. Do not clear
  existing user storage.
- **Status:** pending.

### [ ] QA-205 — P2 — Offline page and install assets

- **Purpose:** Check the offline page, browser theme color, and install icons
  against the shared neutral theme. Affected files: `apps/web/public/`, and the
  root route metadata.
- **Prerequisites:** Shared refresh setup; an installed service worker from the
  current build. Build and browser execution need a separate QA request.
- **Inputs:** `/offline.html`, `/manifest.webmanifest`, `/favicon.svg`,
  `/icon-192.png`, `/icon-512.png`, and `/icon-maskable.png`; light and dark
  system themes; 390 and 1440 CSS pixel viewports.
- **Steps:** 1. Open the offline page in each system theme and viewport. 2. Use
  the retry link by keyboard. 3. Inspect manifest colors and icon previews,
  including a circular mask. 4. Install the isolated preview app, go offline,
  and open a route that is not cached.
- **Expected results:** The offline page uses neutral surfaces, readable text,
  clear focus, and a reachable retry action without external assets. Icons
  retain a recognizable timer and safe mask padding. Manifest and browser colors
  match the light theme. Existing offline fallback and private-route cache
  exclusions stay unchanged.
- **Evidence:** Save sanitized offline screenshots, manifest values, install
  icon previews, and network notes in `qa-artifacts/QA-205/`. Inspect them and
  record revision, date, and environment.
- **Cleanup:** Restore network and system theme. Remove only the isolated
  preview install. Preserve existing browser storage.
- **Status:** pending.

Coverage addition: offline and install presentation QA-205.

### Style refresh implementation checks — 2026-11-11

Implementation is complete. Runtime QA has not run for this refresh. QA-198
through QA-205 remain pending. Rerun QA-194 through QA-197 for the updated
loading placeholders; earlier results do not cover this code.

- `bun run lint`: passed at the repository root. This includes native Bun lint
  and the existing locked Cargo Clippy task with warnings denied.
- `bun run format:check`: passed at the repository root after formatting
  `apps/web/src/components/ui/dialog.tsx`. This includes the existing Rust
  formatter check.
- `bun run typecheck`: passed at the repository root. This includes route
  generation, web app/tool/service-worker checks, shared package checks, and the
  existing locked Cargo check task.
- `git diff --check`: passed after the final source merge.

The changes preserve app component variants and existing mutation handlers.
Inter remains the loaded font. No dependency, lockfile, server contract, or
persistence format changed. The offline assets now use the same neutral palette.
The generated 192px icon was inspected as a source asset; this is not an
installability or browser QA pass.

Deferred: browser workflows, accessibility review, responsive screenshots, SSR
and hydration checks, automated tests, production build, installability, and
service-worker offline/update checks. These need the separate QA pass.

## Focus history layout follow-up

Task: redesign `ReportHistory` and its loading placeholder at `/reports`.
Affected files: `apps/web/src/features/reports/components/report-history.tsx`
and `reports-loading.tsx` in the same directory. Use the shared refresh setup
and approved isolated guest workspace. Run P1 before P2. No API or stored
session contract changes are intended.

### [ ] QA-206 — P1 — History frame, records, and actions

- **Purpose:** Check the new history hierarchy and preserve edit, delete, empty
  state, range selection, and URL-based pagination.
- **Prerequisites:** Shared refresh setup; approved browser QA; isolated guest
  workspace with a backup; `/reports` available at the recorded web origin.
- **Inputs:** A manual focus record named `Design review`, project `Website`,
  duration 25 minutes; another record with no project; an empty date range. Use
  the existing Add focus time form to create enough isolated records for two
  pages. Read its current page limit before creating records.
- **Steps:**
  1. Open `/reports`, select the range containing the isolated records, and
     inspect the history header, total, table, and page controls.
  2. Edit `Design review` with its labelled edit button. Save the change and
     inspect the row and report totals. Cancel deletion once, then confirm
     deletion on an isolated record and inspect the removed row and totals.
  3. Use Next, Previous, reload, and Back. Select the empty date range.
  4. Repeat at 390 and 1440 CSS pixels in both themes. Use the keyboard to reach
     each action. Change the time preference between 12h and 24h and inspect the
     record timestamps.
- **Expected results:** One shared frame contains the history header, table, and
  footer without a nested card. Task and project names remain visible. Duration
  and timestamps retain their original values. The total and page labels are
  correct. Actions retain confirmation and owner guards. Cancel does not write
  data. Only the table scrolls horizontally on narrow screens. Empty history has
  guidance and disabled page controls. No action or content disappears in either
  theme, and no unexpected browser error appears.
- **Evidence:** Save sanitized screenshots and action results in
  `qa-artifacts/QA-206/`; inspect the populated, empty, edit, delete, and
  pagination results before marking passed.
- **Cleanup:** Remove only isolated records and restore the recorded range, time
  preference, theme, and viewport. Do not clear existing user storage.
- **Status:** pending; runtime QA is not approved for this implementation pass.

Coverage: the header navigation requirement uses QA-199. History hierarchy,
record rendering, empty state, and unchanged actions use QA-206. Loading
geometry uses QA-195 and QA-204; reopen those cases for this revision. No
authentication, payment, API, or persistence contract changes are in scope.

### [ ] QA-207 — P1 — Shared control sizes and remaining source styles

- **Purpose:** Check source-owned button sizing, navigation composition, notes
  fields, input placeholders, and overlay edges after the source comparison.
- **Prerequisites:** Shared refresh setup; approved browser QA; isolated guest
  workspace. Read the current local registry Button and Textarea source before
  comparison. No new dependencies or services are required.
- **Inputs:** `/`, `/projects`, `/templates`, `/reports`, `/settings`,
  `/offline.html`; 390 and 1440 CSS pixel viewports; light/dark themes; mouse
  and touch emulation; task title `Design review` and notes
  `Review spacing and controls.`
- **Steps:**
  1. Open each route. Inspect header and settings links, page actions, timer
     actions, theme control, task actions, and history pagination.
  2. Compare their measured heights with the source scale: small buttons 32px,
     default buttons 40px, and large buttons 48px. Main navigation uses small
     ghost Buttons; settings navigation uses default ghost Buttons. Check
     pointer targets of at least 44px with touch emulation. Check the static
     retry link on `/offline.html` against the default 40px button size.
  3. Open the task and template forms. Inspect their notes fields and input
     placeholders against the local source. Enter and preserve the input text.
     Open and close the date picker and an existing notification.
  4. Use keyboard navigation for all links and controls. Repeat in both themes
     and at both viewports. Capture the settings loading state before its
     content loads and compare navigation placeholder height.
- **Expected results:** Controls use the shared scale without custom height or
  padding rules on navigation links. Active header text remains neutral. Link
  URLs, hashes, focus indicators, labels, actions, and timer behavior do not
  change. Navigation wraps without clipped targets or page overflow. The default
  notes minimum height is 120px and horizontal padding is 15px. Input
  placeholders use the muted foreground. Popovers and notifications have no old
  inset edge shadow. Reduced-motion notification behavior remains intact.
- **Evidence:** Save sanitized measurements, screenshots, and keyboard/action
  observations in `qa-artifacts/QA-207/`; inspect each comparison and the action
  results before marking passed.
- **Cleanup:** Discard or remove only isolated form data and restore viewport,
  theme, and emulation. Close only case-owned overlays. Do not clear storage.
- **Status:** pending; runtime QA remains deferred.

Coverage: shared button and form sizing and source-style gaps use QA-207. QA-199
covers link routing and neutral active styling. QA-206 covers the redesigned
history. QA-195 and QA-204 cover changed loading geometry.

### Follow-up static results — 2026-11-11

Root `bun run lint`, `bun run format:check`, and `bun run typecheck` passed
after the navigation composition and source-style fixes. Lint includes Cargo
Clippy with warnings denied; format includes rustfmt; typecheck includes the
locked Cargo check and web app, tools, and service-worker projects.
`git diff --check` passed. The initial `yopem-ui/no-restyle` diagnostics were
fixed with component variants and parent layout, not rule changes or disables.

No browser, API, test, build, deployment, or extra scanner ran. QA-206 and
QA-207 remain pending at P1. QA-199 remains pending for neutral navigation and
wrapping; QA-195 and QA-204 need the updated loading states. Existing QA-198,
QA-203, and QA-205 also cover the changed controls and offline link.

## Default button size and Geist fonts

User requirements supersede the mixed-size policy in QA-207: use Yopem UI
default button sizes throughout the app, and use Geist Variable and Geist Mono
Variable instead of Inter and IBM Plex Mono. QA-207 remains pending for
non-button source styles; use QA-208 for button sizes and QA-209 for fonts.
Reopen QA-195, QA-196, QA-199, QA-200, and QA-204 for these changes.

### [ ] QA-208 — P1 — Default action sizes throughout the app

- **Purpose:** Check that app actions use the default Yopem UI Button size,
  including text and icon-only actions, without mixed 32px and 48px heights.
- **Prerequisites:** Shared refresh setup; approved browser QA; isolated guest
  workspace with one task and one project; current local Button source.
- **Inputs:** `/`, `/focus`, `/projects`, `/templates`, `/reports`, `/settings`,
  `/auth/login`, `/offline.html`; light/dark themes; 390 and 1440 CSS pixels.
- **Steps:**
  1. Visit each input route. Open task, template, project, and focus editors,
     delete confirmations, backup controls, and account controls as permitted.
  2. Measure the visible buttons and header links: text actions use the default
     size; icon actions use `icon`. Compare with the source 40px default height.
     Inspect timer phase and start/pause/reset controls too.
  3. Exercise keyboard navigation and touch emulation. Inspect task and timer
     loading placeholders, then inspect settings placeholders.
- **Expected results:** App Button actions have 40px visible height without old
  sm/lg/xl size overrides. Source-owned calendar cells and other native controls
  retain their component contract. Touch targets remain at least 44px where
  provided by Button. Navigation wraps without clipping. Loading placeholders
  use 40px control heights. Labels, confirmation, handlers, and active neutral
  colors remain unchanged.
- **Evidence:** Save sanitized measurements and screenshots in
  `qa-artifacts/QA-208/`; inspect each route and opened form before passing.
- **Cleanup:** Cancel forms and remove only isolated records. Restore theme,
  viewport, and emulation. Do not clear existing storage.
- **Status:** pending; no runtime QA is approved for this pass.

### [ ] QA-209 — P1 — Geist font loading and layout

- **Purpose:** Check the requested source font families, local font assets, and
  layout after the font replacement.
- **Prerequisites:** Shared refresh setup; approved browser and production build
  QA; installed web dependencies; isolated guest workspace.
- **Inputs:** `/`, `/reports`, `/settings`, `/auth/login`, `/offline.html`;
  light/dark themes; 390 and 1440 CSS pixels; title `Design review — café`.
- **Steps:**
  1. Build with the existing root `bun run build` only in the approved QA pass.
     Inspect the emitted font assets and CSS references.
  2. Open each input route, inspect computed body/heading and timer/code font
     families, and inspect font requests and browser errors.
  3. Reload with a cold cache and a slow connection. Inspect timer alignment,
     button labels, long titles, history columns, dialogs, and loading states.
  4. Open the offline fallback without network access and inspect its text.
- **Expected results:** The app imports Geist Variable and Geist Mono Variable
  from local Fontsource packages. Theme font families match the local UI source.
  No Inter font asset remains required. Fonts load without missing requests or
  external font services. Controls and text remain readable and do not clip. The
  offline page uses Geist if available and system fallback otherwise; it does
  not require a font request to render.
- **Evidence:** Save sanitized font request/computed-style observations, build
  asset list, and screenshots in `qa-artifacts/QA-209/`; inspect each result.
- **Cleanup:** Restore network controls, theme, and viewport. Stop only
  processes started for the case. No stored records need removal.
- **Status:** pending; production build and browser checks remain deferred.

Coverage: default action sizes use QA-208; font assets and layout use QA-209. No
API, stored data, or authentication contract changes are intended.

### Default-size and Geist static results — 2026-11-11

`bun install` added the two pinned 5.3.0 Geist font packages and removed Inter.
Both packages declare OFL-1.1 and no install lifecycle scripts. No application
license file changed. Root `bun run lint`, `bun run format:check`, and
`bun run typecheck` passed. `git diff --check` passed. Source review found no
non-default app Button sizes and no old runtime Inter/IBM Plex references.

QA-208 and QA-209 remain pending at P1. Browser measurements, font loading,
production CSS/font output, and offline rendering have not been checked.

## Browser QA finding: Select trigger size

### [ ] QA-210 — P1 — Source Select trigger geometry

- **Purpose:** Reproduce and fix the 32px default Project dropdown found in the
  focus record editor while app Button actions already measured 40px.
- **Prerequisites:** Existing Vite origin `http://localhost:13001`, anonymous
  isolated QA records, baseline backup in `qa-artifacts/QA-206/`; current
  unpublished local UI source. Browser QA is approved; builds are not.
- **Inputs:** `/reports` Add focus time, `/projects` Add project, settings
  dropdowns; 390 and 1440 CSS pixel viewports; both themes.
- **Steps:**
  1. Open Add focus time and inspect Project trigger height and padding.
  2. Compare the shared Select default, small, and large definitions with the
     local registry source. Apply that source geometry without changing
     selection behavior, labels, or form contracts.
  3. Reopen the affected forms and settings; inspect default dropdowns and
     select `QA-206 Website` on the isolated record. Cancel an editor once.
- **Expected results:** Default Select triggers measure 40px with the source
  14px font and weight 450. Source small/large variants remain 32px/48px. Source
  padding, coarse-pointer target, focus, and invalid states remain intact. The
  obsolete inset pseudo-shadow is absent. No stored data changes on cancel, and
  saving the isolated choice keeps its project.
- **Evidence:** Save measurements and screenshots in `qa-artifacts/QA-210/`.
  Inspect the actual trigger, source diff, and saved project before passing.
- **Cleanup:** Close case-owned popups and remove only QA records. Restore theme
  and viewport. Do not clear or replace user storage.
- **Status:** failed on revision `40971ec`; the default Project trigger measured
  32px at desktop width. Fix and browser rerun are pending.

Coverage: QA-210 covers the shared Select gap found during QA-208/QA-209.

## Task queue layout correction

Task: fix the crowded task header, uneven card actions, and scattered cleanup
buttons shown in the user screenshot. Files: task-list.tsx and its existing UI
composition. Route: `/`. Keep all action handlers, owner checks, expected
workspace checks, disabled states, data, and confirmation flows. Reuse the
installed Menu, Button, HStack, Text, and controlled task ConfirmAction. No new
dependencies or styling policy are needed.

### [ ] QA-211 — P1 — Task queue alignment and menu layout

- **Purpose:** Replace wrapping action clusters with a stable task header,
  readable card hierarchy, and grouped secondary actions.
- **Prerequisites:** Existing approved browser environment on port 13001;
  isolated task `QA-208 Timer probe — café`; baseline backup from QA-206;
  current local Yopem UI source and both themes.
- **Inputs:** `/`; 320, 390, and 1440 CSS pixel viewports; one task with notes
  `Review spacing and controls.` and one 200-character unbroken task title.
- **Steps:**
  1. Inspect the task header, title, session count, notes, and action row.
  2. Open each task's Actions menu and the Task list actions menu. Inspect edit,
     move, delete, and cleanup items, including disabled move bounds.
  3. Repeat at each width and in each theme. Inspect a completed task, a
     selected task, and the empty list after removing only QA fixtures.
- **Expected results:** Header actions do not compete with the Tasks title. Task
  actions use one stable row and a source-owned 40px menu trigger. Metadata and
  notes have clear hierarchy and wrap without page overflow. Cleanup actions
  stay inside the list menu instead of scattered rows. Source MenuItem sizing
  remains unchanged. Labels remain accessible and no controls clip or overlap at
  the panel edges.
- **Evidence:** Save and inspect screenshots, menu snapshots, control sizes, and
  overflow observations in `qa-artifacts/QA-211/`.
- **Cleanup:** Remove only named QA tasks and restore theme and viewport. Do not
  clear unrelated tasks, history, or browser storage.
- **Status:** pending.

### [ ] QA-212 — P0 — Task menu safety and existing mutations

- **Purpose:** Keep edit, completion, selection, move, delete, and cleanup
  safeguards while moving actions into menus.
- **Prerequisites:** Shared browser setup and backup; only explicitly named QA
  tasks may be mutated. Before a bulk confirmation, inspect the full task list
  and stop if unrelated tasks are present.
- **Inputs:** `QA-208 Timer probe — café`; a second isolated task named
  `QA-212 Reorder probe`; a completed QA task; zero actual counts.
- **Steps:**
  1. Open the row menu and edit the QA task. Move the two QA tasks up/down and
     inspect order. Toggle completion and selection on an isolated task.
  2. Open task deletion, cancel, and inspect the unchanged task and history.
  3. Open list cleanup actions. Check that unavailable completed/count cleanup
     items are disabled. Open an available completed cleanup and cancel. Open
     Clear all tasks and cancel.
  4. Delete only an isolated task through confirmation. Inspect the list and
     reports. Retain the existing owner and expected-workspace guard path.
- **Expected results:** Actions call the existing guarded workflows. Cancel does
  not change data. Disabled actions do not run. Reorder keeps all task records.
  A confirmed delete affects only its intended task. Task cleanup does not
  remove focus history. Failed mutations keep their error feedback and do not
  silently discard data.
- **Evidence:** Save and inspect before/after snapshots, confirmations, and
  report counts in `qa-artifacts/QA-212/`. Record any guard check not run.
- **Cleanup:** Remove only named QA tasks. Compare the final workspace with the
  baseline; do not restore by replacing user storage.
- **Status:** pending; run this P0 case before the layout acceptance pass.

### [ ] QA-213 — P1 — Task menu keyboard and focus

- **Purpose:** Keep native menu navigation, confirmation focus, touch targets,
  and task visibility controls accessible.
- **Prerequisites:** Shared setup; QA task; keyboard and page-scoped touch
  emulation. Use the existing project-group browser tab.
- **Inputs:** `/`; 390 CSS pixels; dark/light themes; row Actions, Task list
  actions, Add task, and Hide/Show tasks controls.
- **Steps:**
  1. Reach each control by keyboard. Open menus with Enter and move between
     items with arrow keys. Check disabled items and close with Escape.
  2. Open Edit task and a destructive confirmation from a menu. Cancel or press
     Escape. Inspect focus return and the unchanged task.
  3. Hide and show the task list twice. Check the accessible button label and
     the preserved task data. Inspect the 40px visible controls and the source
     coarse-pointer target without clipping.
- **Expected results:** Focus remains visible and logical. Menus close
  correctly, dialogs receive focus, and closing returns focus to a valid
  task/list control. No hidden menu item receives focus. Visibility changes do
  not delete data. Touch and keyboard users can reach the same actions.
- **Evidence:** Save and inspect focus paths, menu/dialog snapshots, and
  screenshots in `qa-artifacts/QA-213/`.
- **Cleanup:** Close owned popups; show tasks; restore emulation, theme, and
  viewport. Remove only QA records during shared cleanup.
- **Status:** pending.

Coverage: layout uses QA-211; data and mutation safety use QA-212; keyboard,
focus, and visibility use QA-213. QA-208 covers default action sizes, and QA-206
continues to cover history. No API or authentication change is planned.

## Compact mobile navigation

### [ ] QA-214 — P1 — One-row mobile header and navigation menu

- **Purpose:** Replace the two wrapping navigation rows shown in the user's
  mobile screenshot with one compact header and an accessible route menu.
- **Prerequisites:** Existing approved local browser environment on port 13001;
  anonymous guest state; both themes; installed source-owned Menu.
- **Inputs:** 320, 390, 900, 901, and 1440 CSS pixel widths; `/`, `/projects`,
  `/templates`, `/reports`, and `/settings`; `/focus` remains compact.
- **Steps:**
  1. At mobile/tablet widths, inspect one header row containing the brand,
     theme, account/login, and Open navigation control. Open the menu.
  2. Select each route from the menu. Inspect the URL, heading, current-page
     marker, menu closure, and unchanged guest data after each transition.
  3. Open and close the menu with keyboard controls and Escape. Inspect focus
     return, labels, 40px button size, and coarse-pointer targets.
  4. Repeat in both themes at 320 and 390px. Check 900/901px boundary and 1440px
     desktop navigation. Inspect the compact `/focus` route.
- **Expected results:** No second or third mobile navigation row remains. The
  header has no bottom border. Desktop links remain visible and stay in one row.
  Hidden navigation does not receive focus. All five routes remain reachable.
  Current-page styling stays neutral, not blue. Menus use existing source sizing
  and keyboard behavior. Header controls do not clip or cause page overflow.
  Compact and error-route header rules stay unchanged.
- **Evidence:** Save and inspect header/menu screenshots, navigation/focus
  observations, and measurements in `qa-artifacts/QA-214/`.
- **Cleanup:** Close the menu and restore the original viewport and dark theme.
  Do not change identity or clear existing storage.
- **Status:** pending.

Coverage: QA-214 supersedes mobile header wrapping expectations in QA-199 and
QA-208. Default source Button sizes still use QA-208. No authentication contract
or account action changes are planned.

Local-source refinement: `components/ui/menu.tsx` uses the style block from
`/home/karyana/Codes/projects/ui/packages/registry/src/components/ui/menu.tsx`.
This removes the older popup edge/border and restores source item sizes,
including 44px coarse-pointer targets. QA-211–214 cover the new menus; repeat
the account menu check in QA-202 for this shared change. No registry install or
Yopem UI dependency upgrade was used.
