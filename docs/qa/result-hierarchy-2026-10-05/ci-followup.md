# CI retry observations retained separately

[TIE-370](https://linear.app/tienlam/issue/TIE-370/diagnose-offline-update-ci-flake-and-retain-retry-diagnostics)
tracks two observations from final Web run
[37228236311](https://github.com/Tien-Lam/ChronoShift/actions/runs/37228236311).
The required gate succeeded with 220 first-attempt passes, two retry successes
and six skips for Chromium-only CDP cases in non-Chromium profiles. This is not
222 clean first-attempt passes.

Chromium's older-active-worker explicit-update case retained readiness false for
the 10-second assertion at `e2e/uncontrolled.spec.ts:120`. Cause remains unknown;
retry success does not resolve it. WebKit's diagnostic reload case rejected
`arg.jsonValue()` because navigation destroyed its context at
`e2e/diagnostics.spec.ts:11`; that async test-helper error ended the test. The
independent code reviewer inspected these failures and their surrounding paths.

No changed result hierarchy path is implicated: offline/update handlers are
unchanged; the new narrow rule is inactive at the 900px desktop failure and does
not reposition the flex update action. This supports a bounded layout acceptance,
not a general assertion that an unknown offline lifecycle issue is solved.

The failure-diagnostics upload uses `if: failure()` and was skipped after retries
passed, so original screenshots/context were not retained in a diagnostic
artifact. The [raw failure excerpt](ci-failure-excerpt.txt) is preserved here.
The follow-up requires bounded-cost retry evidence retention, a meaningful fix
for the console navigation race, and controller/worker/cache evidence for the
unexplained update-readiness observation. TIE-370 stays Todo; the previously
matched published hard-refresh report remains separately accepted as recorded.
