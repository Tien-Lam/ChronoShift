# Independent clean normal-navigation audit

Investigator: normal_navigation_audit. Inspected repository head `63c9cdc442eac03c30dbae7871d1452b1049c7b0`, public HTTPS baseline source `15b8accd00efd019921e3aef6df62e8ce4b30dd1`, worker `3ac0e622535455b5`. This is focused competing-path evidence, not an additional implementation approval or full verification gate. Derived findings without consulting the other reviewers' reports.

## Outcome and scope clarification

No separate persistent no-controller failure was reproduced in the completed clean normal-navigation controls. Fresh visit acquired control; ordinary reload, same-address navigation and a new tab had control immediately. All four were ready and warning-free at 16 seconds, beyond the actual 15-second startup deadline.

During this investigation, root relayed the user's clarification that the reported normal-browsing recurrence occurs in the same tab that was hard-refreshed earlier. That does not imply a fresh normal-navigation failure: ordinary in-document interaction retains that document's service-worker client and controller state. These controls do not independently reproduce or certify the candidate hard-refresh recovery, which the complementary reviewers tested.

## Environment and release identity

- Run: 2026-10-04 19:08:47.274–19:10:56.155 UTC (2026-10-05 Sydney date).
- Actual installed, headed Google Chrome `154.0.8037.93`, protocol 1.3, revision `f89f3a4363808e117c592adedcf9947882ac3b79`, macOS arm64 host.
- Playwright `1.63.0`, mise-managed Bun `1.4.0`.
- Isolated persistent profile `/tmp/chronoshift-normal-navigation-chrome-profile-1791140927274`. No existing user profile changed.
- Hosted URL `https://tien-lam.github.io/ChronoShift/`.
- Worker SHA256 `a2da153d2902b3dcd3c30ce5ff0c6b7cbf21089b47a09e3f067c5d1a68d1e661`; public release.json base `/ChronoShift/` and source above. Response records preserve worker headers, full VERSION/integrity preamble, registration/version transitions and browser identity.
- No hard/force reload, service-worker bypass, network shaping, API mocks, cache/registration mutations or app edits. Observer-only init script captured pageshow/pagehide/controllerchange; it also enabled the application's supported session-storage detailed-logging flag. Removed Playwright's default `--disable-back-forward-cache` flag for history controls. Other automation defaults remain, including disabled extensions; this is not the user's exact browser profile.

## Actual journeys

Samples are taken after navigation returns, at approximately 0/1/4/16 seconds. Raw records additionally retain document performance time and absolute event timestamps.

| Journey | Controller at first sample | First successful readiness diagnostic UTC | At 16s |
| --- | --- | --- | --- |
| Fresh first visit | absent | 19:08:50.689 | controller activated, ready true, no warning |
| Ordinary `page.reload()` | activated | 19:09:04.614 | controller activated, ready true, no warning |
| Same-address `page.goto()` | activated | 19:09:20.647 | controller activated, ready true, no warning |
| New tab with existing active registration | activated | 19:10:39.040 | controller activated, ready true, no warning |

Fresh first visit pageshow was uncontrolled at document performance 662ms, followed by controllerchange at 2877ms (`19:08:50.681Z`, controller activating). Readiness succeeded 8ms later. At 1 second after navigation the page was still installing/uncontrolled; by the 4-second sample it was controlled and ready. This is a bounded normal installation transition with observed lifecycle events, distinct from registration succeeding repeatedly without any installation transitions.

Soft reload and same-address navigation returned HTTP200 with `fromServiceWorker:true`. Both had activated control at observer initialization and pageshow; no new controllerchange was required. Active registration remained exact scope/script, with no installing or waiting worker.

Two out-of-scope/history-back trips navigated to `https://tien-lam.github.io/`, then restored the app. The app emitted controlled `offline.probe-start` for page-show at `19:09:37.890Z` and `19:10:08.911Z`; successful worker version `3ac0e622535455b5` readiness responses followed at `19:09:37.895Z` and `19:10:08.914Z` (5ms/4ms respectively). CDP also recorded the activated worker regaining the restored document in controlledClients. Each history `goBack` nevertheless timed out after 30 seconds waiting for a new load event. Existing diagnostic lines with earlier embedded timestamps were replayed on restoration: use the embedded `at` timestamp rather than treating console receipt time as a new registration attempt. This establishes actual restoration and successful controlled probe, but the harness did not reach its intended post-restoration 0/1/4/16 DOM snapshots or save the observer's persisted flag. Treat BFCache identity as indicated by restoration/replayed diagnostics, not independently certified by a saved persisted:true snapshot. This is a harness limitation, not a reproduced app readiness failure.

There were no pageerror events in completed clean cases. Four full cases showed no `.message.warning` at any sample.

## Scope reductions and evidence gaps

After the clarified same-tab history and root's request to stop expanding controls, execution was terminated with SIGTERM only against this probe's Bun PID. The already-running new-tab control completed before termination; the next slashless redirect reached activated control and a successful readiness response (`19:10:55.307Z`), but its 16-second hold was interrupted and receives no full-pass claim. Browser/profile processes closed; no user processes were terminated.

Worker stop/restart, all-tabs-close/reopen, offline reopen, Disable cache + ordinary reload and early first-install leave/return were not completed. An optional early-transition script failed before navigation at `Browser.getBrowserCommandLine` because this Chrome launch did not set `--enable-automation`; it supplies no transition evidence and was not retried after scope clarification. No script mocks or altered worker lifecycle were used to manufacture normal recurrence.

No claim is made about extensions, the unknown user's exact Chrome version, an initially uncontrolled history document, first-visit installation interrupted by leaving the page, OS suspension or stale/waiting-worker updates. Candidate implementation hard-refresh/waiting/integrity coverage remains the other reviewers' remit.

## Competing explanation and verdict

The baseline `36c1f03` readiness path inspects only `navigator.serviceWorker.controller`; it can re-register without rerunning activation for an already-activated unchanged worker. In-document edits/focus/conversion do not navigate or replace that client. Thus an uncontrolled force-refreshed document can continue normal interaction while remaining uncontrolled, and report the same 15-second warning. This interpretation is supported by the user's clarified history, rather than inferred from clean-control success alone. The Service Workers specification explicitly distinguishes a force-refresh navigation, which yields no controller, from ordinary registration matching; Chrome likewise documents control on the next non-forced navigation. References: [W3C Service Workers](https://www.w3.org/TR/service-workers/), [Chrome service-worker development guidance](https://developer.chrome.com/docs/workbox/improving-development-experience).

**Implementation verdict:** no new blocker found in this focused investigation; candidate recovery not independently exercised here, so no separate broad approval.

**Original-report verdict:** no distinct fresh-normal-navigation failure established. Clarified normal use in the earlier hard-refreshed same tab is consistent with the already-reproduced lifecycle. This audit alone does not claim candidate prevention/publication acceptance.

## Reproducibility artifacts

- Main command: `mise exec -- bun /tmp/chronoshift-normal-navigation-probe.ts`.
- Script: `/tmp/chronoshift-normal-navigation-probe.ts`.
- Final raw console, CDP, release, snapshots and browser metadata: `/tmp/chronoshift-normal-navigation-raw.json`.
- Pre-termination raw snapshot: `/tmp/chronoshift-normal-navigation-initial-raw.json`.
- Optional unexecuted resume script and failed early-transition script are investigation scaffolding only, not acceptance evidence.
