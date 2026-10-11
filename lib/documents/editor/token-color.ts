/** Chart tokens from styles/tokens.css: theme-aware, no literal colours. */
export const TOKEN_COLORS = [
  "var(--chart-1)", "var(--chart-2)", "var(--chart-4)", "var(--chart-5)", "var(--info)", "var(--warning)",
] as const;

export function tokenColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return TOKEN_COLORS[h % TOKEN_COLORS.length];
}
