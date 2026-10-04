import { createHash } from "node:crypto";

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

export const WEB_CSP = `default-src 'self'; script-src 'self'; style-src 'self' ${styleHashes}; img-src 'self'; font-src 'self'; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'`;
export const PREVIEW_CSP = `${WEB_CSP}; frame-ancestors 'none'`;
