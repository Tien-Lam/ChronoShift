# Glass Command redesign evidence — 4 October 2026

TIE-323: one Glass Command layout, with Dark/Light/System themes. This report records actual browser side-panel interactions against the local production build, not a mockup. Source revision: `944001ddb2515d13406a38027bb43872549fface`. The observed script `/assets/index-N51Wp9CL.js` and stylesheet `/assets/index-1RMADgKl.css` match that build. [Observed state](mobile-state.json).

- [Desktop Dark](desktop-dark.jpg) and [desktop Light](desktop-light.jpg): verified 1280×900 CSS viewport, with input/result at the same y-coordinate (89px) in separate columns (x=105/640px). Neutral surfaces, locally served Geist and compact controls. `June 18, 2026 at 5:20pm in Tokyo` converted to 01:20 Thursday 18 June in Los Angeles (UTC−07:00).
- [Mobile Dark](mobile-dark.jpg) and [mobile Light](mobile-light.jpg): actual CSS viewport 320×740. Measured document scrollWidth = innerWidth = 320, with retained draft/result and reachable controls. These are responsive desktop-browser observations, not physical-phone evidence.
- [Maximum input](mobile-max-input.jpg), [snapshot](mobile-max-input.txt): 10,000 characters, with the event at the end. Keyboard conversion produced 02:45 Thursday 18 June Los Angeles for 09:45 UTC. The message was retained without truncating the event.
- [Keyboard Copy](keyboard-copy.txt): Cmd+Enter converted, six Tab presses reached Copy, and Return produced the visible success confirmation. This snapshot records the pre-border-refinement revision; the refinement changes only control colors. It does not assert an independently read system clipboard payload.
- [System theme](system-theme.txt): selected via the actual theme control and retained input/results. Automated checks cover live OS-color-scheme changes. The design selector is absent.
- Explicit **Update now** activated the final local build, preserved the draft and left conversion usable. Asset URLs and the final dark field border `rgb(115, 115, 125)` were read from the visible document after activation.

Control boundaries were strengthened after the independent adversarial review flagged their subtle contrast. Dark borders exceed 3.77:1 against both adjacent well/surface backgrounds; Light borders exceed 3.50:1. Focus remains explicit. These measured boundary/text checks do not claim complete assistive-technology conformance.

Verification: 108 unit tests; strict typecheck/build/format; 118 browser scenarios across five core profiles and foldable coverage; repository-path scenario; five focused theme/accessibility scenarios after the color refinement. Independent clean-context adversarial and code reviewers approved source `944001d` after the refinement. The first parallel local/hosted attempt conflicted on their shared test-report directory, and the interrupted turn stopped a later run; neither was counted as a completed pass. The successful final gate ran separately.

[Next.js](https://nextjs.org), [Linear](https://linear.app) and [Cloudflare Docs](https://developers.cloudflare.com) were visually inspected for typography, neutral surfaces, spacing and controls. Font license/provenance are bundled locally; no font CDN is used.

Physical-device performance, installed launch/preferences/share, actual screen-reader output and real 200% browser zoom remain unverified and open in their nine existing tickets. Screen recording permission allows screenshots; the currently exposed surface still has no native-app, installation, screen-reader or phone control. See [the per-ticket acceptance record](../../planning/web-acceptance.md).
