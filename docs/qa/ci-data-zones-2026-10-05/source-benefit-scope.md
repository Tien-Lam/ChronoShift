# Source-only benefit scope

Actual start **2026-10-05 12:21:55 UTC**; first static inventory recorded **12:23:14.205 UTC**, expanded identity map **12:23:45.828 UTC**. This analysis reads production/e2e/config and installed lifecycle source only. No browser, build, test execution, Actions or reviewer verdict was read/run; no runtime/test source changed. HEAD `cea0de547094ba51a598fdc4303409fdf1d36bb7`. Candidate Choices `3047272ecae9a0c681ff7b09ed0592b00ad40cef`, ZoneCollection `cc0356e8ae31c2716ffb70b8a8d78a147dc6a5ff`; baseline Choices `d92d280bd71c6c2841a424d1ae9dbc53c203577c`. Unchanged App `8bec3cbf656e92265f9f586fb9443de6e3c5aecc`, CSS `ffe5ce02cee2073a9b9dc888304465bf41a361f8`; root hover test `6afcf2482d8a570469acdae0d75067a136d1a7e6`; config `7a1c28db0dc15faaff76e2b02d72dc65962c9268`. All inspected test/helper blobs and exact `(project,file,line,title)` identities are saved in [source-benefit-identities.json](source-benefit-identities.json).

Final23-file identity snapshot **12:24:29.123 UTC**; report-save clock observed **12:24:29 UTC**. This note is added after that observation.

**Broad startup eligibility is established; material magnitude is not.** App mounts target and source ZoneChoice unconditionally at lines577/604. A closed native More options hides source visually but keeps it mounted. Baseline RAC ComboBox builds a hidden CollectionBuilder/synthetic Document for each field, including closed popups. Candidate replaces both hidden trees with one per-document complete frozen plain-data snapshot; state, filtering, normal open row mounting and conversions remain.

## Identity map and operation counts

Static definitions expand the explicit clipboard/share and lens/command loops. Five ordinary profiles are Chromium, Firefox, WebKit, Android emulation and iPhone emulation. Foldable runs only its three tests. No Playwright list/import/test registration was executed.

| Family | Logical tests | Configured identities | Active first bodies |
| --- | ---: | ---: | ---: |
| app | 12 | 60 | 60 |
| controls | 4 | 20 | 20 |
| copy-focus | 3 | 15 | 15 |
| diagnostics | 6 | 30 | 30 |
| engine | 1 | 5 | 5 |
| imports | 3 | 15 | 15 |
| live | 2 | 10 | 10 |
| motion | 2 | 10 | 10 |
| offline-install | 6 | 30 | 30 |
| privacy | 5 | 25 | 25 |
| responsive | 2 | 10 | 10 |
| uncontrolled | 3 | 15 | 6 |
| updates | 5 | 25 | 25 |
| foldable | 3 | 3 | 3 |
| **Total** | **57** | **273** | **264** |

The nine uncontrolled skips are declared before navigation for Firefox/WebKit/iPhone (three tests×three projects); Chromium/Android run. Subpath and hosted specs are excluded from this ordinary config and retain separate acceptance. Every active body navigates the app at least once: **at least264 app document mounts /528 baseline hidden field-collection initial mounts per clean no-retry suite**. Candidate still allocates264 complete plain-data snapshots plus two independent state hooks per document. This is not528 visible DOM lists, not zero collection allocation and not528 seconds saved. Retries and extra documents are excluded from that lower bound.

Examples of exact repeat-load counts, assuming each planned journey completes:

- `imports.spec.ts:5` clipboard/shared identities (ten across profiles): clipboard initial+three loop reloads+final reload=5 documents; share initial+three seed/receiving navigation pairs=7. Total **60 documents/120 baseline field builds**, including100 field builds beyond their first-document lower bound.
- `privacy.spec.ts:6` lens/command identities (ten): initial+three reloads=4 documents each, **40 documents/80 baseline field builds**.
- `privacy.spec.ts:119` invalid temporary-text identity (five): initial+four(reload+share-navigation)=9 documents each, **45 documents/90 baseline field builds**.
- `updates`, `offline-install`, `uncontrolled` and app restart identities additionally navigate new/retained/reopened tabs or reload after release transitions. Each actual app document adds two baseline hidden builds; network, worker, installation and release waits remain unaffected.

## Edit/open lifecycle boundary

`live.spec.ts:4` types the32-character message sequentially before opening More options. Across five profiles that is **160 planned textarea character input events /320 two-field parent-render opportunities**, not measured React commits or fresh full collection builds. App's edit/invalidate updates parent state; source/target props and JSX callbacks are revisited. Baseline's hidden tree/content can be revisited, but production WeakMap child caching already reuses stable item elements, and its synthetic collection may retain identity. Do not multiply each event by all rows and call it new mounts. Candidate removes the hidden tree/enumeration path, while the inline defaultFilter/state effects still perform their normal work. Composition, clear/paste, worker completions, preference/date changes, warnings, imports and update state cause additional parent-render opportunities throughout the mapped identities; exact commits require measurement.

Opening More options introduces no new source mount on either version. Opening/filtering a timezone popup still mounts every matching row on both. `controls.spec.ts:55` alone performs12 manual timezone opens per identity (two themes×three widths×two fields), **60 across profiles**; this candidate does not structurally remove those open-row useOption/hooks or natural layout. Row implementation differs, so any measured open/filter effect must be attributed separately. Generic Select, calendar, resize-only work, conversion worker fixture loops (`engine.spec.ts`) and fixed injected lifecycle delays have no claimed direct reduction beyond initial/revisited picker work.

**Decision:** source scope is broad enough to justify a complete matched local ABBA **if current functional/native-layout reviews pass**; it is not limited to a few menu cases. Prefer a bounded cold/repeated-edit observation first if deciding whether to spend the full comparison: distinguish document initialization from cached closed revisits and fully rendered popup rows. Source counts alone do not justify forecasting a material full-gate effect or another hosted run. The strict CI/storage/raw-time/full-identity target remains unchanged and unresolved; no benchmark, savings or implementation approval is supplied here.
