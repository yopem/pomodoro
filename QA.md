# Pomodoro QA

Run workflows, not the full checklist, for a small change. Use the sections
below as the coverage map. Select the affected section and any shared boundary
that changed. For a release, run P0 before P1, then P2. Reuse setup and capture
one evidence bundle per case. When a case has variants, record the result of
each variant before you mark the case passed.

## Shared setup and evidence

1. Record the revision, installed Bun and Rust versions, local web and API
   origins, browser version, and approved scope. Check for existing services
   before startup. Use pinned tools and lockfiles. Lint, format, and typecheck
   can run by default; builds, tests, browser/API runs, and service changes need
   approval. Use Playwriter in this project's tab group for browser runs.
2. Use only approved isolated non-production resources. Guest runs start with
   `GET /api/session` returning 200 and `user: null`. For account runs, use a
   dedicated test account A; add account B or a second tab only where needed and
   approved. Do not copy cookies, read secrets, or use another project's
   services. If prerequisites are missing, record the case as blocked.
3. From the repository root, use the documented commands. Get paths, methods,
   request bodies, and expected responses from current OpenAPI and source; do
   not guess a payload. Use the exact fixtures in the case or its detailed
   reference. When a case modifies a workspace, save its baseline first.
4. Save sanitized results in ignored `qa-artifacts/<run>/<case-id>/`. For
   browser work, save a screenshot, trace, or state comparison; for HTTP work,
   save the status, safe headers, and relevant body fields; for static or build
   work, save command output. Inspect the evidence. Record date, revision,
   environment, result (`pending`, `passed`, `failed`, or `blocked`), artifact
   path, and failures or blockers by variant. Unchecked cases are pending unless
   a run record says otherwise.
5. Remove only named QA records. Restore the original data, session, route,
   browser settings, and cache or network settings that the case changed.
   Release held responses and remove only case-owned handlers. Stop only
   case-owned services. Read-only cases need no data cleanup.

**Detailed procedures and prior results:** old `QA-###` IDs refer to `QA.md` at
`437375bb856c` (`git show 437375bb856c:QA.md`). The previous edited checklist is
also available locally in ignored `docs/qa-case-history.md`. Use the linked IDs
for fault injection, exact fixtures, and prior evidence, not as separate
checklists to rerun. Old approvals and passes do not apply to a new revision. If
a prior procedure differs from current source or approval, stop and record what
needs confirmation.

## Account, privacy, and public boundaries

- [ ] **QA-301 · P0 — OAuth entry and callback.** With an approved issuer test
      account, open `/auth/login`, `/auth/login/`, and `/auth/login?example=1`.
      Verify the login page sends users to `/auth/authorize`, not back to
      itself; verify callback, logout, `/auth/login/extra`, `/auth/unknown`, and
      `/api/unknown` do not render the login page or the frontend fallback.
      Check login HTML for `no-store`, `noindex`, CSP, and a request ID.
      Complete one safe local return. Use the isolated callback variants in
      QA-015: altered state, missing verifier, and repeated callback. Verify no
      session is issued for a denied callback and return paths stay local.
      Reference: QA-015, QA-129, QA-137–141, QA-147.
- [ ] **QA-302 · P0 — Account boundary.** In A's workspace create
      `QA-private-A`. Switch to approved B in the account test setup. Repeat A's
      captured workspace read, save, import, and logout using B's session and
      A's `X-Pomodoro-User` header. With equal workspace revisions, expect 409
      for the mismatch and 400 for missing or malformed headers. Check that B
      stays signed in, neither workspace changes, and no private data is
      returned. Verify a fresh B request works. Repeat the denial check with an
      invalid or expired session against the current contract. Reference:
      QA-016, QA-034, QA-045, QA-053.
- [ ] **QA-303 · P0 — Session or partition failure.** With `QA-private-A`
      visible, fail the next partition read per QA-028. Verify A's data
      disappears from the new context. Resume a queued action after the owner
      changes and again after A returns. Verify no stale action or response
      takes effect. Reference: QA-028, QA-034–035, QA-053.
