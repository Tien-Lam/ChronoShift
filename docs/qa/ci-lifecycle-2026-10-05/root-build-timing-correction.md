# Root build timing clarification

The original dispatch labels for worker `54d351454214d082` said "generated 2026-10-05T05:11:41Z". Root did not record an instrumented generation event. That label should be treated as the supplied build completion context, not an exact generation timestamp; the exact generation time is unknown. The worker/bundle identity and independently hashed bytes remain the release identity.

Root later told reviewers worker `2eb418e824f28221` was generated at 05:30:28Z. [selection-check.log](selection-check.log) actually records whole-second shell boundaries 05:30:27–05:30:28Z for the combined check/build/format command. The generation occurred within that command, but its precise event timestamp is unknown. README now uses those supported bounds. Original briefs/messages/reports are preserved rather than silently rewritten.

This clarification changes no runtime identity, reproduction, gate outcome or review verdict. Experiment commands with recorded JSON clocks retain their actual measured times; command completion and report-writing clocks are distinct.
