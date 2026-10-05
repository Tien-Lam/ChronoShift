# Follow-up CI selection failure brief

Base: `9373729d8de979a9d7b07e0adfa12a8d6ec49066`. Current head: `842b89d89758a0361915221c6b541deff5257a49`. CI run: https://github.com/Tien-Lam/ChronoShift/actions/runs/37266977058.

Both attempts of `[iphone-emulation] e2e/imports.spec.ts:173` failed when the unresolved target was corrected from CST to Asia/Tokyo: `enterZone` filled the input and pressed Tab, then expected Asia/Tokyo but observed osaka. Browser is Playwright WebKit iPhone 13 emulation on Linux CI; physical iPhone behavior is unknown. No report from a human yet. Failed screenshots/context and retry trace are retained in artifact `chronoshift-web-failure-37266977058-1` (11326857491). Raw log is ci-first.log. Artifact download to /tmp/chronoshift-ci-lifecycle-failure is pending.

Unchanged surrounding owner: web/src/components/Choices.tsx controlled React Aria ComboBox, input and selected value both derived from text, city aliases share canonical IANA descriptions. Hypothesis only: blur auto-commits a focused alias instead of preserving the entered canonical identifier. Need independently derive the cause; no attribution to offline changes established. The existing manual-copy journey must retain independent exact result and source assertions.

Intended behavior: typed valid canonical zone remains stable on blur, explicit keyboard/pointer selection commits its chosen option, aliases/custom fixed offsets and unresolved ambiguity remain supported, source/target independent, live conversion and stale copy protection intact. No force clicks, sleeps, reduced-motion-only reproduction, or relaxed assertions to hide the symptom.

Code reviewer: inspect controlled selection/input/focus event order and affected library state, reproduce relevant case, assess causal regression. Port 4262; output /tmp/chronoshift-selection-code; reports selection-code-original.md then candidate report with actual clock/runner timing.

Adversarial reviewer: independently reproduce the failing report and competing typed/selected canonical/alias/invalid-to-valid journeys under normal motion, especially mobile WebKit blur. Port 4264; output /tmp/chronoshift-selection-adversarial; reports selection-adversarial-original.md then candidate report. Do not read the other reviewer's verdict until original report saved.

Current frozen root build worker 54d351454214d082, generated 2026-10-05T05:11:41Z; unchanged runtime since then. Target command: mise exec -- bunx playwright test e2e/imports.spec.ts --project=iphone-emulation --grep 'unresolved target' --retries=0 (with assigned PLAYWRIGHT_PORT and output). Record current build identity. New root candidate rebuild will be announced before further probes. Review implementation and report resolution separately. Historical TIE-370 Chromium cause remains unknown and is outside this selection report.
