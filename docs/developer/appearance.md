# Appearance

ChronoShift uses one Glass Command layout. **Appearance** selects **Dark**, **Light** or **System**; Dark is the default. Escape closes the control and returns keyboard focus to its summary. The converter opens immediately without a marketing hero or design picker.

A single bordered workspace places input and results side by side at 820px and above, and stacks them on narrow screens. Horizontal viewport segments separate the panels across the hinge; tabletop posture confines scrolling to the upper screen. Safe-area insets, 44px controls, 16px text fields, reduced motion and forced-color borders remain supported.

The visual system uses locally served Geist typography, a neutral palette, 8px control corners, subtle borders and flat primary/secondary buttons. Spacing follows 4/8/12/16/24px intervals. The font is an OFL-licensed Latin variable subset; the system stack handles other scripts and font-load failures. Font and license are included in the offline asset inventory. There are no font CDN requests or live backdrop filters.

References inspected on 4 October 2026: [Next.js](https://nextjs.org) for Geist typography and compact controls, [Linear](https://linear.app) for neutral dark surfaces and restrained hierarchy, and [Cloudflare Docs](https://developers.cloudflare.com) for readable spacing and clear theme controls. These are visual references; hosting remains GitHub Pages and the application remains a static React/Vite app.

Legacy Liquid Lens and Glass Command records retain timezone, date-order, time-display and theme choices. Loading/saving removes the obsolete design field, without changing the versioned storage key or persisting input text. System follows device color-scheme changes live. Theme changes keep the draft/results. Reset restores Dark and default conversion settings. Denied storage permits session-only appearance changes and conversion.

The browser gate covers migration from both old designs, Dark/Light contrast, live System changes, resize without lost work, real emulated hinges, offline reopening, update/rollback and storage denial. [Side-panel screenshots](../qa/glass-command-2026-10-04/README.md) record actual desktop and 320px observations. Physical devices, assistive technology, installation and actual browser zoom remain separately tracked acceptance work.
