# Final-head adversarial delta and acceptance boundaries

Implementation verdict: inherited static approval applies to final PR40 head
`eef0d51ea3ca835dfe27d7e157c6bfad1610a7b3`, tree
`6d01fce2b52fcfc27f6343812c02099857856f28`. No new blocker found in this bounded
delta. Original-report/runtime-acceptance verdict: still unobserved by this
reviewer; the final gate and publication journeys require their own evidence.

Actual local read/identity observation: 2026-10-05 09:08:19 UTC, start and end
clock reads within the same second. Report writing follows. Explicit cwd was
`/Users/tien/Developer/ChronoShift`. Commands: git show final commit/tree;
git diff --stat and --name-only from approved implementation
`416f94e559a8b49237c58ca44455db8a6067a043`; git rev-parse final workflow blobs;
git show final Pages workflow and custom artifact verifier. No tests, API,
Actions, runtime check, source/Git mutation, or other reviewer's verdict read.

Both workflow blob IDs exactly match the earlier implementation:

- Web: `4a2d098605337417b84965f2227d1cda67a981d7`.
- Pages: `403f2d3a603847520efc76033141f272e3094fdb`.

The final delta is confined to 140 docs/qa evidence files. Excluding docs/qa,
git diff --name-only is empty. Consequently runtime, fixtures, workflows,
custom trust verifier and tool configuration approval are inherited. The expanded
evidence does change the complete Git tree, so an earlier gate's artifact cannot
establish final-head reuse identity. Preserve original reports and the focused
documentation correction verdict; save this post-push report additively without
changing the final head solely to annotate its gate.

## Independently derived acceptance paths

Automatic main publication must first show a complete successful final-head Web
PR gate and actual direct v7.0.1 timing-upload execution, separately reconciled
with browser attempts and artifacts. After merge, the API main tree, checked-out
tree, PR run head tree and release.sourceCommit tree must agree. The main push's
Slim prepare job must log verified reuse from that trusted same-repository Web
run, succeed with upgraded mise/configure/upload/deploy, and skip reusable verify
and separate deploy. Re-uploaded publication artifact identity must belong to that
main publication run. Verify downloaded ZIP SHA256 against API digest, its sole
artifact.tar member, safe tar entry types/paths, exact extracted file hashes and
fourteen public files/release identity. A green prepare job alone does not supply
those checks. Current publication-run artifact ownership is distinct from the
trusted source PR artifact ownership.

Explicit workflow_dispatch on main skips reuse and has no reused=true output.
Prepare must succeed, verify must run the entire reusable Web gate with
publish-pages=true, and deploy must run only after verify succeeds. This exercises
configure-pages in the UID1001 Playwright job container and Pages artifact upload
there; deploy-pages executes in the separate ubuntu-latest job, not in that
container. Full gate success, final-tree/release identity, 14-day artifact metadata,
deployment success and public-byte/hosted verification are required. This
successful manual fallback proves the full manual route; it does not demonstrate
a corrupted-artifact fallback or historical rollback/restore.

Inspect failure conditions separately. Missing, expired, mismatched, unsafe or
unavailable PR evidence is caught by the custom verifier and writes reused=false,
selecting full verification. A failure writing GITHUB_OUTPUT or a job timeout can
fail prepare instead; those conditions should not be described as successful
fallback. Configure/upload/deploy failure after reused=true fails prepare and
must not start a second publication. Failed verification must not deploy.
Cancellation skips diagnostic uploads by design. Successful timing upload proves
one uploader branch; it does not prove an actual failed-first/successful-retry
diagnostic branch or completeness of its uploaded files.

The five-minute publication job deadline remains shorter than deploy-pages'
ten-minute action default, and v5's capped jittered pending polling may delay
completion reporting. Source signal handlers request cancellation, but successful
server cancellation after timeout/termination and protection against an old
server deployment surviving into a newer publication remain unobserved. Workflow
serialization protects ordinary preparation/deployment ordering; static review
does not prove every server-side terminal state. No deliberate failure dispatch,
deadline/cancellation capability or historical rollback journey was available or
exercised by this reviewer. Keep these bounded gaps and performance/physical
acceptance separate from successful automatic reuse and manual fallback.
