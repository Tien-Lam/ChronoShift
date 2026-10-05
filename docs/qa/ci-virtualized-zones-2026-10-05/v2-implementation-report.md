# V2 public API boundary: proposed shared ComboBox layout

Actual start clock **2026-10-05 12:03:18 UTC**. Exact scope read: [v2-scope.md](v2-scope.md). No current peer review reports/verdicts were read; the root-supplied scope is the only new failure context. This bounded implementation attempt stopped at the public type boundary before changing runtime source. No browser/build/Actions/dependency/test/workflow/commit operation was performed by this role. Shared Choices and style remain the frozen v1 source, not a newly implemented v2.

## Confirmed blocker

The installed `react-aria/useComboBox` declaration distinguishes **AriaComboBoxProps** from **AriaComboBoxOptions**. `layoutDelegate` is on the latter, which is accepted by the lower-level useComboBox hook. It is **absent** from AriaComboBoxProps. RAC ComboBoxProps extends AriaComboBoxProps, not AriaComboBoxOptions. Therefore the scope's assertion that public RAC ComboBox supports a layoutDelegate prop is incorrect for locked react-aria3.52.1 / React Aria Components1.21.1.

Public Virtualizer does support a Layout instance, and ListLayout is compatible with the lower-level hook's public LayoutDelegate option. These successful pieces do not make RAC ComboBox expose that option. The actual installed compiler verifies the distinction in [v2-public-api-probe.tsx](v2-public-api-probe.tsx), using only public imports:

- `Pick<AriaComboBoxOptions<unknown>, "layoutDelegate"> = { layoutDelegate: new ListLayout() }` produces no error.
- `<Virtualizer layout={layout} shouldObserveItemSize layoutOptions={{ estimatedRowSize: 62 }}>...` produces no error.
- `<ComboBox layoutDelegate={layout}>...` produces the sole diagnostic **TS2322**, `Property 'layoutDelegate' does not exist on type ... ComboBoxProps ...`.

Exact command/output/clock/source/environment are retained in [probe JSON](v2-public-api-probe.json) and [raw log](v2-public-api-probe.log). Command: `mise exec -- bunx --bun tsc --ignoreConfig --noEmit --skipLibCheck --jsx react-jsx --module ESNext --moduleResolution Bundler --target ES2022 --strict docs/qa/ci-virtualized-zones-2026-10-05/v2-public-api-probe.tsx`. Actual start **12:04:14.478 UTC**, end **12:04:14.526 UTC**, elapsed48.450458ms, exit1 as expected for this negative compatibility probe. Environment Darwin arm64, Bun1.4.0, TypeScript7.0.2. This deliberately rejected QA specimen is outside the application's tsconfig includes; it does not change production expectations or claim the application typecheck is failing.

An initial attempt used the old in-process TypeScript compiler API. TypeScript7's package root exports version metadata only, so reading ts.JsxEmit failed before compilation; no diagnostics or source edits resulted. That unsuccessful method is recorded separately in the JSON. The installed CLI was then used without installing another tool or using TypeScript's unstable API.

RAC's implementation spreads props into its internal useComboBox call, which may forward an undeclared extra property at runtime. Casting, spreading a structural object to evade excess-property checks, module augmentation or overriding handlers would bypass the explicit public integration requirement, so none is used. The public lower-level-hook fallback described in [implementation-next.md](implementation-next.md) is a different, broader scope and is not silently substituted for this narrow v2 fix.

## Lifecycle observations and unproved conditions

Read-only installed source inspection confirms why sharing geometry is conceptually relevant: useComboBox creates a ListKeyboardDelegate with the supplied **hook option** layoutDelegate, and getKeyPageAbove/Below in that delegate uses item rectangles, viewport dimensions and content size. The public RAC Virtualizer's own renderer uses its layout for the viewport delegate, but that alone does not expose it to the RAC ComboBox input handler.

Before the visible popup mounts, a new ListLayout has `virtualizer=null` and no computed layout entries. Page helpers return null if no item rectangle exists; attached-layout getVisibleRect reads the virtualizer's visibleRect. Layout's public declaration explicitly requires the Virtualizer to call update before retrieving visible/layout info. Installed Virtualizer attaches itself to a layout, and detaches the old layout when replacing its owner; ListLayout update invalidates for collection/size/options changes and removes deleted keys. Therefore merely creating one instance is not a proof that closed/initial/opening/filtering/reopened geometry is synchronized with the input's current displayed collection. No app code manually attaches a virtualizer, calls private methods or freezes stale layout data.

Per-picker sharing would need to keep separate layout instances for source and target, make the instance stable for the ZoneChoice lifetime, retain a complete logical collection and variable row measurement, and let normal library mounting/filter updates own geometry. Real opening/PageUp/Down boundaries, focused persisted keys, zero/few/full filtering, close/unmount/reopen and normal-motion native-height geometry remain untested here. This type blocker precedes those browser checks; no lifecycle regression or fix is claimed from source inspection alone.

## Unchanged-source verification and identity

The untouched application typecheck and scoped formatting check passed. Exact records are [v2-unchanged-source-checks.json](v2-unchanged-source-checks.json):

| Check | Actual start UTC | Actual end UTC | Elapsed | Exit |
| --- | --- | --- | --- | --- |
| `mise exec -- bun run typecheck` | 12:04:34.357 | 12:04:34.498 | 140.67325ms | 0 |
| `mise exec -- bunx --bun prettier --check web/src/components/Choices.tsx` | 12:04:34.498 | 12:04:34.568 | 69.989041ms | 0 |

`git diff --check` also passed. Runtime blobs remain:

| File | Git blob | SHA-256 |
| --- | --- | --- |
| `web/src/components/Choices.tsx` | `bce946afa5b2547f3bece17b3c928c80ab952b35` | `8f8d673449e03553a2a92cae7c7f950972045c9641ecfc4fe2385c9cb62f4bee` |
| `web/src/style.css` | `bfa9ef0fd59fee36bd8547cf71875e0fd8c8a25a` | `6c9266b76d8af98c62781b71a1413797a31c8b016d27cabe1ec22fc4fe0d6e93` |

**Implementation verdict:** narrow v2 blocked by the locked public RAC prop surface; no new source to freeze. Frozen v1 is preserved, with its existing unproved browser acceptance and known reviewer challenge supplied in the v2 scope. Root's independently owned native-focus test preparation is neither reverted nor certified here.

**Original CI objective:** unresolved. No performance, functional adoption, full gate or goal-resolution claim follows from this feasibility/compatibility check.
