# ChronoShift

[Open ChronoShift](https://tien-lam.github.io/ChronoShift/) — a private timezone converter that works offline after its first complete online load.

Paste or type a message, choose your timezone, press **Convert**, then copy the result with its date and zone. ChronoShift handles natural-language dates/times, cities, explicit offsets and IANA zones, ranges, Unix seconds and labeled ambiguity. Corrections and display preferences are under **More options**.

The layout adapts to phones, tablets, desktop windows and foldable displays. Supported browsers place input and results clear of a hinge. Conversion runs entirely on your device with no account, conversion server or mandatory model download.

Use **Appearance** in the header to choose **Dark**, **Light** or **System**. The single Glass Command layout uses local typography, clear controls and adaptive input/results. Theme changes keep your current message and results; preferences are saved locally. See [appearance behavior](docs/developer/appearance.md).

## Use offline

Open the app online once and wait for **Offline ready** before disconnecting. Install it from your browser's menu if offered, or bookmark it. Clearing browser storage requires another complete online visit. Updates wait for **Update now** and preserve your current message when accepted.

Only preferences persist by default. Conversion text stays in memory; explicit updates and supported installed-app shares use a short-lived, single-use local handoff. Ordinary paste works across supported browsers.

## Develop

Use the project-pinned runtimes managed by mise:

```bash
mise install
bun install --frozen-lockfile
bun run dev
```

Build and run the real offline app:

```bash
bun run check
bun run format:check
bun run preview
```

Open http://127.0.0.1:4173 and wait for **Offline ready**. Offline caching is enabled in production builds. The development server provides live reload.

## Verify and publish

```bash
bunx --bun playwright install chromium firefox webkit
bun run test:browser
bun run corpus:audit
bun run test:hosted
```

GitHub Pages publishes verified builds at `/ChronoShift/`. The publishing workflow checks the web app before uploading and deploying static assets. No application server runs in production. The migration branch publishes the current preview; main is the continuing source after merge.

See [build setup](docs/developer/building.md), [tests](docs/developer/testing.md), [publishing and rollback](docs/developer/web.md), [browser acceptance](docs/developer/device-smoke-test.md) and [the conversion pipeline](docs/architecture/nlp-pipeline.md). Physical-device, accessibility and phone-performance acceptance is tracked in the [Linear initiative](https://linear.app/tienlam/initiative/chronoshift-simple-offline-web-app-d90101850ba1).

ChronoShift is maintained as a web app. The native application and its maintenance tooling have been removed; previous versions remain in Git history.

## License

MIT. Production dependency notices are bundled with every build.
