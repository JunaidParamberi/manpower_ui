"use client";

import { useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, X } from "lucide-react";
import type { ServiceRow } from "@/types";
import { cn } from "@/lib/utils";
import { filterOptions, moveHighlight } from "@/lib/documents/editor/picker-filter";
import {
  insertAfter, lineAmount, moveLine, newLine, removeLine, stepField, type EditorLine,
} from "@/lib/documents/editor/line-items-keyboard";
import { parseNumberInput } from "@/lib/documents/editor/scrub";
import { EditableText } from "./editable-text";

export type LineChange =
  | { key: string }
  | { removedKey: string; removedId: string | null }
  | { reordered: true };

const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cellInput =
  "w-full rounded-[5px] border-0 bg-transparent px-1 py-[5px] text-right tabular-nums outline-1 outline-offset-2 outline-dashed outline-transparent hover:outline-[var(--sheet-line-strong)] focus:outline-2 focus:outline-solid focus:outline-[var(--sheet-accent)] read-only:pointer-events-none";

/** Editable line items on the paper. Enter adds a line, Backspace on an empty line removes it, ↑↓ step numbers. */
export function LineItemsGrid({
  lines, currency, services, readOnly, onChange, newKey, showHsn, trailingMenu,
}: {
  lines: EditorLine[];
  currency: string;
  services: ServiceRow[];
  readOnly: boolean;
  onChange: (next: EditorLine[], change: LineChange) => void;
  newKey: () => string;
  showHsn: boolean;
  trailingMenu?: ReactNode;
}) {
  const descRefs = useRef(new Map<string, HTMLDivElement>());
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const focusDesc = (key: string) =>
    requestAnimationFrame(() => {
      const el = descRefs.current.get(key);
      if (!el) return;
      el.focus();
      const r = document.createRange();
      r.selectNodeContents(el);
      r.collapse(false);
      const s = getSelection();
      s?.removeAllRanges();
      s?.addRange(r);
    });

  const update = (key: string, patch: Partial<EditorLine>) =>
    onChange(lines.map((l) => (l.key === key ? { ...l, ...patch } : l)), { key });
  const addBelow = (afterKey: string | null, init?: Partial<EditorLine>) => {
    const line = newLine(newKey(), init);
    onChange(insertAfter(lines, afterKey, line), { key: line.key });
    return line;
  };
  const remove = (key: string) => {
    const target = lines.find((l) => l.key === key);
    const { lines: next, focusKey } = removeLine(lines, key);
    onChange(next, { removedKey: key, removedId: target?.id ?? null });
    if (focusKey) focusDesc(focusKey);
  };
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    onChange(moveLine(lines, String(e.active.id), String(e.over.id)), { reordered: true });
  };

  return (
    <div>
      <table className="items">
        <thead>
          <tr>
            {!readOnly ? <th className="w-[22px]" aria-hidden /> : null}
            <th>Description</th>
            {showHsn ? <th className="r">HSN/SAC</th> : null}
            <th className="r w-[72px]">Qty</th>
            <th className="r w-[110px]">Rate</th>
            <th className="r w-[110px]">Amount</th>
            {!readOnly ? <th className="w-[22px]" aria-hidden /> : null}
          </tr>
        </thead>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={lines.map((l) => l.key)} strategy={verticalListSortingStrategy}>
            <tbody>
              {lines.map((line) => (
                <Row
                  key={line.key}
                  line={line}
                  readOnly={readOnly}
                  showHsn={showHsn}
                  descRef={(el) => {
                    if (el) descRefs.current.set(line.key, el);
                    else descRefs.current.delete(line.key);
                  }}
                  onPatch={(p) => update(line.key, p)}
                  onEnter={() => focusDesc(addBelow(line.key).key)}
                  onBackspaceEmpty={() => {
                    if (lines.length > 1) remove(line.key);
                  }}
                  onRemove={() => remove(line.key)}
                  onStep={(field, dir, shift) => onChange(stepField(lines, line.key, field, dir, shift), { key: line.key })}
                />
              ))}
            </tbody>
          </SortableContext>
        </DndContext>
      </table>
      {!readOnly ? (
        <AddRow
          currency={currency}
          services={services}
          trailingMenu={trailingMenu}
          onAdd={(desc, rate, qty, extra) => {
            const line = addBelow(lines.at(-1)?.key ?? null, { description: desc, unit_price: rate, quantity: qty, ...extra });
            requestAnimationFrame(() =>
              document.querySelector<HTMLInputElement>(`[data-line="${line.key}"][data-field="${rate ? "quantity" : "unit_price"}"]`)?.select(),
            );
          }}
        />
      ) : null}
    </div>
  );
}

