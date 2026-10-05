# Rejected virtualization candidate: complete Linux evidence

Observation began 2026-10-05T06:26:16Z; final API/log fetch and analysis completed
06:33:44.781Z, with source/environment inspection at 06:34:02Z. Observer was
Darwin arm64, mise-managed Bun 1.4.0 and gh. This implementation/evidence agent is
not an independent final reviewer and performed no build/test, source mutation,
CI dispatch/rerun/cancel, publication or frozen-server change during monitoring.

[Web run 37272392986](https://github.com/Tien-Lam/ChronoShift/actions/runs/37272392986)
completed successfully for exact PR head
`8a4ebec0881f8363ffd19f833bbf29a44e77885a`, Git tree
`e66f5c811b8635a8b912fbc25acf0999a283bfbc`. Root rejected virtualization following
independent keyboard/scroll interaction findings. CI success does not override that
functional blocker. This record preserves a rejected experiment; no matching main
publication occurred or is authorized by this report.

## Coverage and first-attempt evidence

Raw `run.log` announces 258 tests with four workers. Independent parsing finds
258 unique `(project, file, static test title)` identities and 258 first attempts,
249 passes, nine skips, **zero failed attempts and zero retry attempts**. The complete
identity set and skip status match `../control-linux.log` exactly, ignoring source
line offsets. `attempts.json`, `attempt-summary.json` and `retry-evidence.json`
preserve every list result and all matched failure/retry lines. The latter is empty.

| Profile | Pass | Skip |
| --- | --- | --- |
| foldable | 3 | 0 |
| chromium | 51 | 0 |
| firefox | 48 | 3 |
| webkit | 48 | 3 |
| android-emulation | 51 | 0 |
| iphone-emulation | 48 | 3 |

The nine skips remain the three existing CDP-dependent uncontrolled-page cases in
each non-Chromium profile. Unit output records 116 passes, and the distinct subpath
gate records one pass. All required format, unit/build, corpus, browser, subpath,
image guard and Pages-upload steps succeeded in final jobs metadata.

Actual browser-step environment is `CHRONOSHIFT_CI_TIMING: 0`. Timing upload and
failed-attempt diagnostics steps were skipped. Final artifact inventory contains
only `github-pages`; absence of timing metadata is expected and is not missing
failure evidence. Exact-head configuration retains list, HTML and attempt reporters,
one CI retry, retry traces and failure screenshots. AttemptReporter writes a
failure marker for unexpected attempts and preserves it when a retry succeeds;
the workflow uploads the whole diagnostics bundle on failure or marker presence.
The subpath runner writes into a separate output folder. These policies were
source-validated, not exercised by a failed attempt in this all-first-pass run.
No passing HTML artifact is retained by policy, so actual uploaded HTML was not
available for a second independent count.

## Environment and costs

The saved raw log records runner 2.337.0, Ubuntu 24.04.5, runner image
`20260927.320.1`, Azure eastus; Docker client/daemon API 1.48; mise 2026.10.1
linux-x64, Bun 1.4.0, Node 26.8.1 and gh 2.100.0. The browser container remains
the pinned official Playwright image digest
`eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27`, guarded
against Playwright 1.63.0 and missing browser executables. The control log records
westus3 with the same OS/image version. Actual CPU affinity, cgroup quota, browser
CPU use and peak memory were not captured; published runner specifications cannot
substitute for those measurements.

| Observation | Result |
| --- | --- |
| Run created / updated | 06:26:05Z / 06:33:18Z, 433s elapsed |
| Web job started / completed | 06:26:07Z / 06:33:18Z, **431s** |
| Existing per-job ceil metric | **8 rounded minutes** |
| Interval before first setup step | 36s, included in API job span |
| Container initialization | 26s |
| Browser step | 06:27:25Z–06:33:11Z, **346s** |
| Subpath step | 3s |
| Passed-attempt rounded duration sum | 1,314,600ms; concurrent/wait-inclusive |

Against original expanded-suite Web (301s/six minutes), this job increases API span
by 130s (**43.19%**) and two rounded minutes (**33.33%**). Against the four-worker
instrumented control (356s/six minutes), increases are 75s (**21.07%**) and two
rounded minutes. Browser alone is 100s slower than the original 246s step and 55s
slower than the instrumented 291s step. These are factual comparisons across
different sources/instrumentation/region conditions, not causal attribution to
virtualization or reporter removal. No saving or target completion is supported.

The sole Pages artifact is ID 11329810141, 383,942 archive bytes, retained exactly
24 configured hours (9,214,608 projected byte-hours), digest
`sha256:c4e25e2d4ec45f2f433903be98458ff22e90eb645363535d2417e590655f4bd6`.
This agent saved API identity/digest metadata but did not download/authenticate or
reuse its payload; root owns exact final publication trust. Raw run/jobs/artifacts
and computed cost fields are preserved beside this report. A whole successful
PR/main pair, including publication jobs, remains required for acceptance.

## Reproduction

Read-only API/log inputs were collected with mise-managed `gh api` and
`gh run view --log`. After final files exist, run the two saved analysis helpers
with Bun. They refuse wrong/incomplete run identity or partial inventories and
compare complete case identities against the control. Their output is evidence
analysis only, not an app test or CI rerun.
