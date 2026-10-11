/**
 * Link targets from user-authored rich text (Tiptap) are rendered on public
 * client pages, so only web, mail and phone links survive — never
 * `javascript:`, `data:` or relative URLs.
 */
export function safeHref(href: string | null | undefined): string {
  if (!href) return "#";
  // Browsers ignore control characters and whitespace inside the scheme.
  const compact = href.replace(/[\u0000- ]/g, "");
  try {
    const url = new URL(compact);
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol) ? href.trim() : "#";
  } catch {
    return "#";
  }
}
