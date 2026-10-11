/**
 * Collapsed / expanded state of the documents list pane. Stored in a cookie
 * (like the app sidebar) so the server renders the right layout on first
 * paint.
 */

export const DOCUMENTS_LIST_COOKIE = "documents_list_state";
const ONE_YEAR = 60 * 60 * 24 * 365;

export function parseListCollapsedCookie(value: string | undefined): boolean {
  return value === "collapsed";
}

export function serializeListCollapsedCookie(collapsed: boolean): string {
  return `${DOCUMENTS_LIST_COOKIE}=${collapsed ? "collapsed" : "expanded"}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}

/** Shortcut key shown in tooltips. */
export const LIST_TOGGLE_KEY = "[";

type KeyLike = { key: string; metaKey: boolean; ctrlKey: boolean; altKey: boolean };
type TargetLike = { tagName: string; isContentEditable: boolean } | null;

/**
 * A bare `[` toggles the list — never with a modifier (⌘[ is browser Back)
 * and never while the user is typing in a field or rich-text editor.
 */
export function isListToggleShortcut(event: KeyLike, target: TargetLike): boolean {
  if (event.key !== LIST_TOGGLE_KEY) return false;
  if (event.metaKey || event.ctrlKey || event.altKey) return false;
  if (!target) return true;
  if (target.isContentEditable) return false;
  return !["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}
