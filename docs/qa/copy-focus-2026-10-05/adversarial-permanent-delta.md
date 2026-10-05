# Independent permanent-fixture and documentation delta

Actual observations: 2026-10-05 09:45:01–09:47:48 UTC. Explicit cwd `/Users/tien/Developer/ChronoShift`. Base/candidate App commit remains `35e11bac657a0c379fda48af9b454e674d2ea854`; App blob still `8bec3cbf656e92265f9f586fb9443de6e3c5aecc`. New fixture/document/helper bytes were inspected in the working tree before the final evidence batch. No browser/test/helper invocation, API, install, source mutation or peer review verdict was used. Source-finished notices were used only to identify final bytes. Existing App source/runtime approvals are inherited unchanged within their recorded scope.

Exact reviewed source identities:

| File | Git blob | SHA256 where relevant |
| --- | --- | --- |
| `e2e/copy-focus.spec.ts` | `21eae8f97deea9dd2dc3890a47dfaab464f1bdd3` | `6467c3acb6f5da55573678ac9e64b846fd3f8eba1cdb04b4df6ea59c0bfb429e` |
| `docs/developer/review.md` | `db46a31f8765d48e043b1a6b4dd243a93e228a16` | `ab04e2e08860bc8f66125bbd673ffa0aaf1ae58114b02fb94b2f86cf12e25629` |
| Copy-focus README | `55e19bc104def0b7c91df7a152bbe8af07ebf86e` | — |
| Actions-upgrade README, after wording fix | `5534e5d5d80c75d9d72f10c45bf2a81f8d120b7a` | — |
| `code/action-execution-audit.ts` | `2f35c9d8cdeb76c5b82e2423f049c4986d0501fb` | `b77197bfdb6b8304157d2c6a8799826e9f5c30e93a38c4fd2610815b683416aa` |

Implementation delta verdict: approved within this source-only scope, no blockers. No runtime rerun was justified by the review. Final exact-head full gate/publication remain pending. Historical original-fill sequencing remains untraced; the equivalent old/candidate race verdict retains the qualification in [my prior runtime report](adversarial-candidate-runtime.md).

## Fixture scheduling and false-pass checks

The permanent probe matches callbacks containing focus() and select() structurally, without minified ref names or diagnostic strings. It lets all other frames run natively, requires one matching held callback, and releases the original callback through a real native RAF after complete target focus. Exceptions propagate through the release promise. It does not invoke the callback inside an earlier focus capture listener. A future unmatched refactor should fail the mandatory held-frame poll rather than silently claim coverage.

The target case checks active focus before keyboard insertion. Its soft expectation still marks the test failed if focus was stolen; it then inserts CST without reacquiring focus. Subsequent target.press(Tab) can refocus the target but cannot repair the already missed keyboard insertion, and the exact value assertion catches that path. Warning/results/fallback removal and Tokyo/date/UTC-source correction assertions preserve useful outcome checks. The ordinary fallback case verifies full selection. The keyboard case snapshots actual activeElement identity, then Shift activity tests unchanged-owner intent without assuming Copy received native pointer focus.

Cancellation between hold and release can produce a resolved no-op, but canceling the actual pending focus callback is itself a valid future ownership strategy; current App has no such cancellation path. The checks do not establish arbitrary future focus/select callbacks belong to App, although the present source and exactly-one match identify the bounded callback. They exercise a scheduling-controlled equivalent rather than the historical locator.fill race.

Three tests add 15 configured cases across the five existing nonfoldable profiles, retaining the original 258-case inventory; expected full inventory is 273 with existing capability skips unchanged. The default setup records at most 100 fixed focus/input events, and routine cleanup performs one evaluate without asset fetches or attachments. Explicit evidence mode fetches scripts/styles and writes observations; success-time evidence overhead is therefore absent from ordinary CI. The optional snapshot includes deterministic fixture target value, distinct from value-free event breadcrumbs and from application diagnostics. It does not process a user's input.

Persistent suite coverage intentionally keeps three core cases. Focus-only, pointer, away/back, superseding and delayed-rejection boundaries remain separately retained QA evidence; this delta does not imply all those combinations became permanent tests. With evidence mode off, future failed attempts still depend on the normal reporter screenshot/context and retry-only tracing; default persistence of focus breadcrumbs was not implemented. That gap is correctly qualified in the summary and review guidance. No motion/hover/timeout/retry/helper change masks keyboard focus theft.

## Documentation and audit helper

Review guidance correctly distinguishes rendered fallback from pending focus, requires request/ownership rechecks inside callbacks, and explains why successful retry traces cannot establish original failure order. It recommends bounded breadcrumbs without claiming they exist by default. README counts are corroborated by the raw candidate core-profiles log (12 first passes) and WebKit log (three core passes among separate extra boundaries, with a retained unrelated fixture precondition failure). I did not consult their author's verdict. All local Markdown links in both summaries and review guidance exist.

One wording issue was found and root corrected it before approval: manual fallback configure/upload executes in the UID1001 container, while deployment executes on the separate Ubuntu runner. The final Actions README states this accurately. Both summaries retain unobserved timeout/cancellation/rollback, original-trace, physical-device, final gate/publication and unmet TIE-375 limits. The 42 screenshot-phase CSP messages are qualified instead of being called a zero-warning run.

The helper's new ordinary mode requires the timing step to be completed/skipped, records `actualExecution: false`, and makes timing success required only when `AUDIT_CI_TIMING=1`. It retains eef upload evidence as explicitly historical, not current-head execution, and leaves marker/digest/public/hosted evidence outside named-step attribution. Independently pinned action SHAs and approved workflow hashes are unchanged and match the local workflows. This source review does not invoke or approve future helper results; root must still supply exact saved run/head/attempt and publication evidence.

Original reports remain intact. This focused delta preserves earlier bounded App implementation approval and does not broaden historical-report or hosted acceptance.

Final local-link and helper binary-environment validation: 2026-10-05 09:48:23 UTC. The timing selector defaults to ordinary (`0`) and rejects values outside `0`/`1`.
