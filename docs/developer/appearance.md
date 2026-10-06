# Appearance

ChronoShift uses one workspace with two palettes. **Appearance → Theme** selects **Dark**, **Light** or **System**. Dark is the default and reset choice; System follows device colour-scheme changes live. There is no separate design selector. The compact clock/name header leads directly into **Message**, destination controls and results; a hidden page heading supplies the accessible page name. The footer contains the privacy note.

## Layout and visual system

The approved A editorial workspace supplies the common arrangement: separate editor and results surfaces, with results slightly wider. Light maps A's warm paper/clay palette; Dark maps B's forest/lime palette and result emphasis. B's prototype input rail is adapted to the common arrangement. The header, workspace and footer share gutters. The maximum width is 1240px including 40px gutters; columns use `1fr 1.13fr` with a 28px gap at 820px and above. Below 820px they stack in reading order. Gutters shrink to 16px at 760px and 12px below 360px. Resize retains the current draft, results and preferences.

| Token          | Light     | Dark      |
| -------------- | --------- | --------- |
| Page           | `#f7f4ed` | `#0c120f` |
| Panel          | `#eee8dd` | `#141e18` |
| Field          | `#fffdf8` | `#101a14` |
| Text           | `#29251e` | `#e7eee8` |
| Secondary text | `#6d6559` | `#a1b3a5` |
| Border         | `#d4cbbd` | `#31473a` |
| Accent         | `#8e4029` | `#b2ed89` |
| Accent text    | `#ffffff` | `#10200e` |

Geist is bundled locally, with system fallback for other scripts or font-load failure. Light destination headings use a restrained system Georgia accent; both heading variants reserve common geometry so theme selection does not reflow controls. Times use tabular numerals; seconds and milliseconds stay intact, and Copy moves below long values on narrow screens. Workspace surfaces have 24px corners, the message editor 16px, single-line fields 10px, task actions 8px and Appearance a pill. Controls retain 44px targets and an immediate 2px focus outline with 3px offset. Safe areas, viewport-segment layouts and forced-colour borders remain supported. Font/licence assets participate in the offline inventory; no runtime font CDN is used.

## Interaction and motion

Both palettes share finite motion. Live fields, caret, triggers, outer overlays and Copy targets remain stationary: optional reference travel/scale is adapted to opacity or nonanchored icon feedback so positioning and interactions remain stable.

| Interaction               | Behavior                                                                                                                                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page entrance             | Panels fade once per load over 320ms, with at most 40ms stagger. Header/editor are immediately usable; conversion, theme and resize do not replay entrance.                                                                     |
| Controls and menus        | Specific colour/border/shadow feedback takes 140ms. Menus fade in over 180ms and out over 120ms; focus, Escape and dismissal take effect immediately.                                                                           |
| Interpretation and format | Chevron turns over 160ms; content fades over 220ms at intrinsic height, with no height interpolation. Closing content becomes inert immediately and is hidden after the fade; rapid reversal follows the requested state.       |
| Results and state         | Genuinely new committed groups fade over 180ms, staggered by at most 30ms with completion within 240ms. Existing numeric updates are atomic. Empty/error/ambiguity text appears immediately with 180ms finite opacity feedback. |
| Copy                      | Confirmation appears only after clipboard success; reserved label width avoids jumping. Success feedback takes 160ms and returns to idle after about 1.5s. Failure keeps manual copy and accessible status available.           |
| Theme                     | Explicit choices transition surface/text/border colours over 200ms. First resolution and live System changes apply immediately. Draft, results and focus are preserved.                                                         |

Entrance/reveal uses `cubic-bezier(0.22, 1, 0.36, 1)`; colour feedback uses a symmetric ease. Conversion is never delayed for animation. There are no perpetual decorative loops, counting time values or broad `transition: all` rules. Stale presentation work is cancelled or replaced when edits, reset or unmount supersede it.

Reduced motion is honored on first load and live preference changes. Travel, scale, stagger, clock gestures and interpolated disclosure height are removed; requested final states appear immediately and nonessential colour feedback is immediate or at most 50ms. Conversion, focus, validation and copy work identically without animation.

## Preserved state and semantics

The existing **Date format** interpretation and **Time format** display/copy labels remain. Source timezone is only a fallback when input omits a zone; reference date anchors incomplete/relative dates in the source zone. Device/today defaults stay visible when settings are closed, with a correction action that opens settings and focuses the source. Source and destination remain independent. Results and copied/accessibly named endpoints use **From/To**, keeping range association, alternative interpretations and useful assumptions.

Legacy Liquid Lens and Glass Command records retain valid preferences while dropping the obsolete design field. The versioned preference key is unchanged. Reset restores Dark/default conversion settings, clears the reference date and detailed-log opt-in, and retains the message. Input/reference date remain transient; denied storage permits session-only preference changes and conversion. Share/update handoffs and user-explicit update activation retain their existing local-only lifecycle.

The approved compact-header references establish the visual direction; their static prototype predates the production motion requirement. Production acceptance follows [testing](testing.md) and the [independent review workflow](review.md), including normal/reduced-motion interruption and keyboard/pointer journeys in both palettes at desktop/narrow widths, conversion/privacy and offline/subpath/update checks. Save recordings or before/during/after sequences and full reports in ignored `.work/<ticket-id>/`; concise exact-source evidence belongs on PRs/tickets. Browser emulation does not establish physical-device, actual screen-reader or phone-performance results.
