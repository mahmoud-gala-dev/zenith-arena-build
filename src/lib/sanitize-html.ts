/**
 * Minimal, dependency-free HTML sanitizer for CMS-authored rich text.
 *
 * Runs identically on the server (Worker SSR) and in the browser, so it is safe
 * to call before `dangerouslySetInnerHTML`. It removes the vectors that turn a
 * compromised/over-privileged editor account into stored XSS:
 *  - <script>, <iframe>, <object>, <embed>, <style>, <link>, <meta>, <base>, <form>
 *  - all inline event handlers (onclick, onerror, ...)
 *  - javascript:/vbscript:/data: URLs in href/src/xlink:href
 *  - srcdoc / formaction / style expression() payloads
 */

const BLOCKED_TAGS = [
  "script",
  "iframe",
  "object",
  "embed",
  "style",
  "link",
  "meta",
  "base",
  "form",
  "svg",
  "math",
];

export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return "";
  let html = String(input);

  // Strip blocked elements (with or without a closing tag).
  for (const tag of BLOCKED_TAGS) {
    html = html.replace(
      new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}\\s*>`, "gi"),
      "",
    );
    html = html.replace(new RegExp(`<\\/?${tag}\\b[^>]*>`, "gi"), "");
  }

  // Remove HTML comments (can hide conditional-comment payloads).
  html = html.replace(/<!--[\s\S]*?-->/g, "");

  // Remove inline event handlers: on*="..." | on*='...' | on*=value
  html = html.replace(
    /\son[a-z-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
    "",
  );

  // Remove dangerous attributes outright.
  html = html.replace(
    /\s(?:srcdoc|formaction|xlink:href|ping)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
    "",
  );

  // Neutralise dangerous URL schemes in href/src/action/poster.
  html = html.replace(
    /\s(href|src|action|poster)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi,
    (match, attr: string, dq?: string, sq?: string, bare?: string) => {
      const value = (dq ?? sq ?? bare ?? "").trim();
      const scheme = value.replace(/[\s\u0000-\u001f]/g, "").toLowerCase();
      const unsafe =
        scheme.startsWith("javascript:") ||
        scheme.startsWith("vbscript:") ||
        (scheme.startsWith("data:") && !scheme.startsWith("data:image/"));
      return unsafe ? ` ${attr}="#"` : match;
    },
  );

  // Kill CSS expression()/url(javascript:) inside style attributes.
  html = html.replace(
    /\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi,
    (match, dq?: string, sq?: string) => {
      const value = dq ?? sq ?? "";
      return /expression\s*\(|javascript:|url\s*\(\s*['"]?\s*javascript:/i.test(value)
        ? ""
        : match;
    },
  );

  return html;
}