- [ ] **QA-304 · P0 — Logout when local data is unavailable.** In approved A,
      block the account cache, fail session verification, and separately inject
      a cache error after the server confirms logout. Use the account recovery
      UI to sign out in each variant. Check the confirmed signed-out state and
      that prior private content cannot reappear; a failed server logout must
      not claim success. Reference: QA-099–102, QA-220.
- [ ] **QA-305 · P0 — SSR CSP and security headers.** Request `/` twice in
      parallel. Compare each response's CSP with its own script nonces, verify
      different nonces, and verify that the authorized app hydrates under the
      policy. Check same-origin headers and production-only HTTPS/HSTS in the
      approved environment. Use QA-037 for the browser CSP check. Reference:
      QA-037, QA-066, QA-141.
- [ ] **QA-306 · P0 — Trusted proxy addresses.** In an approved isolated API
      with `TRUSTED_PROXY_IPS=127.0.0.3`, use the reserved addresses and
      malformed header variants in QA-071. Verify that only the configured peer
      can supply one valid client address and that rate limits use the intended
      identity. Reference: QA-071.
- [ ] **QA-307 · P0 — Private responses stay out of PWA caches.** With the
      installed production worker and A signed in, visit API, auth, and private
      pages per QA-134. Inspect Cache Storage. Verify none of those responses is
      stored or served offline. Repeat after a worker update when cache rules
      change. Reference: QA-020, QA-134.

## Workspace persistence, recovery, and import

- [ ] **QA-308 · P0 — Guest storage and backup isolation.** Create `Study`,
      `Read chapter 1` (estimate 2), and template `Evening`. Reload and export a
      baseline. With the approved guest fault procedure, fail a write and try a
      corrupt or unsupported backup; verify existing work survives and automatic
      recovery copies stay bounded. Review a valid backup, cancel, then repeat
      and confirm as the original owner. In an approved account variant, switch
      owner after review; old confirmation must never replace the new workspace.
      Reference: QA-004–005, QA-029–031, QA-057, QA-148, QA-150, QA-155,
      QA-161–163, QA-218.
- [ ] **QA-309 · P0 — Concurrent saves and stale cache.** Open two approved A
      tabs. Add `Read` and `Review` independently; then edit notes to
      `older tab` and `newer persisted` with a delayed storage event. Force a
      revision conflict. Verify valid additions converge, newer persisted work
      is not overwritten, and an unready or stale tab cannot dispatch. Compare
      server revision and both tabs after reload. Reference: QA-017, QA-059,
      QA-090–091, QA-119, QA-145–146.
- [ ] **QA-310 · P0 — Uncertain save after reload.** Hold the response to
      `PUT /api/workspace` for `Read` after the server commits, then reload and
      recover. Repeat for reload before send and missing primary data. Verify
      recovery preserves the original request identity, never duplicates a
      write, and only retires the journal after it can confirm the result. A
      missing cache with no pending work must restore the account copy.
      Reference: QA-054, QA-086–087, QA-097, QA-103–104.
- [ ] **QA-311 · P0 — Recovery fences and storage failures.** Run the delayed
      original save and import with the account-copy choice. Repeat with an
      uncertain replacement fence and with failure during local replacement
      after a later edit. Verify old work cannot overwrite the selected copy,
      later edits survive, and uncommitted fences are not acknowledged. A
      corrupt or unknown journal must remain preserved and must not dispatch.
      Use the controlled failure points in QA-058 and QA-092–095. Reference:
      QA-058, QA-088–089, QA-092–095, QA-112–116.
