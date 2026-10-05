# Independent code review — original initial report

This is the code reviewer's independent initial verdict. The adversarial reviewer's report was not read. No browser, build, installation, full suite, CI run, source mutation or protected-file mutation was performed. Only this owned report was created.

## Scope and provenance

- Actual clock observation at review start: **2026-10-05 10:28:27 UTC**. Last source/probe verification and clock observation: **2026-10-05 10:29:37 UTC**. These delimit the read-only command/observation work; report-writing occurs afterward.
- Environment: Darwin 27.0.0, `arm64`, host `Tiens-MacBook-Pro.local`; `mise exec -- bun --version` returned **1.4.0**. Installed React Aria Components **1.21.1**, React Stately **3.50.0**, declared React **19.3.0**.
- Base and checkout HEAD: `f8c073a289f2c4af1f369a4588d5e0e74daf392c`.
- Reviewed uncommitted `web/src/App.tsx` blob: `8a72819c1c20cc6e20b168578d76e71e80e9af29`.
- Reviewed uncommitted `web/src/components/Choices.tsx` blob: `61cfa2b0e23279b9986d816119f0d722272c6bfd`.
- Diff is limited to these two runtime files: App 18 additions/10 deletions; Choices 6 additions/6 deletions. Final hashes matched the dispatch. `git diff --check -- web/src/App.tsx web/src/components/Choices.tsx` passed.
- The brief's baseline revision `35e11bac657a0c379fda48af9b454e674d2ea854` and review base have identical App blob `8bec3cbf656e92265f9f586fb9443de6e3c5aecc` and Choices blob `d92d280bd71c6c2841a424d1ae9dbc53c203577c`; `git diff --stat` across `web`, `scripts`, package/lock and Vite inputs emitted no differences. This checks source correspondence, not the root's served artifact bytes.

The original goal remains >=20% Actions quota/storage reduction with improved raw runner time and the retained 273 configured browser identities, nine capability skips, 116 units, subpath, normal motion, independent exact fixtures and main-only artifact trust/serialization. The saved brief's current 386 seconds/seven rounded minutes versus baseline 307/eight does not establish acceptance. This runtime prototype is not a demonstrated CI saving.

## Independently derived failure paths and source findings

No actionable changed-code blocker was found in the reviewed source scope.

1. **Stable invalidation and stale completion ownership.** App's empty-dependency `invalidate` captures only stable ref objects and React state setters. `draft.current` is synchronously updated by `edit`; `composition.current` is synchronously updated at composition boundaries; request/worker/copy ownership reads the current refs at invocation. It still increments interaction/copy/conversion request versions, terminates the owned worker, clears results/errors/manual copy/notice and computes busy from the current draft/composition. The unchanged worker effect retains cleanup, request/worker identity guards, 250ms debounce, failure handling and later-edit recovery. A late old response cannot regain ownership because a stable callback is not a frozen ref value.
2. **State batching and preferences.** Target/source callbacks capture no render's `prefs`. Their functional setters merge into the state queued at execution, preserving the other zone, theme, date order and hour cycle. Reset queues defaults and invalidates; subsequent zone commits merge with those defaults. Device refresh reads `currentDevice.current`, invalidates, and changes `device`; the blank-value fallback, target invalid flag and both placeholders are recomputed. The callbacks' stable identity cannot suppress a changed `value`, `invalid` or placeholder prop.
3. **Component and collection updates.** Default `React.memo` compares every supplied prop; there is no comparator ignoring callbacks or non-value props. Internal ComboBox state/context updates can still update descendants. Module-level filtering has identical normalization/search semantics and accesses the existing immutable module-level maps/options. No option IDs, labels, descriptions, selection policy, custom-value handling, JSX markup or CSS changed. Installed ComboBox creates collection content with dependencies including children/defaultItems/invalid state; installed `useComboBoxState` filters with dependencies `collection`, `inputValue`, `defaultFilter`, `props.items` (lines 102–108). It still filters when input or collection changes. Stable filter identity avoids invalidation on otherwise identical renders without freezing a query.
4. **Focus/blur and custom selection.** The existing per-control current-value ref and commit deduplication remain. `inputValue` and selected key are independently controlled; custom offsets and unresolved text map to null selection while retaining input. The unchanged ListBox `shouldFocusOnHover=false` prevents pointer hover from choosing the suggestion committed on Tab. The installed library's selected-value/input effects and blur/custom commit paths were inspected. Memoization does not replace deliberate keyboard/pointer commits or their current callback owner.
5. **Asynchronous import/copy and recovery.** Delayed imports compare their saved interaction version to the current ref and offer replacement after zone changes/reset/device invalidation; conversion requests alone still do not invalidate imports. Copy success/rejection checks current copy request ownership, and deferred fallback focus checks both request and focus-intent ownership again. Zone callbacks preserve these invalidation effects. Unchanged offline/update/cache owners were inspected at their App boundaries: startup abort/cleanup, device refresh, explicit update action and draft preservation remain unchanged.

