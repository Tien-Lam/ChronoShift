# Focused documentation review — proposed motion guidance

Scope: the proposed paragraph sent for review, before its later documentation-only commit. Runtime candidate remains `0f7812fc2e59d9adb1d5c7f6eac92ca23240a2f8`; this is not a review of a final documentation revision.

> For motion changes, identify anchored controls, ancestor surfaces and positioned overlays that own live geometry. Exercise immediate keyboard/pointer interaction while entry/press animations run, including close/reopen and resize during an open menu; settled captures alone do not establish interaction correctness. Keep geometry-owning anchors and outer overlays stationary, using opacity, color or child/icon motion for feedback. Retain normal-motion failing/candidate journeys instead of masking failures with sleeps, force-clicks or reduced-motion-only checks.

Implementation/documentation verdict: approved as proposed; no blocker. It records the actual missed review scope and requires the interaction conditions that distinguished the original candidate from its fix. It preserves failing-candidate evidence and does not let screenshots, reduced-motion-only passes or test accommodations establish normal-motion correctness. The named ancestor scope prevents overlooking a control moved by an animated parent.

Small optional precision improvement: say “nonanchored child/icon motion” so a child that is itself a positioning or press target is not read as automatically safe. This is a wording suggestion, not a required fix.

The test count correction is consistent with the change: the previous 238 configured / 232 runnable scenarios plus two new motion tests across five normal projects adds ten, yielding 248 configured / 242 runnable; the six Chromium-only hard-refresh skips are unchanged. The original failed CI reports 240 passed, two failed and six skipped, totaling 248.

Original report verdict: N/A for documentation. Gap: root plans to add the paragraph and count correction after publication; final saved wording/revision and formatting still require a read-only delta check then. No additional runtime suite is needed for this documentation-only change.