function Row({
  line, readOnly, showHsn, descRef, onPatch, onEnter, onBackspaceEmpty, onRemove, onStep,
}: {
  line: EditorLine;
  readOnly: boolean;
  showHsn: boolean;
  descRef: (el: HTMLDivElement | null) => void;
  onPatch: (p: Partial<EditorLine>) => void;
  onEnter: () => void;
  onBackspaceEmpty: () => void;
  onRemove: () => void;
  onStep: (field: "quantity" | "unit_price", dir: 1 | -1, shift: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: line.key, disabled: readOnly });
  const dragStyle = { transform: CSS.Transform.toString(transform), transition } as CSSProperties;
  return (
    <tr ref={setNodeRef} style={dragStyle} className={cn("group", isDragging && "opacity-40")}>
      {!readOnly ? (
        <td className="w-[22px] !px-0 !py-1.5">
          <button
            type="button"
            aria-label="Drag to reorder"
            {...attributes}
            {...listeners}
            className="grid cursor-grab place-items-center px-0.5 py-1.5 text-[var(--sheet-faint)] opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          >
            <GripVertical className="size-3.5" />
          </button>
        </td>
      ) : null}
      <td className="!py-1.5">
        <EditableText
          value={line.description}
          onChange={(v) => onPatch({ description: v })}
          placeholder="Describe the work"
          aria-label="Description"
          readOnly={readOnly}
          inputRef={descRef}
          onEnter={onEnter}
          onBackspaceEmpty={onBackspaceEmpty}
          className="desc-title -mx-1 min-h-7 px-1 py-[5px]"
        />
        {readOnly && !line.notes ? null : (
          <EditableText
            value={line.notes}
            onChange={(v) => onPatch({ notes: v })}
            placeholder="Add detail (optional)"
            aria-label="Detail"
            readOnly={readOnly}
            onEnter={onEnter}
            className="desc-sub -mx-1 px-1 py-px"
          />
        )}
      </td>
      {showHsn ? (
        <td className="r !py-1.5">
          <input
            aria-label="HSN/SAC"
            readOnly={readOnly}
            value={line.hsn_sac_code ?? ""}
            onChange={(e) => onPatch({ hsn_sac_code: e.target.value || null })}
            className={cn(cellInput, "font-mono text-[12px]")}
          />
        </td>
      ) : null}
      <NumCell line={line} field="quantity" readOnly={readOnly} onPatch={onPatch} onStep={onStep} onEnter={onEnter} />
      <NumCell line={line} field="unit_price" readOnly={readOnly} onPatch={onPatch} onStep={onStep} onEnter={onEnter} />
      <td className="total !pt-[11px] !pb-1.5">{money(lineAmount(line))}</td>
      {!readOnly ? (
        <td className="w-[22px] !px-0 !py-1.5">
          <button
            type="button"
            aria-label="Remove line"
            onClick={onRemove}
            className="grid place-items-center px-0.5 py-1.5 text-[var(--sheet-faint)] opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 hover:text-[var(--danger)]"
          >
            <X className="size-3.5" />
          </button>
        </td>
      ) : null}
    </tr>
  );
}

function NumCell({
  line, field, readOnly, onPatch, onStep, onEnter,
}: {
  line: EditorLine;
  field: "quantity" | "unit_price";
  readOnly: boolean;
  onPatch: (p: Partial<EditorLine>) => void;
  onStep: (field: "quantity" | "unit_price", dir: 1 | -1, shift: boolean) => void;
  onEnter: () => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (field === "unit_price" ? line.unit_price.toFixed(2) : String(line.quantity));
  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      setDraft(null);
      onStep(field, e.key === "ArrowUp" ? 1 : -1, e.shiftKey);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      onEnter();
    }
  }
  return (
    <td className="r !py-1.5">
      <input
        data-line={line.key}
        data-field={field}
        aria-label={field === "quantity" ? "Quantity" : "Rate"}
        inputMode="decimal"
        readOnly={readOnly}
        value={shown}
        onFocus={(e) => {
          setDraft(shown);
          e.currentTarget.select();
        }}
        onBlur={() => setDraft(null)}
        onChange={(e) => {
          setDraft(e.target.value);
          const n = parseNumberInput(e.target.value);
          if (n !== null && n >= 0) onPatch({ [field]: n });
        }}
        onKeyDown={onKeyDown}
        className={cellInput}
      />
    </td>
  );
}

