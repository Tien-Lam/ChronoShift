# Timing provenance correction for independent code review

This correction preserves the previously posted original, candidate and hook-delta reports unchanged. Their hand-entered absolute review times were unsupported estimates and are withdrawn: original header05:13UTC; candidate interval05:16–05:20UTC; final hook-delta05:22UTC. These are not valid test or review timestamps. The source revisions, runtime identity, observations, measured per-case elapsed durations and verdicts are unaffected.

Clock checked with `tools.clock__curr_time({})`: `2026-10-05 05:18:06 UTC`. Shell `date -u '+%Y-%m-%dT%H:%M:%SZ'` returned `2026-10-05T05:18:06Z`. File timestamps were then collected using mise-managed Bun and `node:fs/promises.stat`, converting each `birthtime`/`mtime` with `Date.toISOString()`; [raw structured result](code/timing-provenance.json) records capture at `2026-10-05T05:18:20.726Z`.

The first shell stat command used `stat -f '%N | birth=%SB | mtime=%Sm' -t '%Y-%m-%dT%H:%M:%SZ' ...` without TZ=UTC. It printed local Sydney wall time with a literal Z suffix (for example16:16:19Z for the hook report). That mislabeled display must not be used as UTC; the structured ISO results below supersede it.

| Evidence | Actual recorded timestamp | Meaning / limitation |
| --- | --- | --- |
| code-original.md | birth05:10:22.295Z; mtime05:10:22.298Z | Original report file creation/write; not review start/end |
| code-candidate.md | birth05:15:16.772Z; mtime05:15:16.776Z | Candidate report creation/write; not test start/end |
| code-hook-delta.md | birth05:16:19.169Z; mtime05:16:19.171Z | Final delta report creation/write;05:22claim withdrawn |
| original probe.json | internal started05:08:56.925Z; mtime05:09:16.725Z | Instrumented probe start; JSON write after probes; exact execution end not separately instrumented |
| candidate-bounds.json | internal started05:13:58.073Z; mtime05:14:16.521Z | Instrumented six-case probe start; result write after cases; exact execution end not separately instrumented |
| candidate-update.log | birth05:13:59.045Z; mtime05:14:04.866Z | Shell-created redirected output and final observed write; actual Playwright start/end not absolute-clock instrumented; runner reports5.4s test/5.6s run |
| retention-review.log | birth05:14:14.620Z; mtime05:14:15.620Z | Output-file lifecycle; actual runner boundaries not absolute-clock instrumented |
| hook-delta.json | birth/mtime05:16:02.447Z | Hook-harness result write; harness start/end not separately instrumented |
| hook-delta.log | birth05:16:02.421Z; mtime05:16:02.447Z | Redirected output-file lifecycle; not exact test boundaries |

All table times are2026-10-05UTC. File birth/mtime is filesystem provenance, not proof of exact review or process boundaries. Inspection start/end and uninstrumented console/WebKit commands' absolute test times remain unknown. Original probe snapshots retain their instrumented elapsed milliseconds relative to the recorded start; candidate-bounds captures retain actual per-case elapsed durations. This correction does not invent absolute times from those durations.

Collection command was `mise exec -- bun -e` importing `stat` from `node:fs/promises`, reading the named evidence files, calling `s.birthtime.toISOString()` / `s.mtime.toISOString()`, reading JSON `.started` where present and writing `code/timing-provenance.json`. No tests were rerun.

Reviewer preview PID65813 was verified by `ps -p 65813 -o pid=,command=` as mise Bun `scripts/serve-web.ts`, then stopped via Ctrl-C on reviewer-owned exec session58049 (exit130). A subsequent identical ps command returned no process. Port4262 reviewer preview is stopped.
