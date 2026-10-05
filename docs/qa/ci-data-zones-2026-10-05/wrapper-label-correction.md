# Root source-preflight wrapper-label correction

After the initial frozen-source report was saved at observed **2026-10-05 12:13:54 UTC**, root identified a source mismatch before builds/browsers or clean review dispatch: RAC ComboBox's `filterDOMProps({global:true})` excludes labelable aria-label from its outer div while routing it through useComboBox to the input. The initial hand-written wrapper had added `aria-label={label}`, creating a second named element and a potential strict getByLabel match. This is a bounded root finding, not a peer-review or executed browser result.

At observed **12:14:07 UTC**, original Choices/ZoneCollection/report/checks/logs were copied noninteractively into `initial-source/` before the delta. Original Choices blob `db9cce20adbd1b4cc4c510b2b4db12e6fd9b0cc6`, SHA256 `82ede66b6a7209f940a8b37026f9e40217ebaf00ba92922135af8cb3b3b99f7b`, is preserved. The preserved initial report's wrapper-label equivalence assertion is incorrect and superseded by this correction and the current report.

Only the div's `aria-label={label}` line was removed. The useComboBox hook retains `aria-label: label`; InputContext still supplies the generated accessible input props. No collection, option, commit, focus, test, CSS, dependency or overlay/motion owner changes accompany the correction.

Corrected Choices blob `3047272ecae9a0c681ff7b09ed0592b00ad40cef`, SHA256 `88681077335d6678e6d9d52e6fd69b04c83f6e7f6b1abde0a9d0caed6973b00b`. ZoneCollection remains blob `cc0356e8ae31c2716ffb70b8a8d78a147dc6a5ff`, SHA256 `d772baf00e8b934fc134698d69f35812b902ad1ea8bb7b799f2b52f687d02cb2`; unchanged CSS `ffe5ce02cee2073a9b9dc888304465bf41a361f8`, root-owned control test `6afcf2482d8a570469acdae0d75067a136d1a7e6`.

Final typecheck/scoped formatting both pass with source recorded/frozen **12:14:19.355 UTC**; [exact clocks/output](wrapper-label-checks.json). `git diff --check` passes. This source correction has no independent browser approval; root's frozen-build matching and fresh clean reviewers remain necessary. No speed/CI-goal/adoption claim follows.