function AddRow({
  currency, services, onAdd, trailingMenu,
}: {
  currency: string;
  services: ServiceRow[];
  onAdd: (description: string, rate: number, qty: number, extra?: Partial<EditorLine>) => void;
  trailingMenu?: ReactNode;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const matches = filterOptions(
    services.filter((s) => !s.archived).map((s) => ({ label: s.name, secondary: `per ${s.unit}`, s })),
    q,
  ).slice(0, 8);
  const count = matches.length + (q.trim() ? 1 : 0);
  const choose = (i: number) => {
    if (i < matches.length) {
      const svc = matches[i].s;
      onAdd(svc.name, Number(svc.default_rate), Number(svc.default_qty || 1), {
        tax_rate: Number(svc.default_tax_rate ?? 0),
        hsn_sac_code: svc.hsn_sac_code ?? null,
      });
    }
    else if (q.trim()) onAdd(q.trim(), 0, 1);
    setQ("");
    setHi(0);
    setOpen(false);
  };
  return (
    <div className="relative -mt-3 mb-6 flex items-center gap-2 text-[var(--sheet-faint)] focus-within:text-[var(--sheet-accent)]">
      <Plus aria-hidden className="size-3.5 shrink-0" />
      <input
        value={q}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onChange={(e) => {
          setQ(e.target.value);
          setHi(0);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHi((i) => moveHighlight(i, count, 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHi((i) => moveHighlight(i, count, -1));
          } else if (e.key === "Enter") {
            e.preventDefault();
            choose(hi);
          } else if (e.key === "Escape") {
            setOpen(false);
            e.currentTarget.blur();
          }
        }}
        placeholder="Add an item. Type to search your services, or just describe it"
        aria-label="Add line item"
        role="combobox"
        aria-expanded={open}
        aria-controls="add-line-listbox"
        className="flex-1 border-0 bg-transparent px-1 py-[7px] text-[var(--sheet-ink)] outline-none placeholder:text-[var(--sheet-faint)]"
      />
      {trailingMenu}
      {open && count > 0 ? (
        <div
          id="add-line-listbox"
          role="listbox"
          className="absolute top-full left-0 z-20 mt-1 w-full max-w-[440px] overflow-hidden rounded-[var(--surface-radius)] border border-border bg-[var(--bg-surface)] text-[var(--fg)] shadow-[var(--shadow-pop)]"
        >
          <div className="p-1.5">
            <p className="px-2.5 pt-1.5 pb-1 text-[11px] font-medium text-[var(--fg-3)]">{q ? "Matching services" : "Your services"}</p>
            {matches.map((m, i) => (
              <div
                key={m.s.id}
                role="option"
                aria-selected={i === hi}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(i);
                }}
                onMouseMove={() => setHi(i)}
                className={cn("flex cursor-pointer items-center gap-2.5 rounded-[var(--item-radius)] px-2 py-1.5 text-[13px]", i === hi && "bg-[var(--bg-subtle)]")}
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate">{m.s.name}</span>
                  <span className="text-[11px] text-[var(--fg-3)]">per {m.s.unit}</span>
                </span>
                <span className="text-[12px] text-[var(--fg-3)] tabular-nums">{currency} {Number(m.s.default_rate).toLocaleString()}</span>
              </div>
            ))}
            {q.trim() ? (
              <div
                role="option"
                aria-selected={hi === matches.length}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(matches.length);
                }}
                onMouseMove={() => setHi(matches.length)}
                className={cn("flex cursor-pointer items-center gap-2.5 rounded-[var(--item-radius)] px-2 py-1.5 text-[13px] font-medium text-[var(--accent)]", hi === matches.length && "bg-[var(--bg-subtle)]")}
              >
                <span className="grid size-5 place-items-center rounded-md border border-dashed border-current"><Plus className="size-3" /></span>
                Add &ldquo;{q.trim()}&rdquo; as a one-off line
              </div>
            ) : null}
          </div>
          <div className="flex gap-3 border-t border-border bg-[var(--panel)] px-3 py-2 text-[11px] text-[var(--fg-3)]">
            <span>↑ ↓ move</span>
            <span>Enter add</span>
            <span>Esc close</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
