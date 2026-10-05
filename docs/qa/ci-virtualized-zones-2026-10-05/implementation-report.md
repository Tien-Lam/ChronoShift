# Scoped timezone virtualization candidate implementation

Implementer: `virtualized_zone_implementer`, dispatched by root with the exact [implementation brief](implementation-brief.md). Actual first instrumented clock after initial source/evidence reads: **2026-10-05 11:53:40 UTC**; initial reading start was not instrumented. Source/check identity recorded **11:54:11.106 UTC**; source frozen notice sent immediately thereafter. Final bounded source/HEAD inspection clock: **11:54:20 UTC**. Report save follows; no invented start/end timing is used.

Base and inspected HEAD: `cea0de547094ba51a598fdc4303409fdf1d36bb7`, branch `codex/ci-virtualized-zones`. Candidate is uncommitted. Runtime modifications are confined to `web/src/components/Choices.tsx` and one four-line rule in `web/src/style.css`. Shared pre-existing untracked files were left untouched. No dependency, fixture, workflow, expectation, browser, server, hosted Actions, commit or merge operation was performed by this role.

## Exact source changes

`Choices.tsx` imports `Virtualizer` and `ListLayout` from the installed public `react-aria-components/Virtualizer` export. `ChoiceItems` constructs the same complete ListBox and item renderer, returning it directly for ordinary Select callers. Only its existing `byValue` timezone path wraps that ListBox with `Virtualizer`, `layout={ListLayout}`, `layoutOptions={{ estimatedRowSize: 62 }}` and `shouldObserveItemSize`. The 62px estimate comes from the existing normal label/description styling: 20px vertical padding, 24px label line, 2px text gap and 16px description line. It is an estimate; no fixed `rowSize`/height is supplied, and shorter UTC/alias rows or wrapped descriptions are observed through the public measurement option.

The timezone ListBox adds `choice-list-virtual`; its scoped CSS supplies `display: block` and `overflow-x: hidden`. The existing 320px maximum list height, minimum zero flex size, overflow scrolling, 44px minimum option height, intrinsic text layout and natural wrapping remain. No CSS changes pointer events, animations, popup geometry, focus or CSP.

The full `timezoneOptions` construction, `items={options}`, option IDs, `textValue`, `data-value`, labels/descriptions, aliases and normalized search remain unchanged. Source/target input and selection state, commit closure/current-value ref, custom-value/empty-collection flags, no-hover-focus policy, invalid state, diagnostics, Popover placement/nonmodal behavior and ownership callbacks remain unchanged. This is a source inspection statement, not certification of their browser behavior after virtualization.

| File | Git blob | SHA-256 |
| --- | --- | --- |
| `web/src/components/Choices.tsx` | `bce946afa5b2547f3bece17b3c928c80ab952b35` | `8f8d673449e03553a2a92cae7c7f950972045c9641ecfc4fe2385c9cb62f4bee` |
| `web/src/style.css` | `bfa9ef0fd59fee36bd8547cf71875e0fd8c8a25a` | `6c9266b76d8af98c62781b71a1413797a31c8b016d27cabe1ec22fc4fe0d6e93` |

## Bounded verification

Environment: Darwin arm64, mise-managed Bun **1.4.0**, installed React Aria Components **1.21.1**. `mise current` also reported Node26.8.1 and gh2.100.0; neither was used to run checks. Public export and props declarations were inspected directly; installed ListLayout declarations expose the variable-height estimated size option and Virtualizer exposes item size observation. Read-only library implementation inspection confirms window/ancestor-scroll observation and focused-key persistence are owned by the installed integration. No library internals were changed.

The two independent checks were spawned within one `mise exec -- bun` wrapper, concurrently, using Bun subprocesses. Exact UTC clocks, elapsed milliseconds, commands, exit codes, output and source hashes are preserved in [implementation-checks.json](implementation-checks.json). Its command labels name the mise context; each nested command was `bun run <script>`.

| Check | Actual start UTC | Actual end UTC | Elapsed | Exit |
| --- | --- | --- | --- | --- |
| `mise exec -- bun run typecheck` | 11:54:10.630 | 11:54:10.781 | 151.785166ms | 0 |
| `mise exec -- bun run format:check` | 11:54:10.630 | 11:54:11.105 | 475.494042ms | 0 |

Raw output: [typecheck](implementation-typecheck.log), [format check](implementation-format-check.log). `git diff --check` passed both immediately after editing and at final source inspection. No full check/build/unit/browser gate was run by this role; root owns frozen builds and matched/full acceptance checks. Check durations are verification timings, not application performance measurements.

## Preserved prior failures and remaining limitations

Read in full: [next-opportunity](../ci-critical-path-2026-10-05/runtime/next-opportunity.md), [original code review](../ci-efficiency-2026-10-05/code-virtualization-original.md) and [original adversarial review](../ci-efficiency-2026-10-05/adversarial-virtualization.md), as well as the exact current brief and AGENTS.md. The older native-height Tokyo reopening test had competing baseline closure/failure evidence. Today's test establishes scroll and native focus before input-driven reopening. That changed preparation permits a fresh matched investigation; it does not establish candidate acceptance or resolve the old failure.

The installed Virtualizer keeps its native pointer shielding while scrolling and ancestor/window visibility observations. The popup keeps React Aria ancestor-scroll dismissal. No force-click, timer override, pointer bypass, delayed reopening or state workaround is added. Therefore immediate scroll-to-pointer interactions, keyboard-generated scroll, short-height/mobile/offscreen focus and transient popup visibility remain live challenges.

Public size observation is enabled, but no browser evidence from this role proves absence of the previously recorded ResizeObserver warning, stable scroll anchoring, correct row rectangles after resize/font/wrap changes, or complete interior-choice access. Empty full→few→none→full transitions, filtered focused/selected keys, no-match placeholder versus real selectable rows, alias/custom-offset correction, independent source/target values and actual owned mounted focused descendants require matched probes. Ordinary Select rendering remains direct by source inspection and still requires the complete required control gate.

Normal motion and CSP configuration remain untouched. Browser console/page errors must be preserved; capture-injected stylesheet errors from prior probes cannot substitute for normal-use CSP observations. Physical-device, assistive-technology and human acceptance are not claimed.

## Separate verdicts

**Implementation:** source candidate is frozen and passes bounded type/format checks. Adoption remains pending root's exact-source independent reviews and browser/full acceptance evidence; this role supplies no browser approval.

**Original CI objective:** unresolved. No runtime speed, Linux runner time, artifact byte-hours, monthly-account savings or target resolution is established here. Mounted DOM reduction is not an efficiency verdict. The brief's strict ordinary-pair raw improvement, at least 20% rounded runner-minute/storage proxy reduction, all116 units/all273 configured browser identities, independent fixtures and offline/privacy/subpath/update/exact-tree publication gates remain required outside this implementation role.
