# Independent adversarial delta review

Implementation verdict: **approved within the focused interaction/motion scope; no remaining blockers found.** Candidate **`0f7812fc2e59d9adb1d5c7f6eac92ca23240a2f8`**, delta from failed `9a4250219442d9217a903109448a1db0529f37ac`. Retains approval of unchanged scope from `adversarial-original.md` but expressly replaces the CI-path blocker in `adversarial-ci-original.md` with the bounded verification here. Both initial reports and failing raw evidence remain intact.

Original CI-report verdict: **matching Firefox pointer-interception/detachment reproduced on9a42502 and prevented on0f7812f in the exact multi-step journey; Chromium matching candidate journey passed.** Chromium's intermittent original failure was evidenced in original CI, not independently reproduced locally; the full Linux CI rerun remains root-owned acceptance evidence. Feature's original user-report resolution remains N/A. This does not reconstruct every possible input/scroll/timing combination or physical-device behavior.

Review followed the original failed controls339 journey, not a reduced-motion happy path. Read CSS-only delta: press translation now restricted to standalone Copy/text/example buttons; workspace and outer React Aria popup entry fade without translation. The style retains result/component motion and pending pulses while anchors stay stationary. No production/test edits or shared build by reviewer.

Exact candidate production proof: root-built `/` artifact served on independent4254 preview, `release.json` sourceCommit=local; `delta-visual.json` records HTML SHA256 `ad40954ba8e46c1e4f5bc6ab294228b6823956840c47bfc289569fdf99da3b23`, CSS `index-Bst_xchV.css` SHA256 `8d8248b5671d0f98e2298e5ac449864a7fb21c7df9eba5c936dfa978ebd69e9f`, JS `index-BRfazo2p.js` SHA256 `df48eadefaa3fe7d7a8ac31c64752129d81c62e00a55dcde2e155319eff6ce22`. Root owns final release/source-tree/publication identity verification.

Commands:

```sh
mise exec -- bun docs/qa/live-motion-2026-10-05/adversarial/ci-repro.ts --candidate
mise exec -- bun docs/qa/live-motion-2026-10-05/adversarial/delta-visual.ts
git diff 9a4250219442d9217a903109448a1db0529f37ac 0f7812fc2e59d9adb1d5c7f6eac92ca23240a2f8 -- web/src/style.css
```

Exact controls339 journey on normal candidate motion, **no CSS/network overrides, force clicks, selection sleeps or animation-completion waits**: sourceUTC → keyboardTokyo → converted draft → UTC → invalid freeform → +05:45 → empty target/full list → resize280×960 while open → all original popup geometry/style assertions → Escape → filterTokyo → pointerTokyo → canonicalAsia/Tokyo → exact12:00am conversion → pointerNewYork source → canonicalAmerica/New_York with target/result preserved.

This candidate probe ran **2026-10-04 20:38:20.756–20:38:27.623 UTC** on macOS arm64, mise Bun1.4.0, Playwright1.63.0, en-AU/Australia/Sydney, initial900×640 desktop viewport matching CI then280×960. **Chromium153.0.8010.12 passed2.597s; Firefox155.0 passed3.601s**, zero page errors. Raw `adversarial/ci-candidate.json` and two screenshots retained separately. Firefox same browser/profile/journey had failed at Tokyo click on pre-fix9a42502 with HTML interception then option detachment; fresh reduced control and popup-opacity-only diagnostic independently passed before root's fix. This matching failure/success distinguishes the fix from merely rerunning a passing path.

Actual delta visuals: `delta-visual.ts` captured nine cases through **20:38:47.798 UTC** at1280×960 normal,280×960 normal and280×960 fresh reduced motion. Viewed captured actual pending/zone-menu/calendar/reduced-menu images. Both regular popup surfaces computed **translate:none, animation:surface-fade, opacity0.8** immediately on entry; measured active animations confirm opacity entry remains, while workspace also translates none. The transient0.8 opacity is expected within the140ms fade, rather than an idle transparent popup. Pending retains Updating and three live-pulse animations, with no Copy. The280px pending cue still fits its heading row. Reduced-motion pending/menu/calendar have zero document animations, computed animation:none/transition:0s/translate:none and pseudo-element animation:none, with staticUpdating then Live and usable results. Existing precise-time/source/Copy association, content-fit and dark/light settled layout evidence remains valid because this delta changes motion and press selectors only.

Remaining gaps: candidate full Linux CI and hosted final-artifact journey are root-owned and were not duplicated; original Chromium intermittent failure lacks a separate local failing repetition, so rely on retained CI evidence plus candidate exact-journey pass/full rerun rather than claiming exhaustive reproducibility. Physical keyboard/IME, OS/browserzoom, screen readers, phone performance and human animation preference acceptance remain open. No original report, failure logs or captures were overwritten by candidate verification.
