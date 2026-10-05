# CI iteration and checkout candidate

Base: main f8c073a289f2c4af1f369a4588d5e0e74daf392c. Candidate branch: codex/ci-control-rendering. Production application, expectations, suite inventory and publication verifier remain unchanged. Five deliverable files change: Web/Pages workflows, testing/publishing documentation, and two negative assertions in the existing publishing unit test.

Ready PRs retain the complete116-unit/273-browser/subpath gate. Draft iteration defers automatic hosted checks under `web-deferred`; a new `ci-run` or `ci-timing` label requests one complete investigation, with timing enabled only on the latter event or an explicit reusable input. Ready-for-review starts the final complete gate. Labels left attached do not run future draft pushes or instrument ordinary ready gates. Main push/manual reusable verification remains full, and main-only exact-tree/digest publication trust is unchanged. Both checkout jobs omit only historical docs/qa blobs through non-cone sparse checkout. Full committed tree identity still covers them.

## Reviews and source validation

- [Exact scheduling brief](scheduling-review-dispatch.md), [code review](code-scheduling-review.md), [adversarial review](adversarial-scheduling-review.md). Both approve bounded source scope, with hosted event/check/concurrency and publishing acceptance pending. Any additive corrections are retained separately.
- [Sparse scope brief](sparse-review-dispatch.md), [code report](code-sparse-review.md), [adversarial report](adversarial-sparse-review.md). Full source-tree publication remains intact; unsupported filtering, REST download fallback or stale sparse/cone configuration cannot establish transfer savings.
- [Event expression validation](scheduling-validation/): actual parsed workflows and official @actions/expressions evaluator, independent event/output expectations, retained dependency versions/source snapshots/clocks/raw results. It evaluates expressions, not GitHub scheduler allocation, check presentation or cancellation.
- Root `bun run check` passed116 units/types/root build, and `bun run format:check`, actionlint1.7.12 and git diff checks passed. Root command observation clocks for these short commands were not captured; raw check/format logs are retained. Hosted complete gate and publication must use the eventual committed source. No candidate has been published at this writing.

## Rejected rendering alternative

[Decision](render-decision.md), [code reconciliation](code-render-decision.md), [adversarial reconciliation](adversarial-render-decision.md), and [logging/capability addendum](render-evidence-addendum.md) preserve the bounded conclusion. Stable callbacks/memoized choices saved only1.557seconds/1.132% in the four matched complete273-case local browser workloads. They are not unit/subpath/publishing gates. The72-row serial conversion probe and original oracle correction are retained separately. Runtime edits were reverted; exact rejected source is under rejected-render-source. Prepared lifecycle journeys were not executed. Structured reports/markers reconcile attempts; incomplete raw list streams remain an explicit gap. Generated served dist and HTML viewers remain local, outside Git, while original raw logs/JSON/captures are preserved.

## Draft PR and acceptance boundary

[PR38 assessment](analysis-draft38.md) preserves the test-only candidate's correctness approval and unproven Linux efficiency. PR38 is held, not merged or published. Its455-second gate ran while ready; it became draft afterwards. [Scheduling proposal](draft-gate-proposal.md) preserves actual historical draft run costs without claiming those deliberate investigations were avoidable.

TIE375 and the CI goal remain open: the latest accepted equivalent pair is386seconds/seven rounded minutes versus307/eight, with projected storage63.13% lower. The20% rounded-minute target and improved raw time remain unmet. Checkout payload or local browser gains do not replace that acceptance, and no account-wide monthly savings are claimed. Historical TIE370 cause and actual physical-device/installed/screen-reader/zoom/phone-performance gaps remain separate open issues.
