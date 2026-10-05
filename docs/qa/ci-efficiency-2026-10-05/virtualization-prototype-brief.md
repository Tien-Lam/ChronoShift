# Timezone virtualization measurement prototype

Authorized scope: a bounded measurement candidate for TIE-375, not an approved
optimization or acceptance resolution. Work began at 2026-10-05T06:07:07Z on
`77fbf61b33d0b2752a3f90b20a261f30f0842b0f`, Darwin arm64, with installed
react-aria-components 1.21.1 and mise-managed Bun 1.4.0 / TypeScript 7.0.2.

The successful four-worker Linux control has 249 passing tests and nine capability
skips. Its five-profile timezone/control menu sweep spends 109.847 seconds of
summed test duration, including 53.237 seconds in click steps and 21.580 seconds in
leaf expect steps. Click durations include browser/actionability work and waiting;
they do not establish CPU costs or prove that DOM size is causal. The separate Mac
DOM probe found 454 Chromium / 479 WebKit rendered options with 2,723 / 2,873
descendants and 320px viewports. See `control-analysis.md` and
`menu-dom-probe.json` for source clocks and limitations.

Only `web/src/components/Choices.tsx` and `web/src/style.css` are runtime candidates.
The public `Virtualizer` and `ListLayout` wrap only the `byValue` timezone ListBox.
The unchanged complete collection supplies the existing IDs, labels, descriptions,
search text, aliases, custom offset handling, and controlled ComboBox value flow.
General Select lists do not receive a virtualizer.

The [official Virtualizer documentation](https://react-aria.adobe.com/Virtualizer)
describes variable row layouts using `estimatedRowSize`. This prototype estimates
62px, matching an ordinary description row's existing 24px label, 2px gap, 16px
description and 20px padding. Installed public types expose `shouldObserveItemSize`;
the installed implementation observes direct item children with ResizeObserver and
updates layout measurements. Existing natural heights, wrapping, 44px minimum and
320px maximum viewport remain. Scoped CSS uses block layout and hides horizontal
overflow; it does not set a fixed row height or truncate text. Existing motion
rules and the no-hover-focus setting remain.

Delivery must establish benefit with comparable Linux measurements and preserve all
current cases/assertions. Independent reviewers must exercise End, Home, arrows,
Tab, Enter, pointer selection, scrolling, all choices including offscreen choices,
empty and short searches, wrapped descriptions at narrow widths, focus/selection
ownership, accessibility relationships, and CSP under the existing motion/profile
matrix. Source inspection and typechecking cannot establish those outcomes.

No dependency, test, workflow, backend, storage, or network changes are authorized
in this prototype. Root owns builds, benchmarks, independent review, final adoption
and delivery; adoption requires measurable benefit and functional evidence.
