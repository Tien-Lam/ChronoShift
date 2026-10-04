# Live conversion (TIE-371)

Original request: “live convert feature. Live convert whatever text is there. No need to press convert”.

Base: ac90f3880e630f7e4aed8b5ec02512caec022b70. Branch: codex/live-convert. Head pending implementation.

Scope: App conversion scheduling and controls, browser regressions and existing automation adapted to automatic conversion. Remove the Convert button and keyboard-submit hint. A short debounce after draft or conversion-setting changes runs the existing disposable worker. Keep the result hierarchy, parsing semantics, local-only processing, explicit update activation and preference-only persistence.

Nearby owners: worker request IDs/cancellation, copy promises, asynchronous import conflict detection, restored update drafts, reference-date partial validity, composition events, target/source/date/order/display changes. Latest draft/settings must exclusively own the result. Empty drafts clear immediately. Composition must not convert intermediate text. Failure must recover on another edit.

Code reviewer: derive async failure paths from original request and surrounding code independently, inspect regression expectations, run targeted independent checks. Adversarial reviewer: exercise normal typing/paste, rapid changes, IME, empty/invalid/large text, reference dates, source/target edits, imports/update restoration and offline operation; inspect actual dark/light narrow/desktop page. Feature report-resolution verdict: not applicable. Each reviewer must save original report with exact revision, environment/timing, commands, findings, implementation verdict and evidence gaps before receiving the other verdict.

Capabilities: mise/Bun, installed Playwright Chromium/Firefox/WebKit/Chrome, GitHub via gh. Root preview port 4250; code reviewer 4252 and output /tmp/chronoshift-live-code; adversarial reviewer 4254 and output /tmp/chronoshift-live-adversarial. Do not mutate shared dist or tracked files during review. Preview built candidate after root signals. Physical keyboard/phone/screen-reader acceptance remains unexercised.
