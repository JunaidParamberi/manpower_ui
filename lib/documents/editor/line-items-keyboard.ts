import type { LineItemRow } from "@/types";

export type EditorLine = {
  /** Stable client key; equals `id` for saved lines, a temp key for new ones. */
  key: string;
  id: string | null;
  description: string;
  notes: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  hsn_sac_code: string | null;
};

export const STEP = { quantity: 1, unit_price: 50 } as const;
/** The server rejects a quantity of zero, so stepping stops at one. */
const FLOOR = { quantity: 1, unit_price: 0 } as const;

export function newLine(key: string, init: Partial<EditorLine> = {}): EditorLine {
  return { key, id: null, description: "", notes: "", quantity: 1, unit_price: 0, tax_rate: 0, hsn_sac_code: null, ...init };
}

export function insertAfter(lines: EditorLine[], afterKey: string | null, line: EditorLine): EditorLine[] {
  const idx = afterKey === null ? -1 : lines.findIndex((l) => l.key === afterKey);
  if (idx === -1) return [...lines, line];
  return [...lines.slice(0, idx + 1), line, ...lines.slice(idx + 1)];
}

export function removeLine(lines: EditorLine[], key: string): { lines: EditorLine[]; focusKey: string | null } {
  const idx = lines.findIndex((l) => l.key === key);
  if (idx === -1) return { lines, focusKey: null };
  const next = lines.filter((l) => l.key !== key);
  const focus = next[idx - 1] ?? next[idx] ?? null;
  return { lines: next, focusKey: focus ? focus.key : null };
}

export function stepField(
  lines: EditorLine[],
  key: string,
  field: "quantity" | "unit_price",
  direction: 1 | -1,
  shift: boolean,
): EditorLine[] {
  const delta = STEP[field] * (shift ? 10 : 1) * direction;
  return lines.map((l) => (l.key === key ? { ...l, [field]: Math.max(FLOOR[field], +(l[field] + delta).toFixed(2)) } : l));
}

export function moveLine(lines: EditorLine[], fromKey: string, toKey: string): EditorLine[] {
  if (fromKey === toKey) return lines;
  const from = lines.findIndex((l) => l.key === fromKey);
  const to = lines.findIndex((l) => l.key === toKey);
  if (from === -1 || to === -1) return lines;
  const next = [...lines];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function fromRows(rows: LineItemRow[]): EditorLine[] {
  return [...rows]
    .sort((x, y) => x.sort_order - y.sort_order)
    .map((r) => ({
      key: r.id,
      id: r.id,
      description: r.description ?? "",
      notes: r.notes ?? "",
      quantity: Number(r.quantity),
      unit_price: Number(r.unit_price),
      tax_rate: Number(r.tax_rate ?? 0),
      hsn_sac_code: r.hsn_sac_code ?? null,
    }));
}

export function toUpsertPayload(line: EditorLine, index: number) {
  return {
    ...(line.id ? { id: line.id } : {}),
    description: line.description,
    notes: line.notes.trim() ? line.notes : null,
    quantity: line.quantity,
    unit_price: line.unit_price,
    tax_rate: line.tax_rate,
    sort_order: index,
    hsn_sac_code: line.hsn_sac_code,
  };
}

export function lineAmount(line: EditorLine): number {
  return +(line.quantity * line.unit_price).toFixed(2);
}
