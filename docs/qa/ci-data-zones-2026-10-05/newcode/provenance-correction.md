# Additive timing correction

The original runtime report is retained unchanged. Its paragraph for `harness-placeholder-failure/` transcribed the observation window incorrectly. The raw runner JSON records actual top-level start `2026-10-05T12:22:16.944Z` and end `2026-10-05T12:22:27.971Z`, not 12:22:17.084–12:22:27.980 UTC. Use the raw runner values. This changes no tested conditions, failure classification or verdict.

After the final report, exact candidate blobs were rechecked unchanged: Choices `3047272ecae9a0c681ff7b09ed0592b00ad40cef`, ZoneCollection `cc0356e8ae31c2716ffb70b8a8d78a147dc6a5ff`. `lsof -n -iTCP:4327 -iTCP:4328 -sTCP:LISTEN` returned no listener (exit 1), independently confirming both owned origins were released.
