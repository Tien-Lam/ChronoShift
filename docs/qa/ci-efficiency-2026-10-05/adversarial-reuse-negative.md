# Independent reuse verifier composition harness

Saved 2026-10-05T06:33:35Z. Reviewer context is reused from the independent adversarial review; no peer reviewer report or verdict was read. This supplement preserves the earlier reports.

Implementation verdict: no blocker found within the exercised verifier composition. All 12 independently derived cases passed using the actual unchanged `scripts/reuse-pages-artifact.ts` entry point. Publication/report-resolution verdict: pending actual GitHub fast-path and fallback evidence. These synthetic results establish neither hosted publication nor the TIE-375 quota target.

Head before and after: `8a4ebec0881f8363ffd19f833bbf29a44e77885a`; actual local Git tree `e66f5c811b8635a8b912fbc25acf0999a283bfbc`. Actual helper SHA-256 `a2ab1a1b5ba2e240dab974b7a725a096a63adf01e1255e75fe70ea8716ac5af1`. Final harness run: **2026-10-05T06:33:26.145Z–06:33:27.861Z**. macOS, mise-managed Bun 1.4.0 at `/Users/tien/.local/share/mise/installs/bun/1.4.0/bin/bun`, actual Git 2.56.0 and bsdtar 3.5.3/libarchive 3.7.4, existing system zip/unzip. No tool installations, network, builds, CI reruns or deployments.

Command: `/Users/tien/.local/share/mise/installs/bun/1.4.0/bin/bun docs/qa/ci-efficiency-2026-10-05/adversarial/reuse-verifier/harness.ts`.

The harness executes the absolute production helper in per-case temporary working directories. `GIT_DIR` points to the repository's actual `.git` and `GIT_WORK_TREE` to the temporary case; only `git rev-parse` is invoked. A temporary PATH-first `gh` executable provides **synthetic mock responses and controlled ZIP bytes**, logs every request and rejects unknown routes. Actual authenticated `gh` and the network are never invoked. Tokens are omitted from the child environment. The helper uses its own actual archive listing, digest, extraction and output-append implementation. No helper exports are substituted or predicates called directly.

Each case begins with a temporary `dist/sentinel.txt` and `GITHUB_OUTPUT` containing `prior=value`. Success must return zero, append exactly `reused=true`, remove the sentinel and produce the exact independent fixture inventory. Rejection must return zero, append exactly `reused=false` and preserve the sentinel inventory. Thus a rejected reuse leaves the prepare job successful and requests the existing complete `verify` path by its source predicate; actual GitHub expression/job execution remains a separate gate.

| Synthetic condition | Observed result |
| --- | --- |
| Same actual checkout/main/run/release trees; successful trusted workflow/steps; exact ZIP digest; safe static tar | `true`; exact three-file fixture inventory |
| Missing Pages artifact | `false`; no archive download |
| Expired Pages artifact | `false`; no archive download |
| PR run tree differs | `false`; stops before jobs/archive |
| Advertised SHA-256 differs from downloaded bytes | `false`; digest mismatch |
| Tar contains a symlink aimed outside the extraction directory | `false`; unsafe paths or links, before extraction |
| Jobs API returns synthetic HTTP 503 | `false`; caught CLI failure |
| Release source commit resolves to another tree | `false`; tested artifact tree differs |
| Successful job omits required browser step | `false`; no archive download |
| Jobs count advertises a truncated list | `false`; no archive download |
| ZIP includes another member besides `artifact.tar` | `false`; unexpected archive |
| Publishing commit tree differs from actual checkout | `false`; stops before run search |

All false outcomes emitted output SHA-256 `b63e8e3a74135994dfa9dd9c238a1cb9806bdf77ad9e09bfc41ab24b5c20d44f`; true output SHA-256 `75f64afd9643d65eb36f25897ec0e2762b4132c1b909296bf7aea341de26e491`. Source head stayed stable and root `dist` before/after file inventories matched. The harness removes only its own temporary workspace; the helper removes only its own extraction directories.

Evidence: [harness](adversarial/reuse-verifier/harness.ts), [complete final results](adversarial/reuse-verifier/results.json), and [per-case fixture archives, API requests, outputs and outcomes](adversarial/reuse-verifier/cases/valid/outcome.json). Every case directory contains the original synthetic `artifact.zip`, `artifact.tar`, `fixture.json`, `requests.jsonl`, `output.txt` and `outcome.json`. Final harness SHA-256 `edb0c6365073e0ea690c9d502b89ddc2f8a957e228475e2d878211d04abb139e`; final results SHA-256 `3d7b59d7fc841953c742639dfbf85a4c5ce98d9b1a18e69705668425cd423cbd`.

The first run (06:32:43.043Z–06:32:44.813Z) also passed 12/12; [first results](adversarial/reuse-verifier/results-first.json) and `first-cases/` remain preserved. Its release-tree negative initially modeled inconsistent responses for the same commit. The final harness improves that fixture to a distinct synthetic release commit with a different tree, preserving GitHub commit immutability. An unchanged repeat at 06:33:09.541Z–06:33:11.013Z is preserved in `results-repeat.json`; it followed a failed harness-edit command that made no file change. Only the final distinct-commit fixture is used for the conclusion above.

Gaps: actual Ubuntu GNU tar/unzip behavior, real authenticated API/archive downloading, API permission failures, Pages environment authorization, workflow expressions/cancellation/serialization, external artifact immutability and public file identity require actual workflow evidence. This bounded harness does not exhaust archive size/path/metadata combinations or test `REQUIRE_REUSE=1` (the Pages workflow does not set it). No performance or quota claim follows from the sub-two-second synthetic run.