- [ ] **QA-312 · P0 — Explicit and repeatable guest import.** Start with guest
      task `Read` and account task `Review`. Check that the UI explains the
      scope for timer and settings, and that cancel does not write. Import once.
      Run the interrupted cases before the marker, after the marker, and before
      retirement with exact retry data; repeat with absent/different marker,
      journal failure, and a metadata write. Verify no duplicate records, no
      lost pending import, and no import or retirement under a different owner.
      Compare guest and account snapshots and the saved receipt. Reference:
      QA-018, QA-055, QA-080, QA-096, QA-110–116, QA-118.
- [ ] **QA-313 · P1 — Workspace request validation.** With isolated data, use
      current OpenAPI to build save/import envelopes of 20,000,000 and
      20,000,001 UTF-8 bytes. Include Japanese text and emoji. Repeat with
      missing fields, unknown fields, malformed Unicode, PostgreSQL null
      characters, duplicate keys, and the documented safe JSON and non-JSON
      errors. Verify exact status and error shape, supported Unicode round-trip,
      and no mutation on rejection. Check generated client alignment once for
      both operations. Reference: QA-022–023, QA-032–033, QA-047, QA-052.
- [ ] **QA-314 · P0 — Workspace size without data loss.** Build near-limit guest
      and account fixtures using QA-105–108. Verify browser JSON byte counts
      agree with the server. Reject a merge over the limit without losing either
      copy or changing revisions or receipts. For an oversized legacy workspace,
      check that the recovery and export paths still work. Reference:
      QA-105–108.
- [ ] **QA-315 · P1 — Account timeouts and retry UI.** In A, delay session read,
      workspace read, save, import, and logout beyond 30 seconds; cancel one
      read before the deadline. Verify bounded pending state, accurate status
      and conditional retry, and no state change from a canceled or obsolete
      response. Reference: QA-056, QA-142, QA-146.

## Timer, tasks, and collections

- [ ] **QA-316 · P1 — Timer lifecycle.** In an isolated guest workspace, select
      `Read chapter 1`, start a focus run, briefly pause, resume, and reload
      while running. Let it complete and reload again. Verify the finish
      estimate and progress follow active time, short pauses keep fractional
      time, and history gains exactly one record. Check skip and reset
      separately with no extra record. Reference: QA-006–008, QA-027,
      QA-050–051, QA-174, QA-225.
- [ ] **QA-317 · P1 — Obsolete timer controls.** With a running timer, open its
      reset, skip, or phase-change confirmation. Pause/resume, replace the run,
      or let the original run complete before submitting, using the variants in
      QA-038–043. Verify a stale control cannot act on the replacement run and
      natural completion wins without duplicate history. Reference: QA-038–043.
- [ ] **QA-318 · P1 — Task queue.** Create `Read chapter 1` (estimate 2, note
      `Pages 1–10`) and `Review notes` (estimate 1). Edit, reorder, select, and
      complete the tasks. Cancel one removal, then remove the intended task.
      Reload to verify identity, order, notes, and timer selection. Repeat menu
      and editor actions by keyboard and verify focus returns. Reference:
      QA-009, QA-046, QA-200, QA-211–213, QA-215.
- [ ] **QA-319 · P1 — Projects and templates.** Add `Study`, link a focus
      record, and archive it. Create `Template 1` through `Template 4`, each
      with task `Read` and estimate 1. Apply a template, reload, and check the
      task, project label (including the archived label), and unchanged old
      history. Check editor focus return and project color selection during the
      same run. Reference: QA-010–011, QA-049, QA-156, QA-201, QA-224,
      QA-227–228.
- [ ] **QA-320 · P1 — Focus mode controls.** On `/focus`, start the timer and
      use compact mode and supported browser focus controls, including the
      icon-only controls with keyboard and screen-reader names. Return to `/`
      and verify the same run continues. If the browser does not support an
      optional control, verify the fallback. Reference: QA-048, QA-180.

## History, reports, CSV, and Settings

