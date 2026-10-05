# CI efficiency dispatch and acceptance

User request: continue remaining ChronoShift work; improve CI speed and reduce total Actions usage by at least 20%, including the monthly free-usage limit.

Base main 7059da3 follows published runtime 67be609. TIE-375 tracks the current expanded-suite miss. Existing measurement: Web 37268219679 plus Pages 37268626778 totals 326 runner seconds / eight per-job rounded minutes, against the original 307-second / eight-minute pair. Artifact byte-hours are 63.25% lower. The current time/quota target fails.

First candidate adds opt-in step timing via CHRONOSHIFT_CI_TIMING=1, unchanged 258 configured scenarios, five ordinary browser profiles plus foldable, four workers, native motion and existing exact assertions/fixtures. CI retains sanitized bounded metadata for one day. Step totals overlap; leaf totals exclude parents; neither is CPU time. No test title, fill text, selected value, error payload or arbitrary step title is exported. Measure on existing pinned Linux image; local macOS smoke establishes reporter operation only. Profiling is not an optimization or target-completion claim.

Implementation agent browser_evidence_code owns only e2e/timing-reporter.ts and its standalone sanitizer/aggregation proof. Root owns registration/workflow/measurement/implementation coordination. Code reviewer ci_lifecycle_code investigates safe opportunities read-only, then reviews exact final candidate. Adversarial reviewer unified_code_review reviews coverage, lifecycle and artifact trust independently when a concurrency slot frees. Existing reviewer contexts are reused because fresh thread creation hits the service limit; this is an explicit clean-context gap. There are four configured slots including the orchestrator; the user-requested five concurrent agents cannot be supplied by this environment.

Do not remove or weaken coverage/assertions, bypass real controls, disable normal motion, mask retries, truncate timezone options, multiply charged jobs, or weaken main-only publishing, cache integrity, exact artifact/source trust or bounded evidence retention. Use actual clocks and preserve original failed experiments with corrections separately.

Acceptance: matching complete successful PR plus main publication pair, at least 20% reduction in per-job rounded minutes and projected storage, raw speed improvement, all required checks, independent code/adversarial no-blocker verdicts, exact artifact/published evidence. Historical unknown TIE-370 CI cause and nine physical-device/human gates remain separate and open.
