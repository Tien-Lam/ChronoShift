# Independent published acceptance: TIE-371 live conversion

Original independent report remains unchanged at original-report.md. This is a bounded post-publication supplement.

Endpoint: https://tien-lam.github.io/ChronoShift/.
Main merge: f31e78f22fa1a6b8e5d2892b96c888d458827fcd, PR34. Published artifact source asserted from actual HTTPS release.json: aa99397c07b058447c4c18fa1c938ced4f09ba97, base /ChronoShift/. Actual sw.js contained expected worker identity 59be1f21293ff6c0; controlling cache chronoshift-59be1f21293ff6c0. Loaded production module index-CEcLWwpD.js and stylesheet index-BEANxCaz.css, real conversion worker asset worker-C690IjaR.js. Parent states reviewed revision6324e17 has runtime identical to originally reviewed e141; exact publication identity is independently verified here.

GitHub CLI `gh run view 37231323924 --json status,conclusion,url,headSha` independently confirmed publication completed success at main f31e78. Run: https://github.com/Tien-Lam/ChronoShift/actions/runs/37231323924. Local `git diff --stat aa99397c07b058447c4c18fa1c938ced4f09ba97 f31e78f22fa1a6b8e5d2892b96c888d458827fcd` returned no changes, independently establishing identical Git trees for artifact source and main merge. Parent's CI232 browser/6skip +1subpath +116units evidence is separate and was not rerun by this probe.

Environment: same macOS Darwin27 arm64/mise Bun1.4.0 as original report. Playwright1.63.0 launched installed Google Chrome channel chrome, version154.0.8037.93. Fresh nonpersistent context; en-AU, Australia/Sydney, initial1280×900, dark preferred scheme; actual app theme changed to dark/light and viewport390×900. Probe UTC start2026-10-04T20:15:30.098Z, end20:15:34.438Z, elapsed4.340s. Command: `bun /tmp/chronoshift-live-adversarial/publication.ts > /tmp/chronoshift-live-adversarial/publication.log 2>&1`.

Observed and asserted:

- Actual release/source/base, sw.js worker identity, HTML module/CSS paths matched expected published artifact.
- After actual offline readiness, incremental typing at35ms/character of April9 2026 9:16pm UTC converted automatically to9:16pm. No Convert button.
- Target UTC→Asia/Tokyo automatically produced6:16am on April10. Target/source behavior remains independent in this bounded journey.
- Clear immediately removed results, and results remained empty beyond700ms. No submit action.
- Long supported12:34:56.789pm result remained preserved during actual viewport resizing. Captures of dark/light at1280 and390 viewed; intact numeric timestamp, readable separate suffix line, clear Copy association, hint/controls fitted, no overlap or clipping.
- Service-worker lifecycle observed before going offline: controller https://tien-lam.github.io/ChronoShift/sw.js, registration active=activated, no waiting worker, scope https://tien-lam.github.io/ChronoShift/, cache chronoshift-59be1f21293ff6c0.
- Context switched truly offline, then reloaded from actual service-worker cache; fresh April9 2026 6:27pm UTC input automatically produced6:27pm, main offline-ready=true. Returned online after evidence.
- No normal-use page errors or console errors. All recorded requests were GET with no body and stayed on tien-lam.github.io under /ChronoShift/; none contained input text.

Measured CSS pixels, both themes identical:

|Viewport|Page scroll width|Workspace|Input/result width|Result height|Time box / font|Copy|
|---|---|---|---|---|---|---|
|1280×900|1280|1072|535/535|444.5|418.969×134.375 /56|55.031×44|
|390×900|390|358|356/356|273.594|256.969×84.219 /35.1|55.031×44|

Raw observations/request inventory and timestamps: publication-results.json. Actual screenshots: published-dark-1280.png, published-dark-390.png, published-light-1280.png, published-light-390.png. Probe code and log retained beside report. No tracked files/build artifacts mutated.

Published implementation verdict: approved within this fresh installed-Chrome/healthy-cache/live-conversion/visual scope; no blockers. Feature report-resolution verdict: not applicable. The published behavior matches the requested automatic conversion without pressing Convert in exercised paths.

Gaps retained: physical IME/keyboard/phone, screen readers, actual browser zoom/phone performance/OS installation/share sheets, damaged or stale cache, older tabs/waiting updates and explicit activation, historical uncontrolled sessions and real-time startup deadlines. Parent's separately run existing-tab update and hosted21-second gates are distinct evidence. This short bounded fresh session does not independently certify those histories. Original narrower280 visual evidence remains from local reviewed runtime; publication captures cover1280/390 only.

Cleanup: reviewer-owned preview listener4254 PID48197 was identified as `bun scripts/serve-web.ts` then stopped; no other preview/process was stopped.
