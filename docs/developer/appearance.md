# Appearance

The converter opens immediately below a compact header. There is no marketing hero. **Appearance** in the header selects a design and a Dark, Light or System theme; Liquid Lens with Dark is the default. Escape closes the appearance controls and returns keyboard focus to the summary.

- **Liquid Lens** places the input and result in separate glass panels on wider screens, then stacks them on a phone or narrow window.
- **Glass Command** uses one compact floating window, with input above the result and the timezone/Convert controls sharing a row when space allows.
- Both designs put input and result on separate physical screens when horizontal viewport segments are available. Tabletop posture confines scrolling to the upper screen. Safe-area insets, 44px controls, 16px text fields, reduced motion and forced-color borders remain supported.

The designs use local CSS gradients, inset shadows and restrained glow. Large panels avoid live backdrop filters: the background already contains smooth gradients, so extra blur adds compositing work without useful detail. Text is rendered on quiet surfaces for contrast; the converted time remains prominent, alongside its date, target zone/offset, source identity and any ambiguity or assumptions.

Design and theme are validated members of the existing versioned preference record. Older records default to Liquid Lens/Dark. System follows changes to the device color scheme live. Switching appearance does not restart the conversion worker or clear the draft/results. Reset preferences restores the default design/theme. Denied storage still permits conversion and appearance changes for the current session. Input is not added to persistent preferences.

Browser coverage extends the existing suite: both designs reflow with the same draft/result, both avoid a real emulated hinge, appearance survives offline reopening, and both dark/light designs pass WCAG A/AA checks. The suite also covers system-theme changes and storage denial. Physical foldable, assistive technology and installation acceptance remains in the existing web tickets.
