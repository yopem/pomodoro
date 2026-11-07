# Web application QA

## Scope and setup

Task: create a web-only Pomofocus alternative with basic and premium features,
Yopem UI and StyleX, and guest use. Exclude Todoist and webhooks. Application
implementation has not started. Expand this plan before implementation.

Affected files now: `bunfig.toml` (existing policy), `.gitignore`, and this
plan. No application routes, endpoints, roles, or services exist yet. No server
was started. Intended local web port is 3000. Confirm actual scripts and
bindings once application setup exists. Never use reference-site account data as
fixtures.

Runtime available: Bun `1.4.4-canary.1+a8fcd319b`. Setup checks alone have user
approval. Application QA, application builds, and runtime probes remain
deferred. Do not treat setup checks as permission for whole-application QA.

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
- **Status:** pending; no application scaffold exists yet.

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
- **Status:** pending; implementation and final executable mappings are
  required.
