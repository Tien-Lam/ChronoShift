# Independent adversarial acceptance audit

Inspected source revision: b432db067ad8176e7f040c74997e2021b629a07c. Read actual saved review brief and AGENTS/review instructions independently. No other reviewer verdict was consulted. No tracked source edits, installations or user browser/session mutations.

Scope: remaining TIE-304/306/309/311/312/314/317/318/320. Derived counterexamples before supplied tests: a delayed share after a user edit/conversion, repeated successful Copy announcements and target-only result replacement, and whether the performance harness can measure the stated phone conditions. Inspected App.tsx, handoff.ts, service-worker handoff/storage/lifecycle, generated manifest handling and browser benchmark; inspected relevant existing app/privacy test assumptions afterwards. This is a bounded audit, not a full runtime certification.

## Actionable finding — P2: delayed share loses a newer draft and leaves stale results copyable

Location: web/src/App.tsx:108-112.

An incoming handoff's asynchronous completion calls setText directly without checking whether the user has edited or converted since startup, or invalidating the worker/results. Reproduction on the exact archived revision production build:

1. Seed a valid, unexpired synthetic IndexedDB handoff for `April 10, 2026 8pm UTC`.
2. Navigate to `/?share=slow-share`; hold only the page IndexedDB open success callback until the subsequent user action completes. The DB and app's conversion worker are real.
3. Type `April 9, 2026 3pm UTC`, Convert and wait for the result.
4. Release the delayed share callback.

Observed: input becomes `April 10, 2026 8pm UTC`; result-source and Copy still refer to `April 9, 2026 3pm UTC`, rendered as `1:00 am Fri, 10 Apr 2026 UTC+10:00 Sydney`. Notice says the new shared text is ready. The newer typed draft is silently lost, and the result remains for a different message. Reproduced twice; diagnostics-enhanced repeat reports no page errors or console errors. This proves an asynchronous ownership defect, not the availability of an OS share target.

Required fix: apply a handoff only if the draft has not been changed since the handoff began; preserve the newer edit and provide a recoverable pending-share path otherwise. When accepting handoff text, use the common edit/invalidation path so a prior or in-flight conversion cannot remain associated with another message. Add independent delayed-handoff coverage with both edited draft and completed/in-flight conversion. Existing healthy single-use share and expiry tests do not exercise this race.

## Bounded announcement observations — no screen-reader verdict

In a disposable profile with a successful mocked Clipboard API, observing both role=status regions:

- First Copy changes notice to `Copied with the date and timezone.`; a second successful Copy produces zero status DOM mutations.
- Filling target with supported city alias Tokyo changes displayed time from 1:00 am to 12:00 am and result zone, but produces zero status DOM mutations. Existing status stays `1 time interpretations found` plus the earlier copied notice.
- Target field has no aria-describedby association to the visual resolved-zone field note.

These are concrete DOM observations to include in the TIE-306/309 screen-reader task, not proof that a named screen reader fails or a certification of accessible operation. A targeted engineering test can enforce intended status/description behavior, but actual screen-reader confirmation remains required.

## Performance harness assessment

scripts/benchmark-browser.ts launches a fresh local desktop browser, uses a 390x844 CSS viewport and local HTTP origin, collects synthetic conversion timing and frame gaps, and explicitly labels phone/network/editing/Clear evidence pending. It cannot itself collect the required named physical-phone production/network/editing/Clear samples. Its limitation is honestly documented; I found no evidence-backed benchmark-result bug within inspected scope. A reusable phone-side measurement path and explicit editing/Clear latency tasks would help obtain TIE-318 evidence later; the current development-machine report must remain supplementary.

## Commands/environment/evidence

- `git rev-parse HEAD`: b432db067ad8176e7f040c74997e2021b629a07c; git diff against it empty.
- Archived exact git revision into `/tmp/chronoshift-acceptance-adversarial/source`; linked existing node_modules without installation.
- `CHRONOSHIFT_SOURCE_COMMIT=b432db067ad8176e7f040c74997e2021b629a07c mise exec -- bun run --cwd /tmp/chronoshift-acceptance-adversarial/source build`: pass. Offline version 0745a8e023bd92e5, 13 assets, base `/`.
- `PORT=4192 mise exec -- bun run --cwd /tmp/chronoshift-acceptance-adversarial/source scripts/serve-web.ts`: dedicated preview, sandbox escalation required for local binding and approved.
- `mise exec -- bun /tmp/chronoshift-acceptance-adversarial/source/review-probe.ts`: focused disposable-profile probe, sandbox escalation required for Chromium launch and approved; first run ~0.54s, diagnostics repeat ~0.48s tool-reported wall time.
- Environment: macOS arm64; mise-managed Bun 1.4.0; bundled headless Chromium 153.0.8010.12; en-AU / Australia/Sydney; synthetic texts only; online healthy controlling cache. Deliberate fault injection holds page IDB completion until the draft conversion completes, with no fixed deadline claim. No OS installation/share menu, physical phone, screen reader, native zoom or actual installed restart was exercised. No undirected suite rerun.
- Evidence: [original probe](adversarial-probe.ts.txt) and [observations](adversarial-before.json) in this directory; the raw probe retains its original temporary output path. The latest result includes no observed page/console errors. Worker console diagnostics were not separately attached.
- Sandbox-only initial attempts failed to bind/launch; these are environment failures, not app defects. Direct mise invocation from new temp cwd also failed trying to trust the copied config; running mise from existing trusted repository cwd resolved it without changing tool configuration.

## Separate verdicts

Implementation: blocker in inspected scope due to reproduced P2 delayed-share draft/result ownership defect. Other observations remain bounded or capability-dependent; no claim of general approval.

Original report / acceptance: no original newly reported runtime bug was supplied to this audit; original-report resolution is not applicable. The nine capability-specific tickets must remain open. This probe does not certify any installed or physical-device behavior, screen-reader task, 200% native zoom or phone p95 performance, and passing a subsequent bounded implementation fix cannot close those acceptance gaps.