- [ ] **QA-321 · P1 — Report totals, filters, and date boundaries.** Create
      `Study` records of 25 minutes on `2026-01-01` and 50 on `2026-01-02`; use
      `/reports` to check the sum, each day, and the streak. Also use
      `/reports/?period=week&date=2024-02-28&page=1`; page, change the range,
      and use Back/Forward. Verify the selected year, time zone, queued page
      actions, keyboard focus, and URL agree. Cross local midnight per QA-051.
      For account data, reload after sync and verify the same records and totals
      return. Reference: QA-012, QA-026, QA-044, QA-051, QA-136, QA-157,
      QA-164–165, QA-167, QA-206, QA-222–223.
- [ ] **QA-322 · P1 — Manual history validation.** Enter task `Read`, 25 minutes
      on `2026-01-01` in `Study`. Verify the saved row and report totals. Repeat
      with 0, -1, empty title, and reversed start/end times. Verify errors
      appear once per field, the first invalid control receives focus, and no
      invalid row is stored. Reference: QA-014, QA-117, QA-158, QA-206.
- [ ] **QA-323 · P0 — Scoped, formula-safe CSV.** Export records for
      `2024-02-28` through `2024-02-29` with Hours, Tab, and Include task names.
      Include task name `=1+1`, one out-of-range record, and a record from B if
      using account data. Inspect the file as text: no out-of-scope records,
      expected units and separator, and formula-like text is neutralized. Verify
      reversed and empty ranges as specified in QA-159. Reference: QA-013,
      QA-159.
- [ ] **QA-324 · P1 — Settings save and conflict.** At `/settings`, set Focus
      minutes to 25, change theme and week start, and save with the final page
      action. Check success, focus return, and persistence after reload. Check 1
      and 180 as valid; check 0, 181, empty, and 1.5 as invalid. Invalid values
      must not write; errors must be linked to the field. Dirty the draft,
      change first day of week from an approved peer, and use the explicit
      reload control; verify no silent overwrite. Inject a save failure and
      check status stays accurate. Reference: QA-135, QA-143, QA-149,
      QA-151–152, QA-154, QA-169, QA-177–178, QA-202, QA-216–218, QA-226.
- [ ] **QA-325 · P0 — Destructive confirmations.** From Account, backup restore,
      and the task menu, open each destructive confirmation by keyboard. With
      the named fixture from its detailed procedure, cancel and reopen before
      confirming. Verify no mutation on open/cancel, only the named target on
      confirm, and focus return. Repeat a pending confirmation and verify it
      cannot dispatch twice. With an approved failure, verify the error stays
      visible and retry does not lose the target. Run owner-change restore in
      QA-308, not again here. Reference: QA-144, QA-161, QA-212–213, QA-219.

## Completion alerts

- [ ] **QA-326 · P1 — Notification delivery and navigation.** Complete one
      isolated timer in an installed PWA and in the supported desktop fallback.
      Try granted and denied permission, turn off alerts while a delivery is
      pending, and inject a delivery failure. Verify no duplicate or disabled
      notification, safe failure status, and click-to-open without losing an
      open form. Do not send notifications outside the isolated origin.
      Reference: QA-019, QA-076, QA-078–081, QA-098.
- [ ] **QA-327 · P0 — Stale alerts cannot cross owners.** Queue a completion
      notification and a sound callback, change owners before delivery, and
      repeat with an unready workspace. Verify the old sound or notification
      does not appear for the new owner. Reference: QA-077, QA-084, QA-101.
- [ ] **QA-328 · P1 — Sound activation and missed alarms.** Reload a running
      timer in a browser that requires audio activation. Verify it offers
      activation, a miss does not replay after the next interaction, and a
      failed audio path does not block completion or the next timer. Reference:
      QA-019, QA-082–085.

## Browser shell, accessibility, and PWA

