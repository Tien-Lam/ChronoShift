# Independent adversarial review — first candidate TIE-369

Reviewed source: ba32383c5609f72a6fa551bbddd6b53df74bd80e. Base: ab1ad4e1d8c1c249e9e7941a20043fb7627f477c. Local production release.json confirms exact sourceCommit and base /. Root identified worker5cd22ea7e489a82f. Review performed 2026-10-05 approximately06:22–06:27 Australia/Sydney; main72capture batch completed2026-10-04T19:23:52.252Z. Browser evidence from separate port4254, fresh ephemeral contexts, no regular user profile or shared build modifications. macOS arm64, mise-managed Bun1.4.0; Chromium153.0.8010.12, Firefox155.0, WebKit26.6. Initial independent risks saved separately before candidate was supplied. No counterpart verdict consulted.

## Finding — P2 blocker: precision digits split at280px

Supported input `2026-04-09T15:59:59.123+02:00`, destinationAustralia/Sydney, en-AU12-hour format produces `11:59:59.123 pm`. At280px on Pixel7/Chromium and iPhone13/WebKit emulation, light and dark, side-by-side Copy consumes55.03px plus12px gap, leaving146.97px for the32px hero. `overflow-wrap:anywhere` splits the number as `11:59:59.` / `123 pm`. Document width remains280px and both time/Copy are contained, demonstrating why containment assertions miss the loss of readability. Numeric splitting undermines the central request to make converted output easier to read.

Capture: /tmp/chronoshift-result-adversarial-captures/pixel-280-light-precision.png (also pixel/iphone280lightdarkprecision). Measurements: mobile.json. Correct by giving output its full width at the affected narrow breakpoint, with Copy on another row, or equivalent layout preserving numeric time and copy association. At320px digits fit and only pm wraps; that case is readable. Date-only `September30,2026` produces `Wednesday,30September2026` across four lines at280px from the same constrained column; not clipped, but a full-width date would improve the reading flow too.

## Observed strengths within bounded scope

72production captures: Chromium/Firefox/WebKit at1440×900 and320×740 in both themes; single EST conversion, overnight range, CST ambiguity, date-only, long surrounding input/city-qualified range, fractional adversarial input. All documents fit viewport width. Actual captures inspected: Chromiumdesktoplightambiguity, narrowfractional/date-only/darkrange, desktopdarklongcontext; WebKitnarrowlightambiguity/darklongquote; Firefoxdarkdesktoprange/narrowprecision; Pixel280precision/date-only. Hierarchy clearly improved: converted time first, date/destination beneath, Copy associated with each result; source and quoted original below. Actual text metrics (textmetrics.json): desktophero56px/weight550, date15px/500, target13px, source/original12px muted; narrowhero32px, date-onlyhero24px. The original text remains legible and visibly secondary, including wrapped long IANA spans. Raw primary measurements.json includes container-style metrics for context/original; textmetrics.json measures their actual text children and avoids mistaking container inherited styles for rendered glyph styles.

Additional9journeys: threeengines×supportedmilliseconds/DSTfold/longquote at320px. Every Copy fallback payload matches its displayed result and source/interpretation; DSTfold first4:30pm and second5:30pm copy independently. Resize320→1440→320 retains result text for each case. Clipboards intentionally reject writes only in that supplemental journey to expose copy payload for inspection; this is deliberate injection. No network/offline lifecycle failure injection used.

Additional12mobile-emulation captures: Pixel7/Chromium and iPhone13/WebKit at280px, light/dark, supportedmilliseconds/date-only/DSTfold long source. Precise digits split in all four affected profiles. Long-source ambiguity labels/original remain readable and Copy remains accessible.

Normal-use errors: Chromium/Firefox capture matrix clean. WebKit emitted two CSP stylesheet errors for each screenshot operation. Dedicated csp-probe.json reproduced zero errors during load/ready/convert plus2seconds idle before capture, then exactly two CSP messages at screenshot time. These are screenshot-tool stylesheet injections, not normal-use application violations.

Non-blocking scope observation: nine fractional digits (`.123456789`) parsed as separate plain-time pieces instead of the ISO instant. This is outside the3digit millisecond fixture tested here and engine code is unchanged in the candidate. Supported `.123` was then exercised separately and exposes the layout blocker above. This review does not establish unsupported9digit parser accuracy.

## Commands and evidence

Read AGENTS.md, docs/developer/review.md, saved brief, testing documentation and surrounding rendering/format/copy/group/style code. Started `PORT=4254 mise exec -- bun scripts/serve-web.ts` against root-built dist. Ran scripts with `mise exec -- bun`:
- /tmp/chronoshift-result-adversarial.ts → measurements.json plus72PNG captures.
- /tmp/chronoshift-result-adversarial-extra.ts → extra.json plus9PNG captures; clipboard fallback and resize.
- /tmp/chronoshift-result-adversarial-mobile.ts → mobile.json plus12PNG captures.
- /tmp/chronoshift-result-adversarial-csp.ts → csp-probe.json and capture.
- /tmp/chronoshift-result-adversarial-textmetrics.ts → actual text font/color/order metrics.
Scripts and evidence directory: /tmp/chronoshift-result-adversarial-captures. An initial extra script expected a nonexistentClosecontrol; it was interrupted, corrected to inspect the existing persistent fallback textarea, and rerun successfully. This was a review-harness error, not an application finding.

Root's prior published-source screenshot/DOM docs/qa/result-hierarchy-2026-10-05/hosted-before.{png,json} independently inspected as baseline. It clearly shows original→source/Copy→convertedtime order at606px. Baseline supplied by root: published4a77(worker1daf), treeab1ad4e with documentation-only difference. I did not independently obtain that hosted baseline or inspect the candidate in the live side panel; local/source evidence and root's provenance are distinct.

## Verdicts

Implementation: BLOCKED by the280px precision numeric split. Approve remaining inspected hierarchy/source/copy behavior within stated scope, subject to fixing and rendered delta review of the narrow layout.
Original request: candidate substantially improves emphasis/order and retains original context, but bounded narrow readability is not accepted until the blocker is fixed. Exact original browser/version/input/timing/history remain unknown; no subjective human acceptance claimed. No physical-device, actualzoom, screen-reader, OSclipboard or phoneperformance certification. Production/subpath/offline/update publication acceptance belongs to root and is not independently established by this local visual review. Invalidtarget/no-target recovery not exercised in this adversarial journey; code reviewer/root owns it.
