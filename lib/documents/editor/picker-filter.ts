type Searchable = { label: string; secondary?: string; keywords?: string };

export function filterOptions<T extends Searchable>(options: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  const scored = options
    .map((o) => {
      const label = o.label.toLowerCase();
      const hay = `${label} ${o.secondary ?? ""} ${o.keywords ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return null;
      return { o, score: label.startsWith(q) ? 0 : label.includes(q) ? 1 : 2 };
    })
    .filter((x): x is { o: T; score: number } => x !== null);
  return scored.sort((a, b) => a.score - b.score).map((x) => x.o);
}

export function moveHighlight(index: number, count: number, direction: 1 | -1): number {
  if (count <= 0) return 0;
  return Math.min(count - 1, Math.max(0, index + direction));
}
