# Independent code review: virtualization prototype

Reviewer `ci_lifecycle_code`. This is a new complementary runtime-review scope, with prior efficiency/lifecycle context reused and disclosed; no peer virtualization report/verdict was read before this report. Actual UTC observations: review began **2026-10-05 06:12:11**, final evidence summary captured **06:17:49.928Z**. Exact script clocks appear below. Report-writing completion is uninstrumented. Root servers, frozen artifacts and production source were untouched; no build/full suite/CI dispatch was run.

Actual dispatch/source: [virtualization-prototype-brief.md](virtualization-prototype-brief.md) and implementer's source-readiness report, dirty runtime on `77fbf61b33d0b2752a3f90b20a261f30f0842b0f`, with CI workers restored4. Only `Choices.tsx` and `style.css` change runtime: public Virtualizer/ListLayout wraps timezone lists, estimated62px variable rows with size observation; generic selects retain ordinary rendering. Collection, filter, IDs, commit owners and hover-focus policy are unchanged by source inspection. CSS supplies block virtual viewport/hidden horizontal overflow without fixed row height.

[Exact identities](code/virtualization-identities.json), independently fetched at `06:17:00.587Z`:

| Frozen artifact | Origin           | Worker version     | JS asset            |
| --------------- | ---------------- | ------------------ | ------------------- |
| Before          | `127.0.0.1:4276` | `2eb418e824f28221` | `index-DHi9pTHJ.js` |
| Prototype       | `127.0.0.1:4278` | `18545a2d408b19e8` | `index-DbVCZBhP.js` |

Both release markers identify `local`, root base `/`; they do not provide a committed production source identity. Exact SW hashes and source hashes are saved. Inspected dirty `Choices.tsx` SHA-256 `0cc006acdf51f6bfdb3646b337c2ff5ce7e95d165a73d3ef87004cd39bc9f8f9`, stylesheet `90cd5f371f98d1423c5e4442533d984afd9e1ffe694b87b97bb4389ece2a32ee`.

## Independent failure investigation

I inspected root's actual first iPhone failure trace/context at `/tmp/chronoshift-virtualization-controls/controls-hovering-timezone-df152-cit-selections-still-commit-iphone-emulation/`. [Extracted trace calls](code/virtualization-trace-calls.json) retain the implicated fill/hover/End/Tab/click sequence. After deliberate Osaka commit and subsequent Tokyo fill, the trace shows:

- Input valueTokyo, `aria-expanded=false`, no current `aria-controls`.
- Retained popup simultaneously entering/exiting; the old owned list ID is still present, but its virtual presentation has no option rows.
- Tokyo click waits for a nonexistent option; there is no evidence of a replacement list with a different owned ID.

This is a missing/reclosed popup, not a demonstrated stale-owned-ID bug. Reacquiring the same absent list cannot fix it.

Own comparator [virtualization-probe.ts/json/log](code/virtualization-probe.json), **06:13:14.473–06:14:01.736Z**, used installed Chromium153.0.8010.12 and WebKit26.6 on Darwin arm64, Desktop Chrome/Desktop Safari and native iPhone13 emulation, localeen-AU/timezoneSydney, normal motion. Page action deadline1800ms was chosen to bound diagnostics; root's original30s failure independently confirms absence persists beyond this shorter probe limit. Chromium and desktop WebKit before/prototype both passed the exact hover→Tab canonical-retention→ArrowDown/End/Tab alias-selection→Tokyo pointer sequence for both fields. iPhone before passed; prototype failed Tokyo pointer selection in target, retaining valueTokyo with no popup/owned list.

**Causal qualification:** baseline iPhone's source-field snapshot also reported closed/controls-null immediately after Tokyo fill, yet its retained exiting options still allowed the click. A single before-pass/prototype-fail does not establish that virtualization introduced the underlying close. It exposes that the existing test can select from a closed exiting menu in the baseline.

To challenge the scroll explanation, [virtualization-scroll-control.ts/json/log](code/virtualization-scroll-control.json), **06:16:34.962–06:16:40.440Z**, recorded document focus/input/scroll events and expanded/owned attributes on fresh iPhone contexts. At native390×664, before passed with a closed-popup intermediate state; prototype failed. Prototype event order was Tokyo input→expandedtrue at performance538ms→document scroll y568→572 at540ms→expandedfalse/ownership removed at541ms. At390×1400, both versions passed both fields with no document scrolling and open owned lists.

