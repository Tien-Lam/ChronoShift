# Additional remaining-ticket evidence — 4 October 2026

Actual browser side-panel observations supplement [earlier production evidence](../browser-2026-10-04/README.md). Production URL: https://tien-lam.github.io/ChronoShift/. Synthetic input only; no app source changed for these observations.

- Source correction: Tokyo + reference date 2026-10-06 + `Tomorrow 9am` + target UTC produced 00:00 Wednesday 7 October. The native date picker was operated with keyboard arrows and Return. A locator fill attempt did not alter the date and was not counted as successful evidence. [Snapshot](reference-source-correction.txt).
- Numeric correction: Day/month + Tokyo + `04/09/2026 at 3pm` produced 06:00 Friday 4 September UTC. [Snapshot](numeric-date-correction.txt), [screenshot](correction-controls.png).
- Both designs retained a 10,000-character message with an explicit event at the end, and displayed 09:45 Thursday 18 June 2026 UTC. At measured CSS viewport width 320px, document scrollWidth was 320px. Convert and Copy controls remained usable; Copy produced its success confirmation. [Glass screenshot](glass-320-long.png), [Lens screenshot](lens-320-long.png), [Glass snapshot](glass-320-long.txt), [Lens snapshot](lens-320-long.txt).
- The viewport override initially applied to the separate ML tab; an observed 574px production width was not counted as 320px evidence. After closing the ML tab and selecting production, innerWidth and scrollWidth both verified 320px before the saved narrow screenshots.
- Actual local single-thread WASM model compatibility ran in the side panel. [Experiment report](../../../experiments/temporal-span/README.md), [screenshot](ml-wasm.png). It is pretokenized tensor compatibility, not a deployed ML feature or phone test.

Actual OS installation/share receipt, screen reader output, 200% browser zoom and physical-phone performance are not exposed by this browser surface. Those explicit ticket criteria remain open, as listed individually in [web-acceptance.md](../../planning/web-acceptance.md). Responsive viewport tests do not substitute for those capabilities.
