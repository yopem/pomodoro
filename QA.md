# Web application QA

## Scope and setup

Task: create a web-only Pomofocus alternative with basic and premium features,
Yopem UI and StyleX, guest use, and account sync. Exclude Todoist and webhooks.
Implementation is in progress. Runtime QA has not run.

Frontend scope: `apps/web/src/`, `packages/env/`, app-owned UI, and root Bun
configuration. Routes are `/`, `/projects`, `/templates`, `/reports`, and
`/settings`. Rust contract scope is `apps/server/src/contract.rs` and its
offline OpenAPI exporter. HTTP handlers, account sync, and persistence are not
complete. Do not treat contract export as a running API.

Use `http://127.0.0.1:13001` for web QA. The required backend address is
`http://127.0.0.1:18001`; web proxies `/api`, `/auth`, and `/openapi.json` to
it. No development server was started for this work. Before an approved runtime
pass, check existing listeners. Do not start another server or change ports.
After approval, the existing root web command is `bun run dev`. An API start
command remains blocked until its runtime entrypoint exists. Never use
reference-site account data as fixtures. Confirm isolated database targets
before any connection, migration, or seed.

Runtime: Bun `1.4.4-canary.1+a8fcd319b`, pinned by `bun-toolchain.json`, and
Rust `1.97.1`, pinned by `rust-toolchain.toml`. Use `bun.lock` and `Cargo.lock`.
Native lint, format, and typechecks, plus Cargo checks, Clippy, and Rustfmt, are
allowed. Offline OpenAPI export and typed-client generation have explicit
approval. Application tests, browser/API probes, builds outside the offline
exporter, database access, migrations, and deployment remain deferred. These
permissions do not authorize a whole-application QA pass.

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

| Requirement or workflow                                       | Coverage                                                 |
| ------------------------------------------------------------- | -------------------------------------------------------- |
| Native tooling and required plugin support                    | QA-001, QA-002                                           |
| Yopem UI, StyleX, and framework setup                         | QA-003                                                   |
| Timer, breaks, persistence, background/reload recovery        | Pending implementation plan                              |
| Tasks, estimates, notes, completion, order, finish estimate   | Pending implementation plan                              |
| Projects and unlimited task templates                         | Pending implementation plan                              |
| Daily/weekly/monthly/yearly reports and project totals        | Pending implementation plan                              |
| History editing and CSV downloads                             | Pending reference inspection and implementation plan     |
| Guest use, local data failure, multiple tabs, backup          | Pending persistence decision                             |
| Optional account login and synchronization                    | Blocked: issuer client and subject contract not supplied |
| Settings, audio, notifications and focused window             | Pending supported browser behavior plan                  |
| Responsive UI, keyboard, focus, screen reader, reduced motion | Pending application UI plan                              |
| PWA manifest, offline fallback, update and cache exclusions   | Pending application setup                                |
| SSR metadata, canonical host, sitemap, analytics privacy      | Pending application configuration                        |
| App builds, lint, format, typecheck and regressions           | Deferred: application QA not approved                    |

Payments are not requested: premium capabilities belong to the requested app,
not a new paid tier. Todoist, webhooks, mobile, desktop, and extension apps are
out of scope. Backend authorization and API cases depend on the account/sync
scope; do not invent an HTTP contract or issuer details.

## Planned application cases

These cases define expected behavior before source implementation. Exact route,
control, contract and command mappings must be finalized from the implementation
before execution. Application QA is not approved. Cases that require missing
implementation or resources remain pending, not passed.

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
  normal application errors. No relaxed script directive is needed.
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
