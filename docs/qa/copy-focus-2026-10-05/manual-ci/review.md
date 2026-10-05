# Single manual fallback gate

[Pages37293668474](https://github.com/Tien-Lam/ChronoShift/actions/runs/37293668474)
completed successfully on exact main `a868e4b956caf5d227edc430fc7dca97c0dc2eb6`,
tree `44a2096e710983603a85193c2cd33c05461145cb`. Root dispatched the one manual
run; this reviewer only watched/collected saved evidence. Watch began observed
2026-10-05 **10:00:16 UTC**, returned success observed **10:06:32 UTC**; raw
API/log transfers were complete before the **10:06:46 UTC** processing clock.
Corrected offline reconciliation completed **10:07:15.023 UTC**. Explicit repo
cwd and mise-managed gh/Bun were used; no extra gate, build or browser run.

## Attempts, gates and actual fallback

The full list log reconciles **273 distinct cases/273 attempts, 264 first passes,
nine existing skips, zero failures and zero retries**. Every case identity equals
the final PR40 gate, including all original258 identities and all15 copy-focus
additions. Per-profile pass/skip counts are foldable3/0, Chromium54/0,
Firefox51/3, WebKit51/3, Android54/0 and iPhone51/3. The skips retain exactly the
prior nine CDP-only identities. Existing imports and all new regressions pass
first attempt. Units report **116 pass, zero fail**; subpath passes **1.5 s**.

All thirteen required verify gates succeeded: checkout, corpus capture, mise,
frozen install, pinned browser image check, formatting, units/build, exact corpus
audit, browser suite, resource capture, **configure-pages**, subpath and Pages
artifact upload. All three actual jobs succeeded. Preparation skipped reuse,
configuration, upload and deployment, as expected for workflow_dispatch. The
verify job ran the complete gate, then the separate deploy job actually ran
deploy-pages v5.0.1 at pin `368f82528645a54fb793d4d04e342629a3f51346`, successfully
for eight seconds. This proves execution of the fallback rather than artifact
reuse or a merely configured deployment branch.

The Docker create command explicitly uses `--user 1001:1001 --ipc=host --init`
with the pinned official Playwright image. The verify job successfully executes
checkout v7.0.1 (`3d3c42e...`), mise v5.0.1 (`7a4e45a...`), configure-pages v6.0.0
(`45bfe01...`) and upload-pages-artifact v5.0.0 (`fc324d3...`) inside that
container. This is actual execution evidence for the upgraded actions, with
named job/step metadata and the raw command retained.

Timing flag is zero. Timing and failure-diagnostic uploads skip in this clean
ordinary run; no timing/failure artifacts exist in the API inventory. The
unchanged diagnostic condition tests failed steps or a retained attempt marker,
agreeing with the complete zero-failure list. No direct green marker file is
archived; this limitation is retained rather than claiming file extraction.

## Exact source and artifact metadata

Raw checkout includes actual main a868, whose saved Git commit API tree equals
final tested PR tree44a209. The web tree remains the reviewed App35 tree
`e8a7963096c8dcb09de5a259a966cf1b7aa595d9`; final regression SHA256 remains
`6467c3acb6f5da55573678ac9e64b846fd3f8eba1cdb04b4df6ea59c0bfb429e`.
Workflow pins/configuration/fixtures/lock/scripts retain their reviewed source
identity. Thus the head metadata changed to main while reviewed application and
test bytes stayed identical to final PR CI.

The sole API artifact is `github-pages` **11337716881**, **374906 bytes**, digest
`sha256:16bcf40589de7dbd3dbd72b72983c819ab14c28339907b5abea162a404a582bf`,
created10:05:54 UTC and expiring2026-10-19 10:05:53 UTC. Its source/run metadata
identifies this exact main/run. Configured retention is14 days; nominal size ×
retention is **125,968,416 byte-hours**, not actual billing. The six-byte archive
size difference from final PR's artifact does not establish a source difference;
main build/release metadata is distinct. Root owns downloaded archive/content
verification, public-file identity and hosted/update acceptance.

## Measured cost and interpretation

| Job          | Actual UTC span              | Seconds | Rounded minute proxy |
| ------------ | ---------------------------- | ------: | -------------------: |
| prepare      | 09:59:51–10:00:06            |      15 |                    1 |
| verify / web | 10:00:09–10:05:57            |     348 |                    6 |
| deploy       | 10:06:02–10:06:14            |      12 |                    1 |
| Sum          | Job spans exclude queue gaps | **375** |                **8** |

Browser step273 s, container setup35 s, mise21 s and subpath3 s. The resource
bracket10:01:17.199–10:05:50.130 lasts272.931 s on Linux x64, AMD EPYC9V45,
four logical CPUs/four workers, total memory16,766,414,848 bytes. Aggregate
cgroup CPU delta is912.731761 CPU seconds; throttling counters and all memory
event deltas are zero. Viewports/raster, motion, assertions and profiles retain
their configured complete scope.

Final PR CI was342 s/six rounded minutes with browser285 s on Intel Xeon6973P-C.
Manual verify is348 s/six minutes with browser273 s on AMD9V45; container/mise
steps differ and hardware/run metadata differ. The sum375/eight includes the
two additional fallback jobs. These observations cannot isolate app/action
performance, certify grouped-update savings or satisfy TIE375's original paired
quota/storage/raw-time target. Root owns paired automatic-publication metrics;
manual diagnostic publication is a distinct cost.

## Collection correction and verdict

gh renders reusable-workflow raw log step labels as **UNKNOWN STEP** in this
run, while jobs.json retains correct named steps. The first analyzer inherited
the direct Web gate's label filter, returned zero browser rows and correctly
failed its invariant check; originals are preserved losslessly in
`before-log-label-correction/`. The corrected analyzer identifies actual list
rows directly, excludes the separate subpath row, and reconciles all273 with
final CI and expected original/additional inventories. It exits zero. No hosted
failure, attempt count or original evidence was silently changed. Raw logs and
API files were fully transferred before processing; no partial archive was read.

Implementation/full fallback verdict: **passed** within the exact reviewed
source and complete hosted gate scope. Original report verdict: the implicated
existing case and bounded new focus regressions pass again on main; the original
missing first-failure trace still prevents reconstructing precise historical
interleaving. This report certifies neither root's separate public/hosted audit
nor physical-device history. **TIE375 remains unresolved.**
