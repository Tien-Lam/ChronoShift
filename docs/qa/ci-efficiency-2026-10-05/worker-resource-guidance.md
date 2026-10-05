# Two-worker experiment: primary guidance and resource evidence boundaries

Primary documentation was checked 2026-10-05T06:33:05Z–06:33:30Z while root's
existing full Linux run completed. No new CI job, runtime edit or installation was
performed by this evidence agent. This is implementation planning, not independent
approval or a measured benefit.

[Playwright's CI guidance](https://playwright.dev/docs/ci#workers) recommends one
worker when prioritizing reproducibility and stability. Its recommendation is not
a benchmark establishing the fastest worker count for this suite. Six workers
made the measured job slower and produced a retry, but that result does not prove
four is optimal. A two-worker experiment with all 258 cases, the same profiles,
motion, assertions, timeouts, retries, pinned image and one charged Web job is a
reasonable next measurement. Reduced contention may improve individual durations;
fewer test slots may instead lengthen the suite. Neither direction is established.

[GitHub's runner reference](https://docs.github.com/en/actions/reference/runners/github-hosted-runners#standard-github-hosted-runners-for-public-repositories)
lists public x64 ubuntu-latest/24.04 as four CPUs with 16GB RAM, and ubuntu-slim as
one CPU with 5GB. The latter runs in an unprivileged container, has a 15-minute
limit and is intended for lightweight work. It does not support Docker-in-Docker.
The full browser job remains on its existing pinned container/runner; root may
separately investigate slim only for the small successful-reuse publisher. Verify
mise Bun/gh installation, checkout, tar/unzip, pinned configure/upload/deploy
actions and exact fallback behavior on that actual runner before claiming support
or time savings. Changes to the publisher runner do not justify altering fallback
verification or artifact trust. Public standard-runner jobs are free/unlimited;
the repository's rounded-time metric remains a proxy, not a billing claim.

Root owns adding bounded same-job environment metadata. Suggested allowlisted
fields: actual capture clock, platform/architecture/OS release, Bun and Playwright
versions, `os.cpus().length`, first CPU model, `os.availableParallelism()`, total
memory, and current process affinity where exposed. Do not dump arbitrary
environment variables, inputs, complete process commands or paths. Recorded host
CPU count and process affinity are different from a cgroup bandwidth limit.

For cgroup v2, read only fixed paths `cpu.max`, `cpu.stat`, `cpu.stat.local`,
`memory.max`, `memory.current`, `memory.peak` and `memory.events` under the actual
container cgroup mount when present. Bound each file and emit null/unavailable on
absent/denied files; never install a profiler or change the limits. Numeric
quota/period provides a bandwidth-cap ratio. `max` means no limit at that cgroup,
not unlimited host capacity. `cpu.stat` throttling can omit ancestor effects;
do not infer no contention from a zero own-cgroup throttle count.

The [Linux cgroup v2 documentation](https://docs.kernel.org/admin-guide/cgroup-v2.html)
defines peak memory as the maximum since cgroup creation (or an FD-specific reset).
A final `memory.current` reading after browsers exit is not peak browser memory.
Read peak before and after browser work, with an `always` cleanup observation step,
and preserve its lifetime scope. Do not write/reset cgroup files in this probe.
The value includes descendant processes and other work in that cgroup; it is not a
single browser's RSS. Capturing CPU usage/throttling and OOM counters before/after
helps characterize the interval, but aggregate cgroup counters and Playwright
operation durations alone cannot establish a causal saturation diagnosis.

Current rejected run 37272392986 has no actual CPU/quota/peak capture; its saved
run log establishes OS/image/region only. Future two-worker and baseline comparisons
must retain exact heads, all case/status/first-attempt identities, full job times,
setup interval, artifacts and complete publication costs. Require useful margin
past the per-job rounding boundaries and raw-speed condition; a green result alone
is not an efficiency win.
