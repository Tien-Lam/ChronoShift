# Independent adversarial final review — PR #27

Base: `b432db067ad8176e7f040c74997e2021b629a07c`. Candidate: `49207b81cc013c3c411a52de2a710f6af7b3705c`. Read AGENTS.md, docs/developer/review.md and the actual saved shared brief `/tmp/chronoshift-acceptance-pr.md` before review. No code-reviewer verdict was consulted before the initial independent verdict. Reviewed App.tsx import ownership, conversion/result/Copy, conflict CSS and nearby handoff/update/preference lifecycle. Read-only repository review; probes and build were confined to the archived candidate in `/tmp/chronoshift-acceptance-adversarial-final/source`. No tools installed or user browser/session mutated.

## Findings and separate verdicts

**Implementation:** approved within this bounded import/target/result/Copy and conflict-rendering scope. No actionable blocker found. Independent competing paths passed. Approval does not certify unrelated offline/update/cache transitions or physical acceptance.

**Controlled original bugs:** candidate prevents the controlled delayed clipboard/share draft overwrite and stale share/result association, and hides unresolved-target fallback results/Copy before and after invalid Convert. Original tests failed on base per the retained before-fix evidence; the same three focused Chromium cases passed on this exact candidate in this review. Candidate correction restores accurate Tokyo results and Copy without another Convert. Independently demonstrated adjacent in-flight conversion cancellation, older-share/newer-Paste competition and suppression of an obsolete successful Copy. These support resolution of TIE-334/TIE-335's controlled engineering defects, conditional on matching post-publication checks. No new historical human report was supplied; neither test profiles nor these fixes resolve the nine original capability-specific acceptance gaps.

## Independent journeys beyond supplied regression cases

Derived before relying on supplied tests, using a real production conversion worker and real one-use IndexedDB store in a disposable browser:

- Hold share open success and real worker delivery; type/Convert June 18, 2026 9am UTC; release April 10, 2026 8pm UTC share while conversion remains busy. Input stays June18 and conflict is offered. Explicit replacement clears results/cancels busy state. Invoking the previously held callback after acceptance cannot publish the obsolete June18 result. Converting accepted text produces April10 8pm UTC.
- Start a successful-but-delayed Copy, then start Paste, edit a newer draft, deliver the Clipboard conflict and accept it. Finish the old Copy. Notice remains `Imported text is ready. Choose Convert.` and results remain empty; stale success feedback cannot claim the displaced result was just copied.
- Hold older share; start newer Paste and deliver September1 2pm UTC; release older share. The September1 message remains, with no obsolete replacement prompt.
- Hold production worker delivery for September1 2pm UTC, set target CST, then release worker. No result/Copy is rendered and the target warning is present. Correct target to Tokyo without converting again: 11pm September1 UTC+09:00 Tokyo is displayed and copied, preserving the UTC source interpretation.
- Deliver a Clipboard conflict after a completed October5 3pm UTC conversion, resize through all inspected layouts/themes, then dismiss. Draft/result remain October5 UTC / October6 midnight Tokyo.

Delays are explicitly controlled callback holds ending at the stated lifecycle transitions, not a fixed elapsed-time/timeout claim. They do not model OS share availability or an installed application. No page, page-console or attached production-worker console errors observed in this probe. No unexplained errors; the focused supplied cases intentionally reject Clipboard writes to exercise manual recovery.

## Rendered visual inspection

Inspected all eight actual full-page PNG captures for 320, 390, 768 and 1440 CSS-pixel widths, 844px viewport height, dark and light themes. Conflict has a legible border and text, distinct Replace/Dismiss actions and no clipped text or horizontal overflow. At320 the message and buttons wrap cleanly into vertical rows; at390+ both actions fit on one row. Responsive resizing preserves current draft/results and the pending choice. The conflict follows the conversion workspace in document flow; at narrower widths it is below the initial fold and reachable by scrolling. This is consistent with the existing layout, not a physical-phone visibility or keyboard claim.

Measured dimensions (both themes identical): document width equals viewport width; conflict widths288/358/720/1072px at320/390/768/1440; heights160.375px at320 and93.1875px elsewhere; both buttons44px high throughout. CSS asset `/assets/index-D2lr6vSu.css`, JS `/assets/index-DmOPbjER.js`, worker `/assets/worker-C690IjaR.js`. Production release.json identifies exact candidate and base `/`; service worker version `af6f692d4dd68737`,13 local assets. Raw CSS geometry and release metadata are in `result.json`; captures are `conflict-{width}-{dark|light}.png`.

## Commands, environment and evidence

- Archived exact candidate via `git archive` into the isolated temp source; reused existing dependency symlink without installation.
- `CHRONOSHIFT_SOURCE_COMMIT=49207b81cc013c3c411a52de2a710f6af7b3705c mise exec -- bun run --cwd /tmp/chronoshift-acceptance-adversarial-final/source build`: pass, tool wall0.233s.
- `PORT=4192 mise exec -- bun run --cwd /tmp/chronoshift-acceptance-adversarial-final/source scripts/serve-web.ts`: dedicated isolated production preview. Local binding approved via sandbox escalation.
- `mise exec -- bun /tmp/chronoshift-acceptance-adversarial-final/source/review-probe.ts`: pass, tool process wall1.899s. Disposable browser launch approved via sandbox escalation. Saved independent raw script, observations and captures in this output directory.
- `PLAYWRIGHT_PORT=4192 mise exec -- bunx --bun playwright test --config=/tmp/chronoshift-acceptance-adversarial-final/source/review-playwright.config.ts`:3 focused Chromium tests passed in2.8s; individual848ms/1.2s/446ms. JSON report `playwright-results.json`;1 worker, no retries. Reused own port4192 server; did not repeat the root's full168-case gate.
- macOS arm64, mise-managed Bun1.4.0, bundled headless Chromium153.0.8010.12, en-AU / Australia/Sydney, desktop context plus viewport resizing. Fresh disposable profile became offline-ready on ordinary root-path production assets; local synthetic messages only. No manual device or user profile touched.
- Root reported full gate168 passed; this review independently ran only the bounded probe and focused3 tests. Original before-fix observations remain in repository `code-before.json` and `adversarial-before.json`; no historical cache/OS device cause inferred.

## Explicit evidence gaps

Keep TIE-304/306/309/311/312/314/317/318/320 open with unchanged criteria. Physical installation, real OS share menus, installed restart/physical phone behavior, actual screen readers, native200% zoom and representative-phone p95/CPU/network/performance were not exercised. Browser renders and status DOM are supplementary. Waiting updates, older installed tabs, stale/missing cache assets and post-publication journeys were not rerun by this reviewer; inherited root gate evidence remains bounded to its tested scenarios. No broad acceptance or original-report certification follows from this scoped approval.

Retained report copies: [raw independent probe](adversarial-final-probe.ts.txt), [observations](adversarial-after.json), and [actual shared final brief](final-review-brief.md). Original temporary filenames in the report identify where the reviewer created them.