- [ ] **QA-329 · P1 — Navigation and responsive controls.** At 320 and 1440 CSS
      pixels, use the header to open `/`, `/focus`, `/projects`, `/templates`,
      `/reports`, and `/settings`. During that pass use a keyboard and screen
      reader for the navigation menu, Account, a Select, and a long dialog.
      Check visible focus, labels, Escape and focus return, reachable dialog
      actions, one main heading, and no clipping or horizontal overflow. Verify
      at 200% zoom and 400% reflow where applicable. Reference: QA-021, QA-024,
      QA-067–068, QA-073, QA-142, QA-160, QA-168, QA-170, QA-179, QA-203,
      QA-214–215.
- [ ] **QA-330 · P1 — Loading and hydration.** At 320 and 1440 CSS pixels, hold
      only the client entry for `/`, `/focus`, `/reports`, and `/settings` using
      the bounded delay in QA-221. Reuse the same loaded reference, capture
      light and dark states, and check reduced motion. Verify visible
      placeholders match the loaded geometry, are not focusable, and expose one
      loading status. Release scripts and check content and controls replace
      placeholders without hydration errors or changed data. Reference: QA-128,
      QA-153, QA-171–172, QA-194, QA-204, QA-215, QA-221.
- [ ] **QA-331 · P1 — Route error recovery.** Open an unknown local URL, then
      reproduce the approved route error from QA-132. Verify the unknown route
      is a 404, a failure is not shown as success or an empty state, and the
      error shell offers a usable path back to `/`. Confirm workspace contents
      do not change. Reference: QA-131–132, QA-173.
- [ ] **QA-332 · P1 — Install and offline recovery.** From an approved
      production build (shared setup), open `/` in a browser profile with no app
      installed. Inspect `/icons/site.webmanifest` in DevTools, then install
      `Pomodoro by Yopem`. Check that both PNG icons load at their declared 192
      and 512 pixel sizes for normal and maskable use. Launch in standalone mode
      at `/`. In Cache Storage, confirm the worker precaches `/offline.html`,
      `/offline.css`, and `/icons/favicon.svg`. Set the viewport to 320 CSS
      pixels, then go offline and open an uncached `/reports`. Expect the
      offline page to show the Yopem mark and “You’re offline” without missing
      assets in light or dark mode. Reconnect and activate “Try opening the
      timer” with the keyboard. Expect `/` and saved local work, with no false
      sync confirmation. Save the manifest, launch view, and offline screenshots
      under `qa-artifacts/<run>/QA-332/`. Uninstall the test app and restore
      network and theme settings. Status: pending. Affects the static manifest,
      offline assets, and `vite.config.ts`. Reference: QA-020, QA-133, QA-205.
- [ ] **QA-333 · P1 — PWA update and worker failure.** In the same approved
      installation, record caches and serve an approved newer build. Verify
      update is announced, requires confirmation, activates before reload, and
      removes old app caches. For the branding update, start from the prior
      build with `/manifest.webmanifest` and `/favicon.svg`, then update to the
      current build. Check that Cache Storage drops the old icon and that `/`
      uses `/icons/site.webmanifest` after reload. Save both cache listings in
      `qa-artifacts/<run>/QA-333/`. Inject a registration failure and verify
      safe feedback; confirm development does not register the worker. Restore
      the browser profile after collecting evidence. Status: pending. Reference:
      QA-025, QA-070.
- [ ] **QA-334 · P1 — Public metadata and sitemap.** Request `/`,
      `/sitemap.xml`, `/robots.txt`, and private routes from QA-061. Verify
      public timer content and canonical metadata are in SSR, private routes are
      not in the sitemap and are not indexed, and any structured data matches
      visible content. In an approved isolated production build configured with
      `PUBLIC_ORIGIN=https://pomodoro.yopem.com` (use the isolated listener, not
      the live host), inspect the HTML head for `/`. Expect the canonical URL
      and Open Graph URL to be `https://pomodoro.yopem.com/`. Expect Open Graph
      and Twitter to use `https://pomodoro.yopem.com/og.png`, with Yopem image
      text and Pomodoro as the service name. Request `/og.png` on that listener;
      expect 200 and the supplied 3500 × 1440 PNG. Verify the sitemap lists only
      the production home URL and `robots.txt` points to that sitemap. Save the
      sanitized head, discovery responses, and image headers under
      `qa-artifacts/<run>/QA-334/`. No data cleanup. Status: pending. Affects
      `apps/web/src/routes/index.tsx` and the documented production origin.
      Reference: QA-061, QA-147, QA-181–182.
