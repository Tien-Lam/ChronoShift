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

// The static React Aria hidden selects and result shortcut use these two fixed
// attributes. Attribute hashes are scoped separately from stylesheet hashes.
// Arbitrary style attributes and inline scripts remain forbidden.
const initialStyleAttributes = [
  "border:0;clip:rect(0 0 0 0);clip-path:inset(50%);height:1px;margin:-1px;overflow:hidden;padding:0;position:fixed;width:1px;white-space:nowrap;top:0;left:0",
  "visibility:hidden",
];
const attributeHashes = initialStyleAttributes
  .map(
    (style) =>
      `'sha256-${createHash("sha256").update(style).digest("base64")}'`,
  )
  .join(" ");

// Trust only the build's fixed WebSite data, including in cached offline HTML.
const structuredDataHash = createHash("sha256")
  .update(SITE_STRUCTURED_DATA)
  .digest("base64");
export function webCsp(styles: string[] = []) {
  const appStyleHashes = styles
    .map(
      (style) =>
        `'sha256-${createHash("sha256").update(style).digest("base64")}'`,
    )
    .join(" ");
  return `default-src 'self'; script-src 'self' 'sha256-${structuredDataHash}'; style-src 'self' ${styleHashes}${appStyleHashes ? " " + appStyleHashes : ""}; style-src-attr 'unsafe-hashes' ${attributeHashes}; img-src 'self'; font-src 'self'; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'`;
}
export const WEB_CSP = webCsp();
export const PREVIEW_CSP = `${WEB_CSP}; frame-ancestors 'none'`;
