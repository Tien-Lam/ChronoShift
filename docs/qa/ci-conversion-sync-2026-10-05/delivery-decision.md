# Conversion synchronization delivery decision

Root decision clock read at 2026-10-05 08:26:52 UTC: retain PR #38 as a reviewed
candidate and keep it unmerged. The final implementation remains `0f0d9d3`; the
complete gate tested PR head `299e3864f01d4e87a1770594628b84cf5a3972c8` through
merge `b69ad947eeb96f20c9c77ac93699c95364219391`. Their full trees independently
match `e0363793275e991d25b47bf7b6307e95187aa2bb`. Later evidence-only commits do
not change those five implementation files.

Both independent reviewers approved the implementation within its idle,
changed-input, successful-conversion contract. The complete Linux gate retained
all configured scenarios and exact assertions: 116 units, 249 first-attempt
browser passes, nine unchanged skips and one subpath pass, without failed
attempts or retries. Original setup mistakes, unsupported calls and corrected
probe reports remain preserved and qualified in their respective records.

Local serial ABBA measurements showed mean observation savings of 244–333 ms per
conversion across three engines. The Linux job took 455 seconds/eight rounded
minutes versus the prior Web job's 400/seven; browser steps were 368 versus 347
seconds. The runner CPU model and initial setup delay differed, so these samples
establish neither a causal gain nor a causal regression. Source correctness and
a local mechanism alone do not establish useful total CI savings. The dedicated
observer/action/deadline lifecycle adds maintenance work; its proposed adoption
reason was CI efficiency. Hold it until reliable incremental Linux evidence or
a separately justified synchronization requirement supports adoption.

No further Actions rerun, merge or candidate publication is needed to record
this conclusion. Web run 37281970385 is investigation usage, not a new normal
publication pair. Its sole Pages artifact is an unpublished candidate with nominal
24-hour retention. The last accepted normal pair remains PR #37 Web37274709527
and Pages37276181716: 442 runner seconds/eight rounded minutes. The original
baseline is 307/eight; the requested reduction is still unmet. No account-wide
monthly billing claim is made.

Public runtime remains main `28059a91ec9984dea4d079b3f684b3a27af669f0`; main's
later documentation commits do not publish a new runtime. TIE-375 stays In
Progress. The historical cause in TIE-370 and nine physical/installed/human
acceptance gaps stay open. No acceptance criterion is lowered by this decision.

The reviewers' adoption recommendations differ. The code reviewer recommends
holding it pending a demonstrated CI benefit or a separate synchronization goal.
The adversarial reviewer recommends shipping for the stronger owned-input
completion contract while retaining the efficiency gap. Root retains the former
decision because no original correctness defect requires this extra lifecycle
machinery, and the current task's adoption purpose is lower CI usage. Both
correctness approvals stand; the different delivery recommendations are saved.

Evidence: [full gate reconciliation](ci/review.md), [code implementation review](code/final-review.md),
[adversarial implementation review](adversarial/final-report.md), and
[code delivery recommendation](code/delivery-supplement.md), and
[adversarial delivery recommendation](adversarial/delivery-supplement.md).