Installed `react-aria/dist/private/overlays/useCloseOnScroll.mjs` closes overlays on trigger-ancestor scrolling, excluding input/textarea internal scrolling. `useOverlayPosition.mjs` wires that owner and separately handles visual-viewport resize. Actual event order, trace scroll offset and tall-viewport control support queued focus/document scrolling as the competing close path. They do not isolate every internal callback or prove physical Safari behavior. Virtualization removes rows during exit, making the existing race fail more visibly; the ordinary list can retain clickable rows through it.

**Functional blocker to adoption:** the required native-height iPhone journey currently fails, and existing test preparation/scroll semantics require resolution before approval. A justified fix may be a causal preparation correction rather than a product-state workaround: establish native focus/scroll completion before expecting input-triggered reopening, preserve normal motion, and separately retain intentional ancestor-scroll dismissal. Do not add a sleep, force-click, taller viewport as final acceptance, or weaken the canonical/alias/other-field expectations. Recheck the same bounded before/prototype journey after any exact correction. A dropdown deliberately reopened by its toggle remains a different interaction from the reported input-reopen path.

## Passing conditions and honest preparation limits

[Summary](code/virtualization-summary.json) distinguishes valid findings from preliminary probe mistakes. Chromium and desktop WebKit full unfiltered End/Home/Arrow/Enter navigation, mounted focused descendant, scroll-to-last-row pointer selection and committed value passed in both versions. Candidate full-list ARIA positions/set sizes matched454 Chromium/479 WebKit while mounting a small window; the original complete collection remains the independent UI control. The initial iPhone full-keyboard sequence read Home/selection state immediately and mixed ancestor-scroll closure with asynchronous focus updates; its failures are retained but are not claimed a separate candidate-only keyboard defect.

Corrected [virtualization-bounds.ts/json/log](code/virtualization-bounds.json), **06:14:52.009–06:14:55.441Z**, passed all six before/prototype conditions across the three profiles:

- No-match placeholder visible with zero **real `[role=option][data-value]` choices**; freeform+05:45 retained.
- Argentina search logical collection7 Chromium/12 WebKit, independently obtained from baseline. Candidate mounted7 WebKit rows with all `aria-setsize=12`; End reachesUshuaia, Home/Arrow reaches the baseline's same first/next zone, Enter commits that exact focused value.
- At280px, wrapped descriptions remain inside measured rows with no horizontal overflow or row overlap. The collection stays usable across740×360 and280×960 resize; focused mounted descendants survive and Enter commits. Subsequent short Tokyo pointer choice commitsAsia/Tokyo.
- Normal-use CSP violations remained empty before any screenshot; no page errors were recorded in the comparator.

The initial probe incorrectly expected all role-option nodes to disappear in the no-match state. React Aria's empty placeholder itself has roleoption, so both versions failed that probe assertion equally. All six preliminary failures/logs are preserved and excluded; the corrected probe counts actual data-value choices. Initial failure screenshots can inject a stylesheet and therefore their later CSP counters are not normal-use evidence. The separate [280px capture](code/virtualization-narrow.png) was visually inspected: label/description wrapping and the scroll window fit. It was taken during ordinary entry motion and is a visual observation, not a settled-opacity or screenshot-CSP claim.

## Remaining coverage and performance gaps

Own conditions cover two engines/three profiles and both fields in the reopened-selection journey; root's existing controls20-case run passed19 and failed the original iPhone case. Firefox/Android were not independently probed in these scripts, and mobile full479-choice navigation at native-height remains entangled with the described scroll preparation. Screen-reader announcements, physical phone performance/install/share and actual zoom are unexercised. Source-level preserved collection and ARIA metadata do not certify those behaviors.

No Linux virtualization timing or successful full gate/publication pair exists in this report. DOM reduction and local interaction durations are not CPU evidence or20% quota/storage acceptance. Root reported six-worker run419s versus four-worker356s with one retry; that experiment is rejected/restored4, and its raw failed attempt is separate pending evidence. This virtualization review does not approve the six-worker setting or close any prior efficiency finding.

## Separate verdicts

- **Implementation:** not approved for adoption. Bounded keyboard/filter/wrapping/resize/ARIA paths pass, but the native-height iPhone reopen/select journey fails and requires the causal preparation/scroll behavior above to be resolved and reviewed. Underlying ancestor-scroll closure also occurs in the baseline; attribution to virtualization alone remains qualified.
- **Original efficiency goal:** unresolved. No measured comparable Linux benefit, final full gate or published artifact evidence establishes TIE-375 acceptance. Historical TIE-370 cause and physical/human gaps remain separate/open.