- [ ] **QA-340 · P1 — Yopem mark and browser icons.** With the shared web setup,
      open `/projects` as a guest in a fresh browser profile. At 320 and 1440
      CSS pixels, switch between light and dark themes. The header must show the
      Yopem SVG mark at both widths, with no missing image or loss of contrast.
      Expect the Pomodoro service label at 1440 CSS pixels and the mark alone at
      320 CSS pixels. Tab to the “Pomodoro by Yopem” link and press Enter;
      expect `/` and no change to saved records. Inspect the document head and
      check that `/icons/favicon.svg`, `/icons/favicon-96x96.png`,
      `/icons/favicon.ico`, and `/icons/apple-touch-icon.png` return 200 and
      show the Yopem mark. Save screenshots and status codes under
      `qa-artifacts/<run>/QA-340/`. Restore theme and viewport. Status: pending.
      Affects `app-shell.tsx`, `__root.tsx`, and `apps/web/public/icons/`.

## Tooling, build, and local services

- [ ] **QA-335 · P1 — Static policy and CI.** From the repository root run
      `bun run lint`, `bun run format:check`, and `bun run typecheck`. Verify
      the CI and Lefthook tasks still invoke their intended checks on affected
      targets. When policy changes, use the positive and negative examples in
      QA-001–002; do not count a passing run as proof that an omitted rule is
      enabled. Reference: QA-001–003, QA-036, QA-121.
- [ ] **QA-336 · P1 — Production artifacts.** With build approval, run
      `bun run build` from the repository root. Inspect route chunks, extracted
      StyleX CSS and Geist font assets, generated worker, and SSR hydration on
      the approved origin. With container approval, check locked builds,
      separate web and API processes, same-origin routing, and graceful
      shutdown. Use current config, not the old binary revision or sample ports
      in QA-072. Reference: QA-066, QA-069–070, QA-072, QA-204, QA-207, QA-209.
- [ ] **QA-337 · P1 — Isolated database setup and failure.** Only on a fresh,
      approved local volume, set `LOCAL_POSTGRES_PASSWORD` and the matching
      `DATABASE_URL` without printing either. Run `bun run db:migrate` from the
      repository root and verify account data persists. For supervision changes,
      run the adopted-helper failure in separate disposable containers per
      QA-122. Verify the supervised database stays ready and the active request
      completes. Reference: QA-060, QA-122, QA-130.
- [ ] **QA-338 · P1 — Locked dependency advisories.** On a lockfile change or
      before release, use the approved public advisory procedure in QA-074 for
      `bun.lock` and `Cargo.lock`. Keep a sanitized report of relevant
      advisories, unavailable scanners, and disposition. Reference: QA-074.

## Visual changes only

- [ ] **QA-339 · P2 — Shared presentation.** Reuse screenshots from QA-329 and
      QA-330 when possible. At 320 and 1440 CSS pixels in light and dark mode,
      compare the changed screen against its loaded reference. Check shared
      control sizes, task card edges, typography, and overlay spacing. For timer
      ring changes, check shape in fullscreen, unobstructed text and controls,
      and a decorative SVG that adds no focus stop or announcement on each tick.
      For alert color changes, measure text contrast against its card in both
      themes. Reference: QA-049, QA-075, QA-175–176, QA-179, QA-198–201, QA-204,
      QA-207–211, QA-219, QA-225.

Payments, external task integrations, webhooks, analytics, queues, and native
clients are outside this QA plan because the app does not use them.
