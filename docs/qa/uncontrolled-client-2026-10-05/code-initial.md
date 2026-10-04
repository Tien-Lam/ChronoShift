# Initial independent code investigation — uncontrolled retained client

Base inspected: 36c1f03a8b4d3643b685614c8017f760749db745. Review date 2026-10-05. Read AGENTS.md, docs/developer/review.md and saved original brief before deriving failure paths. No counterpart consulted. App and user Chrome profile untouched. Port 4243; disposable installed Chrome context used only for isolated evidence. Initial reproduction evidence is being collected separately in /tmp/chronoshift-uncontrolled-code-probe.json.

Original condition clarification received from root after independent code derivation: user confirmed a hard refresh. DevTools bypass remains unconfirmed. Existing active/waiting/installing states and historical worker identity remain unknown.

## Independent derivation

The current implementation conflates an activated registration with the document controller. `register()` may succeed against unchanged existing worker bytes with registration.active already activated, no installing worker and no updatefound/install-state transition. `inspect()` only sends CHECK_READY to navigator.serviceWorker.controller. Without controller it publishes false and the real 15-second timer emits startup-deadline. `watchInstall()` sees no installing worker, inspects and calls retryInstall; the 1/3-second re-registers do not repeat activation or clients.claim for an unchanged worker. This matches successful registration, no install-state log, no-controller at 0/1/4 seconds and a 15-second warning. Worker activation currently calls clients.claim once, and no message can request a later claim.

The W3C Service Workers specification explicitly describes null controller after force refresh and distinguishes registration.active from a client's controller; Clients.claim operates only for an active worker. Sources: https://w3c.github.io/ServiceWorker/#navigator-service-worker-controller and https://w3c.github.io/ServiceWorker/#clients-claim. This is a causal hypothesis for the confirmed hard refresh until the real Chrome journey independently matches it.

## Finding and bounded remedy

[P1] offline.ts:109–140,149–257 and sw-template.js activation/message handlers: a healthy retained activated registration cannot recover an uncontrolled current document. Retrying registration is unrelated to reclaiming that document, so its offline warning survives despite valid cached runtime files.

Smallest robust remedy: an exact expected scope/script activated registration can answer a bounded readiness request directly, then perform a deliberate active-worker-only claim/recovery handshake. Never mark ready solely because registration.active exists or CHECK_READY is true without validating the controlling identity required by the chosen readiness semantics. Never send ACTIVATE_UPDATE/skipWaiting to waiting workers or automatically reload the document. If browser bypass deliberately prevents claiming or current document control, retain a bounded, actionable diagnostic/error without registration loops. Unsupported older active workers need an explicitly documented fallback or evidence gap. The first-install path remains driven by observed installing/activating state and controllerchange.

Protect asynchronous ownership: retain worker identity for each probe, supersede/close ports and deadlines, avoid a late reply from an old active worker claiming readiness after registration/controller changes; honor AbortSignal after async steps; bound reclaims and retry timers. Register statechange observation for an active-but-activating worker, because register can resolve after installation observation was missed. Preserve waiting-update availability independently of readiness success/timeouts. Recheck actual cache integrity/repair rather than treating successful register/claim as offline readiness.

Opt-in diagnostics should capture only bounded state labels for active, installing, waiting, controller; booleans for expected scope/script/control, navigation type/reload hint, whitelisted reason, worker build version from readiness; no full URL/query, input, selected zones, arbitrary error/worker payload. Report absent/unknown worker states instead of inferring them from missing install logs.

## Initial verdicts

Implementation: blocker in retained activated/no-controller recovery; no candidate reviewed yet.
Original report: matching code path derived and hard-refresh condition confirmed by user. Historical worker state/version and published real Chrome recovery remain unverified. No AdGuard causality established.

## Initial evidence supplement

Installed Google Chrome 154.0.8037.93, headless disposable context, local Pages path /ChronoShift/, existing dist worker e26cfc3dedb05ea4 (release marker local; exact source of preexisting build not asserted). Started preview with BASE_PATH=/ChronoShift/ PORT=4243 bun scripts/serve-web.ts. Ran bun /tmp/chronoshift-uncontrolled-code-probe.ts with actual retained worker/cache and deliberate CDP Network.setBypassServiceWorker(true), then normal reload; this control simulates DevTools bypass, not proof of the user's natural browsing state.

0/1/4/16 seconds: controller absent, registration.active activated, installing/waiting absent, main readiness false. Opt-in logs: register success controlled:false, no install-state entries, no-controller at startup/lifecycle/1/4 sec, startup-deadline at 15 sec. Direct registration.active CHECK_READY returned ready:true, version e26cfc3dedb05ea4, unavailable:[]. Disabling bypass and normal reload returned readiness true. Raw observations: /tmp/chronoshift-uncontrolled-code-probe.json. Thus intact cache + activated registration can produce the exact original timing/log shape, independently of content-filter byte rewriting.

Additional clarification from root: user also reports occurrence during normal browsing. Both confirmed hard-refresh history and broader normal-browsing occurrence are part of the report. The latter remains unresolved; hard-refresh mitigation alone cannot close the broader report. An active-state/version/controller identity diagnostic is necessary to distinguish future ordinary-load no-controller reports.

Second independent journey used the same installed Chrome and healthy retained worker, CDP Page.reload({ignoreCache:true}) only, with no bypass command. This actual hard-reload protocol reproduced controller absent/active activated/readiness false at0/1/4/16sec and warning at15sec. Direct active CHECK_READY returned readytrue. Invoking self.clients.claim() in the real active worker via Playwright debugger (a deliberate recovery mechanism test, not candidate code) yielded controllertrue/readiness true within100ms; existing controllerchange observer recovered warning. Raw /tmp/chronoshift-uncontrolled-code-hard-probe.json. An initial harness attempt failed because CDP reload returned before new-document navigation; corrected by waiting for new domcontentloaded concurrently with reload. No app/browser error implicated.