Existing tests were inspected, not executed: `e2e/live.spec.ts`, `imports.spec.ts`, `app.spec.ts`, `privacy.spec.ts`, `controls.spec.ts`, `copy-focus.spec.ts` references and `e2e/choices.ts`. They contain independent expected final values, stale-worker recovery, delayed imports, unresolved-target/copy rejection, reset/storage recovery and owned-list hover/Tab journeys. Their existence does not establish a pass at this exact candidate.

## Measurement design assessment

The serial probe was read only after deriving the failure paths above. It uses matched viewport 900×640, raster 1, en-AU, Australia/Sydney and normal motion; fresh contexts and baseline/candidate/candidate/baseline blocks help avoid a single fixed ordering. Fixed times/date/UTC label and result count are independent of the candidate's output. The retained initial UTC-label setup failure and correction are explicitly distinct from a runtime failure.

The probe's MutationObserver `settled` timestamp means DOM contains a result with `aria-busy=false`; it is **not** paint completion, normal-motion animation completion or a measurement of all rendering. Node/Bun `elapsedMs` includes native input dispatch, protocol and assertion polling. Page `armed/pending/settled` use a separate clock domain; subtract only timestamps within that domain. Chromium `threadTicks` Performance deltas describe the measured renderer interval, not conversion worker CPU or whole runner CPU. The counter window includes assertions/protocol overhead; no counter should be called exclusive collection/filter work without narrower evidence. The observer verifies a pending transition but final exact assertions, rather than the observer's selector alone, establish result identity.

The probe hashes initial HTML-linked assets/release/service-worker files, but that list alone does not hash every transitive worker/import asset or prove which response the service worker served. Root must preserve the served release identity and full artifact/source provenance separately. No faster assertion or earlier observation should be represented as faster painted output or CI savings. No invalid weighted sampling evidence was used here.

## Proposed bounded later execution

After root's serial measurement releases browser ownership, reserve **127.0.0.1:4198** and output `docs/qa/ci-next-2026-10-05/code-lifecycle/` for a small reviewer-owned Chromium/Firefox normal-motion journey using the candidate's intact build. Do not rebuild or modify runtime source. Record actual browser/version, served release/asset hashes and clocks, and preserve any failed setup/attempt.

- Queue a real worker completion, change target/source before delivery, then release the old callback. Check exact final interpretation/result and both independently retained zone strings. Invalid target followed by +05:45 recovery must retain the source and correct results.
- Hold clipboard import and copy rejection across source/target changes and reset. Import must offer replacement; old copy must neither restore manual text/notice nor move focus. After reset and a mocked device-timezone refresh event, blank defaults/updated placeholders and a new correct conversion must remain usable.
- Keep an owned timezone popup open through unrelated conversion completion; verify selected/typed text, owned list and subsequent keyboard/Tab commitment. Scope options by the current input's `aria-controls` because exiting popups may retain old rows.

These are candidate risk checks, not a physical-device or historical-user reconstruction. Broader existing required gates remain the implementer's responsibility.

## Separate verdicts

**Implementation:** approved within the explicitly read-only source/probe-design scope for the exact two blobs above; no source blocker found. This is not an executed browser or release-readiness approval. The proposed lifecycle journeys, visual breakpoint evidence and required full gates remain unexercised in this initial review.

**Original CI-goal resolution:** **still unverified/open**. No reviewer-run Linux whole-gate/publishing pair, >=20% quota/storage arithmetic or improved raw runner time exists in this report. A local ARM prototype/probe cannot resolve the requested CI goal. Physical installation, actual phone performance, screen reader/zoom and historical browser state remain open.

Read commands used `cat`/`sed`/`nl`, `rg`, Git status/diff/show/hash-object/rev-parse, package metadata and `uname`; no source mutation was made. Early path searches for `web/src/Choices.tsx` and `@react-stately` failed because installed paths are `web/src/components/Choices.tsx` and `node_modules/react-stately`; subsequent inspection used the actual paths. These lookup failures are not test failures.
