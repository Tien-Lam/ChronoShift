# Independent published acceptance and original-report resolution — 2026-10-05

Implementation reviewed:63c9cdc442eac03c30dbae7871d1452b1049c7b0. Published artifact source observed from HTTPS release.json:4a771b9d102dbcaf3a807f096fb26861bbfa8e5f, base/ChronoShift/. Worker observed in fetched script AND active CHECK_READY response:1daf9e89c308221a. Runtime index-DJzqWUF9.js retrieved with HTTP200 and SHA2564a0ebd9c9605283a04e8f38c6f08233f3b5935a313410e9953c2ddab1bc7809a, identical to independently reviewed archive runtime. Main merge54cc09e1c8a14dceddf36083893436a57f78bae5 and successful Pages publication run37227337390 supplied by implementer; this review independently verifies actual served source/worker/runtime identity and browser behavior. Site https://tien-lam.github.io/ChronoShift/.

Actual installed Google Chrome154.0.8037.93 on macOS, Playwright1.63.0 headless ephemeral profile, en-AU locale/Australia-Sydney timezone, no extensions/user regular-profile modifications. Bun1.4.0 via existing mise runtime. Command `bun /tmp/chronoshift-uncontrolled-adversarial-hosted-after.ts 4a771b9d102dbcaf3a807f096fb26861bbfa8e5f` exited0. No runtime source edits or repeated app gate.

## Matching actual hosted journey

Fresh visit installs and reports offline-ready. Then actual Chrome CDP Page.reload(ignoreCache:true) hardrefreshes the same tab. At2026-10-04T19:15:49.863Z registration succeeds controlled:false; active exact worker activated, no installing or waiting worker, exact scope matches, initial probes uncontrolled. Controller-change occurs at19:15:49.866Z (3ms later), readiness response at19:15:49.868Z is ready:true/controlled:true with actual published worker1daf9e89c308221a. The worker reclaims the previously uncontrolled document without navigation.

The same tab remains open for ordinary use: target field focus/change committed at document+12.068s, conversion clicked at+13.075s. Independent expected Tokyo17:20 June18→London09:20 result is rendered as9:20am. At+17.016s, beyond the real15-second startup deadline, controller and active worker are activated, offline-ready true, warning list empty, original input preserved and conversion9:20am still visible. Exactly two main navigations (initial visit and user-requested hardrefresh): no automatic reload.

Close the page, disable network via Chrome/Playwright offline emulation, and reopen normal cached navigation: activated controller, offline-ready true, fresh conversion9:20am succeeds, no warnings. Screenshot inspection confirms conversion/result and no startup warning. No console errors or pageerrors; no diagnostic argument/context loss in the successful final run.

## Failed helper run retained

The first helper invocation hit a30-second wait timeout because it expected exact hero text9:20 while en-AU device format displays9:20am. Independent debug captured readiness true, no warnings and correct9:20am. Saved first helper, classification and debug evidence; corrected only the helper's format-aware exact time assertion, then reran the complete matching hosted journey successfully. This is an identified helper assertion mismatch, not an application lifecycle failure. First invocation lacked step/failure-state capture; that instrumentation limitation is retained explicitly in the first-failure record.

## Separate verdicts

Implementation: APPROVED for the independently reviewed activated-registration/control recovery, explicit waiting-update/draft-preservation and offline-navigation scope. Published runtime bytes match that reviewed implementation; actual hosted journey passes.

Original report: MATCHED AND RESOLVED for the reported persistent uncontrolled same-tab lifecycle. The original previous-hosted artifact reproduced successful registration/no installing state/no-controller0/1/4s and15s warning while conversion worked. User later clarified the normal-use recurrence occurred in the SAME earlier HARD-REFRESHED tab; both descriptions therefore match the same observed lifecycle. Exact new published candidate now recovers control/readiness, preserves ordinary+12s/+13s usage and has no warning beyond17s, plus usable subsequent offline reopen. Prior local old-worker→new-candidate transition separately verified available explicit Update now and restored draft through one accepted reload; no automatic waiting-worker activation.

Unknown historical worker identity and user's exact Chrome version/profile remain qualified. This equivalent actual Chrome reproduction and matching post-publication journey provide report acceptance; no claim of exhaustive browser/extension/device certification or AdGuard causation. No separate unexplained normal-navigation recurrence remains established by the clarified report.

Evidence: /tmp/chronoshift-uncontrolled-adversarial-hosted-after.json; /tmp/chronoshift-uncontrolled-adversarial-hosted-after.png; /tmp/chronoshift-uncontrolled-adversarial-hosted-after-offline.png; harness hosted-after.ts; failure record hosted-first-failure.md; first helper hosted-after-first-harness.ts; hosted-debug.json/.ts. Earlier reports and clarification remain unchanged at /tmp/chronoshift-uncontrolled-adversarial{,-final,-clarification}.md.
