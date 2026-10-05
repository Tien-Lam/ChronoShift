# Independently derived code review paths

Derived 2026-10-04T20:23:44Z before reading implementation tests or receiving a stable candidate. Base: 12b9a7f9bf924472c89c9d33aa28ca14fb482365.

- Nonblank input must enter an understandable pending state synchronously after invalidation, including the 250ms debounce. Empty or whitespace-only drafts must remain idle.
- Completion ownership must guard every update: delayed old success/error callback after clear, new input, settings change, and composition start must not restore stale results or overwrite current status.
- Worker constructor rejection, worker error, parser error, no-results and input validation failures must settle pending; a later valid edit must recover.
- IME must cancel prior work, retain draft and pause conversion until composition end. Synthetic composition coverage is distinct from physical IME acceptance.
- Source/target/date/hour-cycle/date-order changes invalidate copyable results and start the appropriate new conversion; partial reference date must settle as an error and recover on clear/reset.
- Clipboard imports must retain current draft/results on conflict and only invalidate on explicit replacement. Immediate and restored imports must enter live conversion without a separate interaction.
- CSS reveal must not own result/request lifecycle. Result mounts, control hover/press, details/popovers and pseudo-elements must stop movement under reduced motion; static Updating/Paused/error status remains visible. Idle indicator must not animate continuously.
- Trace unchanged update handoff, copy request versioning, preferences/theme listeners and cleanup lifetimes to identify state-owner interactions.

Only probes/evidence in this reviewer's own directory may be edited. Root owns full gates, artifact build and publication. Browser port 4252. Original report verdict is N/A for this feature.
