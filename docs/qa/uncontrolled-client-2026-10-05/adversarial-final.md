# Final independent adversarial review — uncontrolled client

Candidate: 63c9cdc442eac03c30dbae7871d1452b1049c7b0; base36c1f03a8b4d3643b685614c8017f760749db745. Initial independent verdict retained separately at /tmp/chronoshift-uncontrolled-adversarial.md. I did not consult the counterpart reviewer before the initial report. Reviewed surrounding registration/install/retry/probe ownership and worker readiness/activation paths. No app-source edits or user Chrome-profile changes.

## Environment and source/artifact identity

macOS, actual installed Google Chrome154.0.8037.93, Playwright1.63.0 headless ephemeral profiles, no extensions; Bun1.4.0 via existing mise runtime. Separate port4244 and /tmp evidence. Candidate extracted using gitarchive63c9cdc, built once with BASE_PATH=/ChronoShift/, then build-offline with CHRONOSHIFT_SOURCE_COMMIT=63c9cdc442eac03c30dbae7871d1452b1049c7b0. Exact archived artifact release metadata matches source; worker1a28e83b5db6d47a; runtime index-DJzqWUF9.js. Worker SHA2569e576a86c101c15047e25df96c7bc11b4d6e69815fea96b6574aae316325c5df; runtime SHA2564a0ebd9c9605283a04e8f38c6f08233f3b5935a313410e9953c2ddab1bc7809a. Root dist untouched.

Initial hosted reproduction used live source15b8accd00efd019921e3aef6df62e8ce4b30dd1, worker3ac0e622535455b5, unchanged startup runtime index-BjtJ2w8M.js. Local previous-runtime fixture source local, workere26cfc3dedb05ea4; this differs in artifact identity from the live hosted release and is identified explicitly below.

## Actual browser journeys and results

1. Previous implementation: fresh installation works. Actual Chrome CDP Page.reload(ignoreCache:true) on activated existing registration causes controlled:false, active:activated, no installing/waiting, successful registration and no-controller probes0/1/4s. At15.001s startup deadline produces generic setup warning. Reproduced with full17s waits locally and on exact live hosted artifact. Hosted target focus/change at+12s and successful conversion9:20 at+13s preserve the report's functional conversion alongside warning.
2. Competing browser control: Chrome Network.setBypassServiceWorker(true), ordinary reload and17s wait retain navigator controller and readiness. Network bypass alone is not equivalent to the observed absent-controller state in this Chrome version.
3. Normal-browsing controls: stopping all workers followed by ordinary reload remains controlled/ready/no warning at17s. Ordinary browser Back after hardrefresh/navigation, and ordinary goto, restore a controlling document. These did not reproduce the additional normal-browsing recurrence.
4. Exact candidate transition (`bun /tmp/chronoshift-uncontrolled-adversarial-transition.ts`, exit0): install baseline old active worker, replace entire server tree with archived candidate (old immutable index-BjtJ2w8M.js returns404), hardrefresh into candidate page. Older active worker answers ready:true but cannot implement claim request; at18.153s candidate reports ready:false with distinct 'Offline access is unavailable in this tab. Reload normally to restore it.' warning. New worker remains waiting/installed, Update now is available; no automatic activation/reload (only initial+hardrefresh navigation count2). Conversion9:20 and input draft remain intact.
5. Explicit Update now: exactly one reload (navigation2→3), activated candidate controller, ready:true, no warning/update banner, input draft restored. Final snapshot document0.324s after reload.
6. Hardrefresh after candidate is active: full17.003s beyond startup deadline; activated controller, ready:true, no warning, no waiting update, only user's hardrefresh navigation3→4. The candidate recovers control without automatic reload.
7. Close page, emulate offline network and reopen normal navigation: controlling cached candidate reports ready:true; new conversion9:20 succeeds. This proves usable cached navigation/runtime after recovery on Chrome, not physical-device installation or every browser.

No candidate console errors or pageerrors. Three diagnostic argument serializations lost their browser execution context during intentional navigation; this is harness instrumentation loss, not an application exception. Final state/lifecycle/navigation assertions and post-reload draft checks succeeded.

The active fallback probes only exact script/scope activated registration; worker claims after its strict cache check and same-origin in-scope source validation. Page readiness still requires the actual controller. Waiting worker activation remains explicit. No uncontrolled ready:true false positive was observed with older unsupported worker.

## Evidence and limitations

Final exact-archive evidence: /tmp/chronoshift-uncontrolled-adversarial-transition-after.json and transition-before-action.png; harness /tmp/chronoshift-uncontrolled-adversarial-transition.ts. Before/live evidence: uncontrolled-adversarial-before.json, uncontrolled-adversarial-hosted-before.json/.png, uncontrolled-adversarial-normal-before.json, initial report. All prefixed /tmp/chronoshift-.

Discarded preliminary candidate runs used source-identical runtime with local metadata, or repeated metadata generation that duplicated equivalent CSP tags; final conclusions use the clean gitarchive once-built artifact only. Full app gate remains implementer's responsibility. Candidate not yet tested on live published HTTPS in this review; hosted post-publication exact artifact check remains required. The user's regular browser version/profile, extensions, historical worker/cache state and normal-browsing recurrence cause remain unknown. No inference that AdGuard caused this report.

## Separate verdicts

Implementation: APPROVED within the reviewed hardrefresh/activated-registration recovery, older-worker waiting-update/draft, and subsequent Chrome offline navigation scope. No blockers found at63c9cdc. Approval is scoped and does not certify unknown normal-browsing history or replace required full gates.

Original report: Hard-refresh branch REPRODUCED on previous exact live artifact and PREVENTED/RECOVERED on the exact candidate local artifact after explicit legacy-worker update; existing older worker correctly exposes bounded unavailable-current-tab state and keeps Update now usable. Post-publication matching hardrefresh acceptance remains pending. Broader recurring warning during normal browsing remains UNVERIFIED/OPEN and must not be closed from the hardrefresh evidence alone.
