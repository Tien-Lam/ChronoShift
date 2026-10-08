import { createHash } from "node:crypto";
import { SITE_STRUCTURED_DATA } from "../web/src/site";

// React Aria 3.52.1 injects these fixed rules for touch presses and iOS modal
// scroll containment. Permit only their exact bytes, never arbitrary inline CSS.
// Browser regressions fail on new policy violations when the dependency changes.
const trustedInteractionStyles = [
  "@layer {\n  [data-react-aria-pressable] {\n    touch-action: pan-x pan-y pinch-zoom;\n  }\n}",
  "@layer {\n  * {\n    overscroll-behavior: contain;\n  }\n}",
];
const styleHashes = trustedInteractionStyles
  .map(
    (style) =>
      `'sha256-${createHash("sha256").update(style).digest("base64")}'`,
  )
  .join(" ");

// Trust only the build's fixed WebSite data, including in cached offline HTML.
const structuredDataHash = createHash("sha256")
  .update(SITE_STRUCTURED_DATA)
  .digest("base64");
export const WEB_CSP = `default-src 'self'; script-src 'self' 'sha256-${structuredDataHash}'; style-src 'self' ${styleHashes}; img-src 'self'; font-src 'self'; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'`;
export const PREVIEW_CSP = `${WEB_CSP}; frame-ancestors 'none'`;
