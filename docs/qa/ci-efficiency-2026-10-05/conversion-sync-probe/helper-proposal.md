# Proposed ordinary-success test helper; not implemented

Proposed API:

```ts
await observeNextSuccessfulConversion(
  page,
  () => input.fill(text),
  { timeout: 10_000 },
);
// Keep every current test assertion, including ambiguity/result count.
await expect(page.locator(".result")).toHaveCount(
  text.includes("CST") ? 2 : 1,
);
```

Initial call site: the existing positive `convert(page, text)` helper in `e2e/app.spec.ts`, preserving its existing real fill, independent supplied text and original result-count expectation. Do not wrap worker-failure triggering inputs, Clear, pending/IME/motion assertions, delayed response/probe races, failed installation, error recovery triggering inputs, update activation, share imports or negative absence assertions. Subsequent separate exact time/date/privacy/offline checks remain where they are. This proposal establishes no permission to generalize beyond the selected ordinary-success boundary.

Semantics:

1. Install a test-only browser observer before invoking the real action. Record initial result-panel `aria-busy`, current live state and input value. Optimize only an initially settled state with an actual changed ordinary input. For initially busy/same-input preconditions, execute the action and retain the original locator-assertion path without treating an existing completion as proof of a new cycle. Return explicit instrumentation metadata for such fallback; do not change source state or add a quiet wait for earlier work.
2. Set `attributeOldValue: true` and examine ordered `MutationRecord`s, not only final DOM state. A coalesced false→true→false cycle may appear in one callback. Reconstruct each busy transition from its `oldValue` and the next record's oldValue or final current attribute. Require a true transition belonging to the action armed from idle and a subsequent false transition, followed by state=ready. If records do not establish the new cycle, do not infer success from a prior ready result.
3. Use a promise registered during arming so completion during `fill()` cannot be missed. Observe document/subtree replacement of the panel deliberately or reject it; do not keep watching a detached panel. Treat page navigation/close, missing/duplicate panel, malformed busy state, disconnected DOM, state=error, observer timeout and action failure as explicit failure/cleanup paths. A ready signal supplies synchronization only; current independent result/identity assertions still decide correctness.
4. Bound the observer wait to10seconds, make deadline behavior explicit, and retain the original action and assertion timeout policies. Do not restart a fresh observer deadline after readiness is partly consumed or stack repeat polling deadlines. Clean observers/timers/promise handlers on ready, error, timeout, action rejection and navigation/close. Consume any rejected browser promise while awaiting the action, then propagate the correct action/observer failure without unhandled rejection or abandoned work. A final implementation needs source review of these paths; the bounded probe does not certify them.
5. Keep privacy separation: shared-helper diagnostics may record booleans, fixed phase labels and durations, not arbitrary input/zone/result text. Existing failed-attempt bundles retain synthetic test details under the unchanged policy. This standalone probe's synthetic result identities are not an expansion of production timing-reporter payloads.

Measured basis: `report.md`/`summary.json` contain36 local ABBA conversions across all three desktop engines, six A/six B each. Mean total reductions are325.028ms Chromium,243.785ms Firefox and333.212ms WebKit, with unchanged native pending→settled durations and identical exact assertions. All three blocks per engine favor B; fast A rows remain retained. The scope is serial local ARM warmed ordinary conversion, not Linux/four-worker throughput or a speed estimate for all expectation time.

The saved probe uses live-state/current-attribute reads and requires a genuinely observed pending phase in every recorded row. It does **not** implement coalesced-oldValue reconstruction, fallback preconditions, panel replacement or complete shared-helper failure ownership; those are required before adoption. Its success is evidence for the observation-delay hypothesis, not certification of a reusable helper.

Implementation verdict: candidate merits a small independently reviewed test change in the bounded call site if root chooses it; no implementation approval yet. Original-report verdict: TIE-375 remains open pending a matching complete hosted pair, and no physical/historical acceptance changes.
