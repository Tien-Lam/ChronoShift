# Delta scope from preserved v1

Initial root baseline sweep19/20 failed at Firefox controls428 (no owned list); candidate19/20 passed that assertion transiently then timed out at438 hovering a list whose ID had become null. Root's early message incorrectly called these the same assertion; exact differing failures remain in raw logs and corrected messages. No successful speed comparison exists.

Independent adversarial matching Firefox original/native-focus controls observed document scroll after input-driven opening on both builds and closed/no-owned afterward. Native scroll/focus preparation while closed before the first Asia/Tokyo fill passed both, retaining Osaka hover/Tab expectations. This is evidence for that tested competing owner, not every historical cause.

Independent code reviewer tall isolation controls found candidate PageUp sometimes advances one row while baseline advances about five in the320px viewport; native-height both-build ancestor-scroll dismissal is separate. Public ComboBox exposes layoutDelegate, and public Virtualizer accepts a layout instance. Proposed bounded fix: share one public ListLayout instance per ZoneChoice between the input's ComboBox layoutDelegate and its virtual viewport, preserving observed variable heights and full collection. Verify lifecycle before/after opening/filter/unmount and real PageUp/Down boundaries; public type compatibility does not prove behavior.

Root additionally prepares the existing hover test's first input-driven opening via native scrollIntoViewIfNeeded/input.click/closed assertion before fill, mirroring its already-existing later-reopen preparation. Preserve original test and all canonical typed/other-field/hover/keyboard/pointer/result assertions and273 identities. No sleeps/forceclick/reduced-motion or test relaxation.

Preserve original v1 source/patch, build and original reviewer reports. Rebuild/freeze v2 with exact source blobs, save a delta brief and repeat relevant independent review. No new Actions/full performance run until keyboard and native-layout blockers are resolved. CI goal remains unmet.
