# TIE-374 independent adversarial original selection review

Source head `842b89d89758a0361915221c6b541deff5257a49`; frozen runtime worker `54d351454214d082`, root build generated 2026-10-05T05:11:41Z, local release source. Preview4264, no production edits/builds by this reviewer. Dist SHA-256: sw.js `d435a616c28e546f162d02404737483491cb899388a5070db5d91581a8d10995`, index-DCZBUIe3.js `d3fc5569e325f92ac9c81ef56a9b2dcc26f08d7e81ef8f874e23f2ef8d4f49e8`, worker-C690IjaR.js `e17b01198be6045d352561d10fe1f6004eb83d106b13f16ef027f0ec36230704`.

This reviewer thread was reused from prior unrelated/preceding completed review scopes; no fresh-thread-context claim. The saved selection brief, original retained CI evidence, Choices.tsx and pinned library lifecycle were investigated independently. No other reviewer's verdict was read. Root later sent the same CI focused/hovered observation and a proposed public-prop fix after the independent trace extraction; candidate assessment is separate.

## Actual commands, times and environment

Local macOS27.0.1 ARM64, mise/Bun1.4.0, Playwright1.63.0 WebKit26.6, iPhone13 emulation, en-AU/Australia/Sydney, normal motion. Competing mouse-capability run uses the same iPhone viewport/user agent with `hasTouch:false`; it is explicitly a separate capability profile, not physical iPhone evidence.

```sh
PLAYWRIGHT_PORT=4264 mise exec -- bunx --bun playwright test e2e/imports.spec.ts --project=iphone-emulation --grep 'unresolved target' --retries=0 --output=/tmp/chronoshift-selection-adversarial/original-results
PORT=4264 CHRONOSHIFT_TEST_SERVER=1 mise exec -- bun scripts/serve-web.ts
mise exec -- bun /tmp/chronoshift-selection-adversarial/probe.ts
mise exec -- bun /tmp/chronoshift-selection-adversarial/probe.ts mouse
```

- Exact original test command: actual shell clock 05:26:33–05:26:36Z; runner one passed, 2.6 seconds. No local exact-case reproduction in that single run, and no assertion relaxed.
- Seven competing normal-motion cases: JSON clock 05:27:35.417–05:27:37.565Z. Typed canonical, hover then Tab, hover then outside blur, explicit pointer option, ArrowDown+Enter, typed alias and custom offset. Under touch-capable local emulation, pointerover on Osaka did not change focused key, and Tab preserved Asia/Tokyo. Explicit pointer/keyboard selection correctly chose osaka. Alias osaka and custom UTC+05:45 remained typed values.
- Same bounded matrix with mouse capability: JSON clock 05:28:30.446–05:28:32.631Z. **Reproduced** Asia/Tokyo → hovered/focused osaka → Tab → osaka. Outside blur with the same focused Osaka preserved Asia/Tokyo. Explicit pointer selection and ArrowDown+Enter still chose osaka; typed aliases and fixed offsets remained intact. There were no force clicks, sleeps or reduced-motion settings.

Raw local records: [probe](selection-adversarial/probe.ts), [touch-capable cases](selection-adversarial/probe.json), [mouse cases](selection-adversarial/mouse-probe.json), [exact original runner log](selection-adversarial/original-run.log), [mouse runner output](selection-adversarial/mouse-run.log). The fixture draft is synthetic April9 UTC text. Additional original failed screenshot/error context/retry trace lives in root's `selection-ci/` and downloaded artifact11326857491.

## Report-level proof and cause

Retained CI run37266977058 failed both attempts on iPhone WebKit/Linux. The retry trace, independently extracted from its trace.zip, shows:

1. After `fill("Asia/Tokyo")`, the input has that value, canonical option is selected, and `aria-activedescendant` points to the canonical option.
2. Immediately before Tab, input and canonical selection still show Asia/Tokyo, but Osaka has `data-hovered=true` and `data-focused=true`; input `aria-activedescendant` now points to Osaka.
3. After Tab, input is osaka and popup closed. No pointer click or arrow command selecting Osaka lies between that fill and Tab.

Relevant raw node excerpts are [retained trace nodes](selection-adversarial/ci-selected-nodes.json) (sequential JSON records). Trace monotonic timestamps: fill start329531.173 ms, Tab start329620.446 ms, a difference of89.273 ms. Trace context provides Linux/Playwright1.63.0 and wallTime1791177709690; those are runner metadata, not this report's writing time.

Pinned React Aria `useComboBox` handles Tab by calling `state.commit()` when the popup is open. `useComboBoxState.commit()` selects the focused key even when it differs from controlled typed value. Ordinary blur takes `commitValue()` instead. ZoneChoice makes canonical IANA ids and city aliases separate selectable keys; Osaka's description matches Asia/Tokyo, so it appears in the filtered list. Hover moves virtual list focus and Tab converts that passive focus into a changed controlled value. This explains the retained CI event order and the independent competing mouse-path reproduction. It is not a generic blur, canonical parsing, clipboard or offline-worker failure.

Proposed causal correction: distinguish passive hover from deliberate keyboard or pointer selection in the timezone list, so Tab leaving a typed canonical zone cannot commit a merely hovered alias. Preserve explicit pointer option activation and arrow/Enter selection. A scoped public ListBox hover-focus policy is preferable to changing parser semantics, removing aliases or weakening exact input/result assertions; normal Select controls should retain their existing policy. Candidate requires those competing paths to pass under normal motion.

**Implementation verdict at original head:** blocker; passive hover can silently replace typed canonical zone on Tab. The corrected result may currently have the same offset, but field identity and user intent are violated.

**Original-report verdict:** reproduced through a bounded competing mouse-capability path, with the original retained CI trace independently confirming the same hover/focus/Tab cause under the reported iPhone WebKit CI profile. One untouched local exact-case pass does not negate that evidence. Candidate prevention remains pending.

Gaps: physical iPhone behavior is unknown. Local touch-capable pointerover did not reproduce the CI hover state, so its exact platform scheduling/capability trigger remains unmodeled. The underlying focus-commit sequence is established from the retained CI trace. No full suite, broad repeated runs, deployment or human acceptance was claimed. Prior offline-readiness approval retains only its earlier scope; historical TIE-370 cause remains unknown.
