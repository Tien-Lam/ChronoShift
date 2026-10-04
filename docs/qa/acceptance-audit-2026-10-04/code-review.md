# Independent code review — PR #27

Reviewed candidate `49207b81cc013c3c411a52de2a710f6af7b3705c` against base `b432db067ad8176e7f040c74997e2021b629a07c`, 2026-10-05. Read the saved final brief in `/tmp/chronoshift-acceptance-pr.md`, AGENTS.md and the review workflow. No adversarial reviewer verdict consulted before this verdict. Read-only tracked source review; no user browser/session mutation or tool installation.

## Scope and reasoning

Inspected the App import, conversion, target display and clipboard ownership paths, pending import controls, related CSS, all new regression tests, and surrounding handoff storage, update restoration, preferences, display/copy formatting and worker lifecycle owners. Import generations independently select the latest initiated receipt; conversion generations protect edits, Clear, option invalidation and newer conversion work. Explicit replacement calls `edit`, which cancels conversion and removes previous results/manual copy. Unresolved targets gate all rendered result groups and copy buttons; correction reformats retained source instants. Copy generations cover edits, invalidations, Convert, target edits and display format changes. Imports remain transient React state; no new persistent storage or network text path.

Regression expectations specify independent UTC dates/times and target offsets, rather than reproducing internal implementation. The saved before-fix observations and three failing old-app regressions distinguish the reported defects from the candidate. The implementer reports the full 168 browser cases passing; this reviewer did not repeat the full gate.

## Independently derived verification

Ran `mise exec -- bunx --bun vite build --outDir /tmp/chronoshift-acceptance-code-final/vite --emptyOutDir`; succeeded. `diff -qr dist/assets /tmp/chronoshift-acceptance-code-final/vite/assets` had no differences. The local release metadata says `sourceCommit: local`; byte matching the fresh candidate build establishes the relevant served App/CSS/worker identity independently of that metadata.

Asset SHA-256:

- App index-DmOPbjER.js: `6d3babeca47dcc18a175816224f062adffbda7d66edcca145314730e0622d17c`
- CSS index-D2lr6vSu.css: `a129ce37f6e02a2099a96dcd3bf33391625a093abe92881f12739d74855d00fd`
- Worker worker-C690IjaR.js: `e17b01198be6045d352561d10fe1f6004eb83d106b13f16ef027f0ec36230704`

Ran dedicated local preview `PORT=4191 mise exec -- bun scripts/serve-web.ts`, then `mise exec -- bun /tmp/chronoshift-acceptance-code-final/probe.ts`. Chromium 153.0.8010.12, fresh isolated desktop context, en-AU, Australia/Sydney. Script execution 0.975 seconds. Delays are deterministic held callbacks, not physical-device timing measurements. All four independently selected competing paths passed, with no page errors:

1. Started Paste, started a real conversion, held its completed worker message, delivered conflicting clipboard text, explicitly replaced the draft, then invoked the old completion. Old results remained absent and busy reset; a later real conversion produced April 9, 2026 at 3pm UTC.
2. Held a real conversion, changed target to unresolved CST, then delivered the completion. No result was exposed. Correcting to Asia/Tokyo produced April 10, 2026 at midnight with UTC source interpretation and no second parse.
3. Held a successful copy completion, edited the input, then completed Copy. It did not revive copied feedback or manual-copy content.
4. Issued two clipboard reads, completed the newer read then rejected the older. No obsolete failure notice or replacement appeared. A subsequent latest-read rejection preserved the draft and offered direct-paste recovery.

Retained [raw script](code-final-probe.ts.txt) and [JSON evidence](code-after.json) are adjacent; copied from the original temporary review directory. Intentional injected clipboard failures were handled; there were no unexplained page errors. No target/tool/source edits occurred during review.

## Separate verdicts

Implementation: APPROVED within this exact import/target/copy scope; no actionable blockers found. This is not general certification of all device or hosted behavior.

Controlled original reports: the saved before-fix clipboard, share and unresolved-target reproductions are prevented by the candidate's regression matrix, and this independent review verified adjacent completion/cancellation/recovery paths. Clipboard cancellation and unresolved-target recovery were directly exercised here; the supplied full gate carries the delayed share regression. Hosted publication identity and matching post-publication journeys remain delivery work before closing TIE-334/TIE-335.

Physical/capability acceptance: TIE-304, TIE-306, TIE-309, TIE-311, TIE-312, TIE-314, TIE-317, TIE-318 and TIE-320 remain open with unchanged evidence gaps. No physical phone, OS share/installed lifecycle, actual screen reader, actual browser zoom, foldable hardware or representative-phone p95 capability was exercised. Emulation or scoped code approval does not resolve them.
