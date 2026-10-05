# TIE-370 independent adversarial original review

Initial independent record, saved before receiving the implementer's lifecycle explanation or another reviewer's verdict. This agent thread was reused from an unrelated, completed unified-menu documentation review; it is **not a fresh-thread-context review**. This assignment used the saved TIE-370 brief, original CI excerpts, repository instructions and affected lifecycle source independently.

## Identity and scope

- Reviewed runtime base: `9373729d8de979a9d7b07e0adfa12a8d6ec49066`; original reported CI revision `150875f`, run `37228236311`.
- Root-produced local build: release source `local`; initial worker `41d334b0440a0edc` is parent/brief provenance, not independently captured before preview startup. Preview `http://127.0.0.1:4264/`, started with `PORT=4264 CHRONOSHIFT_TEST_SERVER=1 mise exec -- bun scripts/serve-web.ts`. The server freezes its HTML/JS/CSS/worker/release fixture maps at startup. No build/source changes by this reviewer.
- A mutable-dist observation during the original probes recorded SHA-256: sw.js `d8a7ecec90175cf7e0cadfd6f4f31c93439a706942b0ab843890a4c2499dc453`; main index-BRfazo2p.js `df48eadefaa3fe7d7a8ac31c64752129d81c62e00a55dcde2e155319eff6ce22`; conversion worker-C690IjaR.js `e17b01198be6045d352561d10fe1f6004eb83d106b13f16ef027f0ec36230704`; index.html `ad40954ba8e46c1e4f5bc6ab294228b6823956840c47bfc289569fdf99da3b23`. A later observation found root's mutable dist at worker `54d351454214d082` and different sw/index hashes. Those mutable-dist hashes do **not** independently prove frozen fixture build provenance; the raw snapshots retain actual served cache entry hashes and worker-reported `test-first`/`test-second` identities. Candidate production files changed concurrently after these probes; do not claim they were tested here.
- Browser: Playwright 1.63.0 bundled Chromium `153.0.8010.12`, headless macOS 27.0.1 (26A434), ARM64, 900×640, en-AU, Australia/Sydney; Bun 1.4.0 through mise. Each probe has a fresh browser context; the retained second tab deliberately keeps the old active worker alive. This is not the original Ubuntu CI environment.
- Read surrounding `offline.ts`, worker install/activate/CHECK_READY handlers, App explicit update/draft preservation, release fixtures, original uncontrolled test, console helper and its existing unit expectations. Candidate CI/test edits were concurrently visible; original retention policy was separately read with `git show HEAD:...`. No candidate verdict is inferred here.

## Independent hypotheses and controlled observations

Before fault injection, plausible competing paths were: an old worker answering without claiming the hard-refreshed document; explicit-update controllerchange/reload ordering; a successful readiness reply arriving after the probe closes; and damaged/mixed caches. The existing test replaces **both** 15,000 ms startup and readiness probe timers with 200 ms. That budget is a meaningful independent timing hypothesis because CI has four parallel workers; parallelism alone does not prove the original cause.

Commands, each once for a specific hypothesis:

```sh
mise exec -- bun docs/qa/ci-lifecycle-2026-10-05/adversarial/probe.ts baseline
mise exec -- bun docs/qa/ci-lifecycle-2026-10-05/adversarial/probe.ts delayed-reply
mise exec -- bun docs/qa/ci-lifecycle-2026-10-05/adversarial/probe.ts real-budget
```

The probe performs actual CDP `Page.reload(ignoreCache: true)`, synthetic Tokyo message conversion, a retained controlled old tab, and visible explicit Update now. Snapshots distinguish active/waiting/installing/controller and request CHECK_READY with repair/claim disabled, retaining cache path/size/SHA-256 inventories. These metadata probes cannot activate a waiting worker. Detailed app logs use synchronous console text capture to avoid the reported asynchronous handle-navigation failure. Evidence contains an explicitly synthetic test draft, not user input.

| Probe                                     | UTC start/end             | Outcome                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Baseline                                  | 05:10:29.433–05:10:44.731 | Old active worker `test-first`, no controller after hard refresh; waiting `test-second` installed; warning and ready=false. Explicit update restored the draft with controller/active `test-second`, ready=true, no warning through the final >10-second observation.                                                                                         |
| Delayed reply, existing compressed budget | 05:10:54.126–05:11:11.637 | Same journey, but only readiness-port delivery after accepted-update reload delayed 350 ms. Startup/probe timeout at ~200 ms. Restored draft and activated `test-second` controller remain, while ready=false and warning persist beyond 10 seconds. Worker CHECK_READY still reports ready=true, unavailable=[]; each retained release has 13 cache entries. |
| Same delay, native 15-second budget       | 05:11:24.724–05:11:42.217 | Same 350 ms reply delay; restored draft, activated `test-second` controller and ready=true. App logs show a successful 360 ms probe. This control establishes budget crossing, rather than a cache-integrity or activation failure, for this deliberately injected mechanism.                                                                                 |

Raw evidence: [probe source](adversarial/probe.ts), [baseline](adversarial/baseline.json), [delayed reply](adversarial/delayed-reply.json), [native budget control](adversarial/real-budget.json). The injected MessageChannel wrapper delays only dispatch to page handlers, leaving worker activation, cache validation and native delivery intact. Read-only snapshot replies are also delayed by 350 ms, but use a separate 1.2-second deadline.

## Findings and separate verdicts

1. **Proved adjacent timing failure:** the compressed 200 ms readiness budget can reject a correct new-controller/intact-cache reply; subsequent delivery is ignored because the timed-out probe has closed. A controlled delay reproduces the report's restored-draft/ready=false symptom. This does not prove the historical CI event took this path. Avoid claiming an offline integrity fix from this observation or increasing assertion timeout while retaining the 200 ms probe deadline.
2. **Proved diagnostics policy defect at base:** `trace: on-first-retry` retains no first-attempt trace, and `if: failure()` skips diagnostics upload when a retry ultimately succeeds. The preserved original CI summary explicitly has two flaky tests, not a wholly clean run. First-attempt evidence must survive a successful retry with bounded retention.
3. The existing TIE-371 console helper reserves stable event slots, tolerates the specific destroyed-execution-context error and surfaces unexpected errors via `flush()`. Existing independent unit expectations cover ordering, waiting and genuine rejection; this unchanged scope was inspected, not rerun as a new fix.

**Implementation verdict at base:** blockers remain for failed-first-attempt retention and for calling the legacy-update CI test robust under its compressed reply deadline. No production integrity/activation defect was established by these probes; candidate review pending.

**Original-report verdict:** the unmodified baseline passed, and a bounded timing equivalent was demonstrated. Original Chromium CI cause remains **unverified** because its controller/cache/probe timing evidence was not retained. The original WebKit asynchronous capture exception is covered by the already present TIE-371 helper behavior; artifact retention still needs candidate validation. Clean reruns cannot retrospectively resolve the original Chromium diagnosis.

## Evidence gaps

These are local Chromium synthetic releases based on the current build, not downloaded immutable historical CI artifacts. The fixture retains old immutable network assets; this run does not establish Pages replacement recovery, damaged-cache repair or installation behavior. No physical phones, installed modes, assistive technology or original CI load was exercised. The native-budget control verifies delivery within the normal deadline, not a reply delayed beyond 15 seconds. No full suite or unexplained repeated run was used.
