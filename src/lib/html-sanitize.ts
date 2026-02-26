const BLOCKED_TAGS = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "meta",
  "link",
  "base",
]);

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "div",
  "span",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "a",
]);

const GLOBAL_ALLOWED_ATTRS = new Set(["class"]);
const TAG_ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
};

function sanitizeAttrValue(name: string, rawValue: string) {
  const value = rawValue.trim();
  if (!value) return "";

  if (name === "href" || name === "src") {
    const lowered = value.replace(/\s+/g, "").toLowerCase();
    if (lowered.startsWith("javascript:")) return "";
    if (lowered.startsWith("data:text/html")) return "";
    if (lowered.startsWith("vbscript:")) return "";
  }

  if (name === "target") {
    if (value !== "_blank") return "";
  }

  return value;
}

function sanitizeTag(tagNameRaw: string, attrsRaw: string, closing: boolean) {
  const tagName = tagNameRaw.toLowerCase();
  if (BLOCKED_TAGS.has(tagName)) return "";
  if (!ALLOWED_TAGS.has(tagName)) return "";
  if (closing) return `</${tagName}>`;

  const allowed = new Set([...(TAG_ALLOWED_ATTRS[tagName] ?? []), ...GLOBAL_ALLOWED_ATTRS]);
  const attrs: string[] = [];
  const attrRegex =
    /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;

  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(attrsRaw))) {
    const attrName = match[1]?.toLowerCase();
    if (!attrName) continue;
    if (attrName.startsWith("on")) continue;
    if (attrName === "style") continue;
    if (!allowed.has(attrName)) continue;

    const rawValue = match[2] ?? match[3] ?? match[4] ?? "";
    const safeValue = sanitizeAttrValue(attrName, rawValue);
    if (!safeValue) continue;
    attrs.push(`${attrName}="${escapeHtmlAttr(safeValue)}"`);
  }

  if (tagName === "a") {
    const hasBlankTarget = attrs.some((a) => a.startsWith('target="_blank"'));
    const hasRel = attrs.some((a) => a.startsWith("rel="));
    if (hasBlankTarget && !hasRel) attrs.push('rel="noopener noreferrer nofollow"');
  }

  return `<${tagName}${attrs.length ? " " + attrs.join(" ") : ""}>`;
}

function escapeHtmlAttr(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function sanitizeRichHtml(input: string | null | undefined) {
  if (!input) return "";

  let html = String(input);
  html = html.replace(/<!--([\s\S]*?)-->/g, "");
  html = html.replace(/<\s*(script|style|iframe|object|embed|form|input|button|textarea|select|meta|link|base)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
  html = html.replace(/<\s*(script|style|iframe|object|embed|form|input|button|textarea|select|meta|link|base)\b[^>]*\/?>/gi, "");
  html = html.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  return html.replace(/<\s*(\/)?\s*([a-zA-Z0-9-]+)([^>]*)>/g, (_full, slash, tagName, attrs) =>
    sanitizeTag(tagName, attrs ?? "", Boolean(slash)),
  );
}

