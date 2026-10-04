# Initial independent adversarial review — uncontrolled client, 2026-10-05

Read saved brief, AGENTS.md and review workflow. Independent of counterpart reviewer. Scope: main36c1f03a8b4d3643b685614c8017f760749db745, unmodified startup runtime index-BjtJ2w8M.js. Actual installed Google Chrome154.0.8037.93, headless ephemeral Playwright profiles on macOS, no extensions or user profile changes. Bun1.4.0 via mise; existing locked Playwright1.63.0. Port4244 serves isolated copy of baseline /ChronoShift build (source local, workere26cfc3dedb05ea4), independent of concurrent root builds.

## Evidence

Commands: `bun /tmp/chronoshift-uncontrolled-adversarial-probe.ts`, `bun /tmp/chronoshift-uncontrolled-adversarial-hosted.ts`. CDP `Page.reload({ignoreCache:true})` exercises actual installed Chrome's hard refresh browser behavior, not mocked registration/controller or accelerated deadlines. Each journey waited17s.

1. Fresh visit installs/claims and reports ready, no warning.
2. Hard refresh on activated existing registration: register succeeds controlled:false; registration active activated, waiting/installing absent. startup/lifecycle probes at0/1/4s remain no-controller. No installation-state logs. startup-deadline at15.001s raises warning; conversion still usable. Baseline local snapshot document17.005s.
3. Same successful independent reproduction on live HTTPS Pages source15b8accd00efd019921e3aef6df62e8ce4b30dd1, worker3ac0e622535455b5, document17.134s. Target changed at+12s to Europe/London, conversion at+13s returned9:20, warning still present17s. Screenshot /tmp/chronoshift-uncontrolled-adversarial-hosted-before.png, structured diagnostics /tmp/chronoshift-uncontrolled-adversarial-hosted-before.json.
4. `Network.setBypassServiceWorker({bypass:true})` with normal reload did NOT reproduce absent controller in Chrome154: navigator controller remained activated, readiness true after17s, no warning. Thus network fetch bypass and absent navigator controller are distinct conditions; must not describe them as equivalent evidence.
5. Disable bypass and normal reload: controller/ready true, no warning.

Confirmed user hard-refresh condition matches browser transition and reported registration/probe/deadline sequence. User also reports normal-browsing recurrence: cause still unknown; stop/start and normal navigation controls in progress. No inference of extension/AdGuard cause or reconstructing user's unknown Chrome history.

## Initial findings/verdicts

Implementation (baseline): BLOCKER — setupOffline requires navigator.serviceWorker.controller to send CHECK_READY, so an already activated healthy exact-scope worker cannot confirm retained offline assets for a hard-refreshed uncontrolled current document. Bounded re-register retries cannot claim an unchanged activated worker and expire into misleading installation warning. Fix must distinguish active registration from current-document control, preserve waiting-update explicit activation, never reload automatically, retain strict asset check, bound retries and preserve draft.

Original report: hard-refresh branch REPRODUCED on exact hosted artifact and local baseline; candidate prevention/recovery pending. Normal-browsing recurrence remains UNVERIFIED and must stay open unless independently matched. No physical-device, user Chrome profile or historical worker-state acceptance.

Evidence files: /tmp/chronoshift-uncontrolled-adversarial-before.json; /tmp/chronoshift-uncontrolled-adversarial-hosted-before.json; /tmp/chronoshift-uncontrolled-adversarial-hosted-before.png. Harness source is saved beside outputs.

## Independent normal-browsing controls (baseline)

`bun /tmp/chronoshift-uncontrolled-adversarial-normal.ts`, Chrome154, real17-second waits: stop all workers via CDP ServiceWorker.stopAllWorkers, normal reload => controlled/ready with no warning at17s. Repeated hardrefresh => uncontrolled/activated/ready false and warning17s. Normal browser Back after navigation to icon => controlled/ready/no warning; normal goto scope => same. Evidence /tmp/chronoshift-uncontrolled-adversarial-normal-before.json. These controls do not reproduce user's additional normal-browsing recurrence, nor exclude unknown browser history/storage/content-filter/previous release states. That report branch remains open.
