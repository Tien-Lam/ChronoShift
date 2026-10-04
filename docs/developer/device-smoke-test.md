# Browser and device acceptance

Test the published app at https://tien-lam.github.io/ChronoShift/. Record the release SHA from `/ChronoShift/release.json`, device, operating system, browser/version, screen size/posture and network conditions. This checklist concerns browser behavior; no native package or SDK is needed.

## Main task

1. Paste/type a dated message, choose a target timezone, Convert and inspect the full date/offset. Copy and paste into a text editor.
2. Try ambiguous CST and a DST gap/fold using the independently specified examples in the product contract. Alternatives must be labeled; nonexistent times need correction.
3. Open More options, change source/reference date and numeric dates, then reconvert. Denied clipboard/storage permissions must leave a usable manual path.
4. Verify keyboard navigation, normal textarea Enter and automatic conversion after typing, 200% browser zoom, system theme, reduced motion and a real screen reader.
5. Resize, rotate and fold/unfold with a draft and results present. Neither should disappear. Long zones and messages must not cause horizontal page scrolling.
6. On phones and cover screens, open/close the virtual keyboard and reach Convert/Copy. On segmented displays, verify vertical-hinge separation and upper-screen tabletop scrolling.

## Offline and installation

1. Start online and allow the initial cache download to finish. If installation help asks you to keep the page online, wait until that prompt disappears. Verify offline readiness in the following step; there is no persistent header status badge.
2. Close the tab/app, disable network, reopen the cached app and enter a fresh message. Conversion must succeed.
3. Install from the browser menu where supported; repeat the offline task. Installation is optional for ordinary conversion.
4. Exercise installed POST share reception where offered. Do not include private text in reports. Shared URLs must stay inert and messages must not appear in the address bar.
5. Clear site storage, reconnect and restore the cache before sharing. Verify offline reopening again; incomplete setup must retain an actionable recovery message.

## Updates and recovery

Keep a draft while a new release is published. It must remain active until Update now is chosen, then survive the reload. Exercise partial downloads, cache eviction/repair, multiple tabs and a rollback. Record old/new release SHAs and the exact recovery behavior. The automated single-client hosted rollback is supplementary evidence.

## Performance

Record cold online/warm offline startup and conversion p95 on a representative phone for typical 2,000-character and limit 10,000-character input. Editing and Clear must remain responsive.

Supported browser targets include desktop Chrome/Edge, Firefox and Safari, Android Chrome and iPhone Safari. Keep capability-specific installation/share results separate from core conversion; paste is the universal entry point.
