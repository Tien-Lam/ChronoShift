# Independent automatic publication supplement

Implementation/delivery: **approved for the observed automatic reuse publication**. No actionable blocker found. This supplement retains the independent source approval in `../fresh-code-review.md`; it does not replace that report or claim the manual fallback has executed.

TIE375: **unresolved**. Actual paired cost is 442 runner seconds and eight rounded minutes: 400 seconds/seven minutes for PR Web 37274709527 plus 42 seconds/one minute for automatic Pages 37276181716. The designated baseline is 307 seconds/eight minutes. Raw time increased 43.97%; rounded minutes did not decrease. The 20% paired-time objective remains unmet.

## Observation conditions and exact identities

Observation began at **2026-10-05 07:10:27 UTC** and ended at **07:12:15 UTC**, from the actual clock. The independent first capture ran **07:11:18.050–07:11:27.340 UTC**; the corrected capture ran **07:12:03.292–07:12:12.522 UTC**. Local tools remain mise-managed Bun 1.4.0/gh 2.100.0 on macOS ARM64. No browser was launched; no CI dispatch, rerun, merge, publication, GitHub write or source edit was performed. All writes are in the reviewer-owned `fresh-code/` evidence directory.

- Reviewed PR head: `b288920d072d6ebb6ca56d1ea83f7c95ea7bed02`.
- Tested PR checkout/reused release: `997f3f2367bef1c877c207a4d89872992382d006`.
- Merged main/publication checkout: `28059a91ec9984dea4d079b3f684b3a27af669f0`.
- Independently queried head, release and merged-main trees all match `c08c0f507faf6f82fac5ce790eb2e1f89fa59cdf`.

## Actual workflow execution

Raw API metadata and the complete runner log independently show successful push publication **37276181716** on `main` at the merged SHA. Prepare is the sole executed job: **07:09:50–07:10:32 UTC**, 42 seconds/one rounded minute. Setup identifies the slim Ubuntu 24.04 environment; checkout, mise, verifier, configure-pages, upload and actual deploy-pages step all succeeded. The deploy step ran **07:10:23–07:10:30 UTC**. The log names reused Web run **37274709527**, release `997f3f2...` and exact tree `c08c0f5...`. Both separate verify and deploy jobs are skipped. No duplicate fallback publication occurred.

The deployment payload references Pages artifact **11330182609**, and the deployment creation names merged main SHA `28059a9...`. The retained archive is **377,331 bytes**, with digest `sha256:500f88e3af805cc8cf66a91915c1bac4ea3b079d91b06b8063d218fc04332318`. Its downloaded size and SHA-256 match the independently fetched API metadata. It has fourteen-day nominal retention, ending **2026-10-19T07:10:21Z**. The PR archive remains **374,697 bytes**, one day.

The single ZIP member is `artifact.tar`. All 17 TAR entries are safe unique regular-file/directory paths. The 14 actual files have independently compared byte lengths and SHA-256 values identical to the PR artifact. Reused `release.json` names `997f3f2...` and `/ChronoShift/`; it correctly identifies the tested tree rather than claiming a rebuilt main release.

Fresh no-store public requests matched every one of those 14 archived files byte-for-byte at `https://tien-lam.github.io/ChronoShift/`, including runtime assets, service worker, manifest and release metadata. The directory root separately matched archived `index.html`. Raw per-file status, content type, size, digest, URL and observation clocks are retained in `automatic-delivery.json`. This establishes archived/public artifact and source identity. Browser offline/lifecycle behavior and physical acceptance are distinct evidence, not implied by static identity.

## Evidence adequacy and a retained correction

I read the owner's `root/publication-audit.ts`, verified SHA-256 **20ef907a5d6a0b4fe415b68b7392c68093bc009abcc1b3e270556c99a3f65724**, and derived my own archive/public comparisons. Its checks are suitable for this bounded source/workflow/archive/public identity claim: they obtain complete API inventories, trust/digest/tree evidence, safe extraction, per-file inventories and fresh public hashes. Its source explicitly distinguishes identity from browser behavior. Its boolean approval alone is not used as evidence here.

My initial helper additionally required exact TAR container bytes. That overstrict condition failed: upload-pages repacks archive metadata even while all extracted file bytes remain exact. The original script, capture and log are preserved as `delivery-audit-initial.ts`, `automatic-delivery-initial.json` and `automatic-audit-initial.log`. The corrected `delivery-audit.ts` independently compares the complete set of file paths, sizes and hashes against bytes read from the retained PR TAR. It passes for all 14 files and preserves the differing TAR hash as metadata. This is an evidence-check correction, not a production fix or hidden application failure.

The automatic run's observed archive sizes project **135,775,944 nominal byte-hours** for its one-day PR plus fourteen-day main pair, compared with baseline **366,990,288 byte-hours**: approximately **63.00% less**. This storage projection meets that part of the objective; it cannot offset unmet raw-time and rounded-minute requirements. A later manual acceptance run is an additional investigation/publication cost and must not be relabeled as part of this automatic pair.

## Remaining states

The owner plans a manual full fallback; it is still unobserved in this supplement. Timeout, cancellation and failed-upload/deploy paths remain source-reviewed, not injected GitHub executions. Hosted behavior and physical-device acceptance remain outside this read-only audit. The safe observed automatic publication closes its execution gap, while TIE375 stays open.
