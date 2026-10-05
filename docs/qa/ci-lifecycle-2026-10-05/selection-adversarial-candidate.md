# TIE-374 independent adversarial candidate review

Final inspected head `9c7965acfbcbe034471ad427625eb624792812eb`. Runtime change is `18e40815fd18c30c923d462f6a97fc52d86a8c62`; subsequent `22f751511a0fafa4dbdcf9b151b67803ba8e3f67` and final head only refine new test locators. Reviewed original runtime/report independently in [selection-adversarial-original.md](selection-adversarial-original.md); no other reviewer's candidate verdict read. Reused thread and capability qualifications remain applicable.

Frozen build generated 2026-10-05T05:30:28Z (root provenance), local release source, worker `2eb418e824f28221`. Independently observed SHA-256: sw.js `c1ec28b6b120ead4c22c34b3c24c1750b1b282c6547f673b7e76a5fc7d2b51c0`, index.html `f6d82d24274c508aac8d6420c1ea771f94ca25eae1e2afc6f9328488c2958646`, index-DHi9pTHJ.js `b2ec5e8a200f317d260cd7e596c1f9a8d417f55f4379803a39867553791ae640`, worker-C690IjaR.js `e17b01198be6045d352561d10fe1f6004eb83d106b13f16ef027f0ec36230704`. Runtime hashes remained unchanged after the test-only head changes. Reviewer preview4264 restarted for candidate; no production edits/builds.

Environment: macOS27.0.1 ARM64, mise/Bun1.4.0, Playwright1.63.0 WebKit26.6, en-AU, Australia/Sydney, normal motion. Two distinct profiles: actual configured iPhone13 emulation and same iPhone viewport/user agent with mouse capability (`hasTouch:false`). These do not establish physical iPhone behavior.

## Independent candidate observations

Commands:

```sh
mise exec -- bun /tmp/chronoshift-selection-adversarial/probe.ts touch candidate-touch
mise exec -- bun /tmp/chronoshift-selection-adversarial/probe.ts mouse candidate-mouse
mise exec -- bun /tmp/chronoshift-selection-adversarial/probe.ts touch candidate-touch-offset custom-offset
mise exec -- bun /tmp/chronoshift-selection-adversarial/probe.ts mouse candidate-mouse-offset custom-offset
PLAYWRIGHT_PORT=4264 PLAYWRIGHT_HTML_OUTPUT_DIR=/tmp/chronoshift-selection-adversarial/candidate-manual-report mise exec -- bunx --bun playwright test e2e/imports.spec.ts --project=iphone-emulation --grep 'unresolved target' --retries=0 --output=/tmp/chronoshift-selection-adversarial/candidate-manual-results
```

| Evidence                  | Actual UTC timing                   | Result                                                                                                    |
| ------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Touch-capable matrix      | 05:31:23.974–05:31:36.612           | Ten relevant journeys complete; one investigator offset syntax mistake described below.                   |
| Mouse-capability matrix   | 05:31:34.385–05:31:46.977           | Ten relevant journeys complete, including original causal hover/Tab sequence; same offset syntax mistake. |
| Supported offset touch    | 05:31:56.774–05:31:57.465           | +05:45 preserved on Tab and converts April9 15:00 UTC to8:45 pm.                                          |
| Supported offset mouse    | 05:31:57.770–05:31:58.435           | Same independent exact value/time checks pass.                                                            |
| Original manual-copy test | Actual shell clock05:32:14–05:32:17 | One passed, runner2.5 seconds, no retries or relaxed assertions.                                          |

The normal-motion matrix verifies typed canonical Asia/Tokyo, hover+Tab, hover+outside blur, pointer-selected Osaka, ArrowDown+Enter Osaka, typed alias Osaka, pointer-selected canonical Tokyo, ArrowDown+Tab Osaka, unresolved CST and independent source editing. Both profiles keep Asia/Tokyo after passive hover+Tab and produce12:00 am for the synthetic April9 UTC input. The mouse profile previously changed it to osaka; candidate now retains canonical list focus while the same hover event occurs. Explicit pointer and keyboard navigation still choose the requested alias or canonical option. CST remains unresolved and hides results. Editing source to Europe/London preserves target Asia/Tokyo and explicit UTC source interpretation.

The original unchanged import/copy case retains its independent exact source, target time/date and manual-copy text assertions, plus stale delayed-copy invalidation. It passed on the reported iPhone emulation profile. This verifies more than field equality.

**Investigator correction:** the first two matrices incorrectly expected `UTC+05:45` to be a supported target identifier. The app preserves that literal on blur but correctly has no conversion result; the probe's hero assertion failed. `resolveZone`/existing freeform tests use supported `+05:45` syntax. Only the affected offset case was rerun with that syntax, and exact8:45 pm checks passed in both profiles. The original raw failures are retained and are not app-regression or clean-matrix claims. The earlier original review only observed preservation of the literal, without establishing its validity as a target.

Raw records: [candidate probe](selection-adversarial/candidate-probe.ts), [touch](selection-adversarial/candidate-touch.json), [mouse](selection-adversarial/candidate-mouse.json), [corrected touch offset](selection-adversarial/candidate-touch-offset.json), [corrected mouse offset](selection-adversarial/candidate-mouse-offset.json), [original manual-copy runner](selection-adversarial/candidate-manual-run.log).

## Source and focused test-delta assessment

The runtime adds only `shouldFocusOnHover={byValue ? false : undefined}` to public ListBox. ZoneChoice uses `byValue`, so source and target timezone suggestions share this policy; regular ChoiceSelect keeps its existing default. Controlled input/value ownership, filters, aliases, custom values, keyboard navigation and pointer activation are unchanged. This removes the proven passive-hover focus transition instead of rewriting a committed choice or suppressing Tab generally.

The new test checks both source and target, with exact retained other-field values, canonical selection after hover, final time/date, deliberate ArrowDown/End/Tab alias selection and pointer canonical selection. The first locator refinement excludes hidden exit content; the final refinement associates suggestions with the actual input's `aria-controls` id, avoiding another field's exiting popup. The id is stable for the same ComboBox across reopen. This targets the active field's real selectable options and retains exact behavior assertions; it does not weaken them or use sleeps/force clicks. Reviewer independently inspected both deltas. Root's broader targeted runs are delivery evidence, not claimed reviewer reruns.

**Implementation verdict:** approved at final inspected head within this bounded scope, no remaining blocker. The causal hover/Tab sequence is prevented while explicit selection, freeform input, unresolved ambiguity, field independence and manual copy remain intact.

**Original-report verdict:** reproduced and prevented for the established focus/commit cause. The retained original Linux iPhone CI trace proves the hover/focus/Tab sequence; independent mouse-capability old/candidate comparison demonstrates its correction, and the original untouched iPhone manual-copy test passes on candidate. Local touch emulation did not recreate the historical hover promotion before the fix, so the exact platform trigger remains qualified. Physical iPhone, hosted publication and human acceptance are unverified; no claim of those conditions or a full-suite pass is made. Historical TIE-370 Chromium offline cause remains outside this review and unknown.
