# Independent hosted publication acceptance

2026-10-05 Sydney / 2026-10-04 UTC. This is a separate deployed acceptance record; initial and premerge reports remain unchanged at `/tmp/chronoshift-html-adversarial-initial.md` and `/tmp/chronoshift-html-adversarial.md`.

Publication metadata supplied by implementer: PR #31 merged as `46c94a7aa601c339d3946cf9a90e59a6ec74d50b`; trusted successful CI `37225241338` artifact source `15b8accd00efd019921e3aef6df62e8ce4b30dd1`; Pages workflow `37225558616`. This reviewer did not independently re-audit the artifact reuse workflow. The exact public response/source identities below were independently verified before and during the browser journey.

Actual HTTPS origin: `https://tien-lam.github.io/ChronoShift/`. Public release source: `15b8accd00efd019921e3aef6df62e8ce4b30dd1`, base `/ChronoShift/`. Public service worker version: `3ac0e622535455b5`. Worker SHA-256: `a2da153d2902b3dcd3c30ce5ff0c6b7cbf21089b47a09e3f067c5d1a68d1e661`. Canonical HTML SHA-256: `46bf55bbc54450573b173740feab06f293c7231b59154a89792f6401af6ff884`, independently matches worker INTEGRITY and the final cached document.

Environment: macOS arm64, mise-managed Bun 1.4.0, Playwright 1.63.0, actual installed Google Chrome 154.0.8037.93, headless new disposable browser context. TLS unchanged, no timeout overrides, no regular user-profile modifications. Original actual user's Chrome/filter/profile history remains unknown.

Command in `/tmp/chronoshift-adversarial-candidate`:

```sh
ADVERSARIAL_EXPECTED_SOURCE=15b8accd00efd019921e3aef6df62e8ce4b30dd1 ADVERSARIAL_HOSTED_OUTPUT=/tmp/chronoshift-html-hosted-after.json mise exec -- bun hosted.ts
```

The harness asserts exact source and canonical document hash before navigation. BrowserContext routing transforms HTML response bytes by inserting the same benign `<!-- privacy filter inspected this HTML -->` after `<head>` as the previously failing hosted baseline. Transformation changes the network document digest to `4b4d1bc15d1bc5483d27e379f145883da07d0dd05eddf3cbfe3ff3006c401d74`. Every JS/CSS/SW response remains the real deployed HTTPS response. Context routing can intercept SW-owned requests and proved this capability in the baseline; the new worker makes no network HTML installation fetch, so only initial frame HTML required interception.

Journey began `2026-10-04T18:44:32.522Z`. Initial startup probe at `18:44:33.134Z` reported online, controlled false, reason startup/no-controller. Installed at `18:44:35.053Z`; active/readiness true at `18:44:35.060Z`. Clicked target combobox, entered Europe/London, converted `June 18, 2026 at 5:20pm Tokyo`, then waited a full 21 seconds. Total measured initial journey was 21,741ms. Final state: ready true, active controller, no warning, correct London 9:20, unchanged draft. No console errors, page errors, worker errors, external-origin requests, or requests containing conversion input/selected zones were observed.

Closed page, removed network route, set full context offline, opened a new page at the actual HTTPS origin, entered the same new input/target and converted again. Ready true; result 9:20; warning count zero. Screenshot inspected: correct time/date/UTC+01:00 London and draft/target are visible without warning. Cache shell remains the exact canonical CSP-bearing document.

Comparison: hosted original release `01ee9fa94a59f910`, artifact source `b766d5b53063fd6872f55e7d0a052f8e84d802ec`, same Chrome, same response transformation, fresh no-controller journey and real deadline. Baseline intercepted six SW-owned HTML requests and emitted three exact HTML release mismatches, ending unregistered/uncontrolled/not ready with startup warning at 21,312ms. Published candidate intercepts zero SW-owned HTML fetches, installs successfully, remains ready beyond the deadline, and reopens offline. Baseline and candidate both convert correctly while online; candidate independently proves the offline cache/worker usability that the baseline installation cannot provide.

Evidence: `/tmp/chronoshift-html-hosted-before.json`/`.png`, `/tmp/chronoshift-html-hosted-after.json`/`.png`, `/tmp/chronoshift-html-hosted-after-offline.png`. JSON includes exact public identity, hashes, routed request ownership, bounded browser events, timings and state. Input in evidence is a synthetic test string, not user data. Harness: `/tmp/chronoshift-adversarial-candidate/hosted.ts`.

**Implementation verdict: deployed acceptance passes for the exact published artifact and exercised lifecycle.** Retains premerge approval and independent corrupted shell/replaced tree/strict unrelated asset checks. No new blocker observed.

**Original report verdict: faithful equivalent hosted response-transformation failure is reproduced before and prevented after publication.** Exact original release/errors, first-visit no-controller state, retry count, real startup timing and field/conversion journey match available conditions. The candidate removes the implicated network HTML dependency and succeeds offline. Historical transformation agent, actual user's fetched bytes and profile/cache history are still unidentified; this deliberate injection is not claimed to be the user's natural environment. Physical installation/devices, OS sharing and other unexercised capabilities remain outside this acceptance. Ticket status/closure is owned by implementer; reviewer did not modify it.
