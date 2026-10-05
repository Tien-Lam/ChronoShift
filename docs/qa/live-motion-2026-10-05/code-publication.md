# Independent publication audit — original report

This audit is separate from the immutable implementation, CI-failure and delta reports. It independently queried GitHub through `gh`, downloaded both archives into an isolated temporary directory, extracted only after checking their members, and fetched every public file. It did not reuse the root's extracted inventory or change `dist`.

**Publication implementation verdict:** approved within byte/source/workflow identity scope. All 64 audit checks passed; the exact trusted tested files were deployed from the reviewed source tree.

**Original feature report:** N/A. The earlier CI interaction failure remains documented separately and its fixed-candidate browser evidence is in `code-delta.md`; this audit does not extend those bounded interaction checks into physical-device acceptance.

## Source and trusted gate identity

PR 35: https://github.com/Tien-Lam/ChronoShift/pull/35.

- Reviewed head: `0f7812fc2e59d9adb1d5c7f6eac92ca23240a2f8`.
- Tested release source (PR synthetic merge): `8efda34526ff8765e254ec20d3c08f385fb7a911`.
- Main merge and main at audit time: `1114a717f2d1c2b97d4ddf7200a18984ab70bcb1`.
- Independently resolved Git tree for all four: `9f6d5607ae14cbfc21c263b3bad14c70985f7a78`.

The release source has the previous main and reviewed head as its parents. Its metadata intentionally identifies the CI-tested source; equality was checked by exact Git trees rather than requiring the squash merge's commit ID to equal the synthetic PR merge ID.

Trusted Web run: https://github.com/Tien-Lam/ChronoShift/actions/runs/37264918019, attempt 1, completed success; path `.github/workflows/web.yml`, workflow ID 373926111, event pull_request, same repository ID 1206473449, exact reviewed head. The successful candidate Web check references this run. Full step inventory is complete; format, unit/build, corpus audit, browser suite, repository-subpath verification and verified Pages upload all concluded success.

Publishing run: https://github.com/Tien-Lam/ChronoShift/actions/runs/37265470250, attempt 1, completed success; path `.github/workflows/pages.yml`, event push, branch main, exact merge SHA. Prepare and deploy succeeded; verify skipped after trusted reuse. Independent logs identify reuse of Web run 37264918019, source 8efda345… and the exact tree above. The workflow source serializes preparation through deployment and permits only main publication.

The main required-status-check branch-protection endpoint returned HTTP404 “Branch not protected.” Therefore this report does not claim repository enforcement; it independently required every named full gate step and the successful candidate Web check. This is a policy state recorded as an evidence gap, not a missing check in this publication.

## Archive and deployed identity

| Origin | Artifact ID | ZIP SHA256 / GitHub digest | TAR SHA256 |
| --- | --- | --- | --- |
| Successful PR CI | 11325818367 | `a3bdde1505228a6fa866374a6039b4233da023d01b7ce1f1630ad1c2cfcbe428` | `af5478472e01869482256f8798830b99bbc8b6471f32b88f3eb69583a8cde9d6` |
| Main Pages | 11326146823 | `85928e25ea70dc273114cf7467bcc8458ad9329036dfda455ccb35894db4f7a6` | `0129d8b5241009e09d75b278f0a015213914924ada51c1c0135565a00e59ad6c` |

Both nonexpired archives match GitHub's own sha256 digest and have exactly one ZIP wrapper member, `artifact.tar`. Both TARs contain 17 unique safe relative members (14 files plus root/assets/fonts directories). No traversal, absolute paths, backslashes/newlines/NULs, duplicate normalized names, symbolic/hard links or special entries were accepted. Extraction was bounded and isolated; subsequent lstat independently allowed only files/directories. ZIP/TAR bytes differ between uploads, while the sorted extracted file paths, sizes and SHA256 inventories match exactly.

Both release.json files contain source `8efda34526ff8765e254ec20d3c08f385fb7a911`, base `/ChronoShift/`. All 14 files at https://tien-lam.github.io/ChronoShift/ returned 200 and matched the Pages artifact by exact SHA256 and length, including HTML, app/CSS/worker/font assets, manifest, service worker, icons, notices and font licenses. The separately fetched public root also matches index.html.

Representative public identities:

- index.html: `0bbd259caebdaecf989ef236784b531f5e2633d763ca735f7287d84202047277`, 1248 bytes.
- assets/index-C_14_jcq.js: `e89366b51e8eb27241a30fc9f711ac259765fae716f31f404e519f098173a43b`, 774792 bytes.
- assets/index-CQJea-JE.css: `d1862cc191ef6ba2e2883719e3b2a681a272643267624adb6ec95b3802887c4f`, 20760 bytes.
- sw.js: `aef9e51f1dd10c4c4de89489e8f36c1350d599b448461c5014bc614ecd612edc`, 11662 bytes.

The complete inventory, URL/status/headers, GitHub metadata/jobs/checks, safe members and individual command timings are retained in `code/publication-audit.json`.

## Commands, time and limits

Environment: macOS arm64, mise-managed Bun 1.4.0 and gh. Preparation read the repository publishing/verifier/workflow source independently. A single 45-second-bounded `gh run watch 37265470250 --repo Tien-Lam/ChronoShift --interval 15 --exit-status` returned success; no incomplete gate was bypassed.

Actual audit command:

```sh
AUDIT_MERGE_SHA=1114a717f2d1c2b97d4ddf7200a18984ab70bcb1 AUDIT_PAGES_RUN=37265470250 AUDIT_RELEASE_SHA=8efda34526ff8765e254ec20d3c08f385fb7a911 mise exec -- bun docs/qa/live-motion-2026-10-05/code/publication-audit.ts
```

Audit ran 2026-10-05T04:55:13.704Z–04:55:30.140Z. The script retains initial failed candidate/run metadata as historical context while requiring only final reviewed head and successful replacement CI as acceptance. Public fetches used no-store and a bounded audit query; no conversion inputs were transmitted. Archive binaries/extraction remain in the recorded isolated temporary directory, while durable JSON/script/report contain the identities and checks.

This establishes the deployed bytes and source/workflow identity at the recorded time. Hosted interactive browser, cached-client update/offline behavior, real IME/phone/screen reader and human motion preference acceptance are separate evidence. Root owns the hosted behavior gate. Later documentation/evidence-only main commits can change the current main tree without changing this runtime deployment; this report's exact main identity is explicitly the audit-time merge.
