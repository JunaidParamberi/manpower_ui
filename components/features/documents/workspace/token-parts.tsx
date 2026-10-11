import type { CSSProperties } from "react";
import { tokenColor } from "@/lib/documents/editor/token-color";

const initials = (n: string) => n.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

/** Square monogram for a client, coloured from its id. */
export function Tile({ id, label }: { id: string; label: string }) {
  return (
    <span
      className="grid size-5 shrink-0 place-items-center rounded-md bg-[var(--dot)] text-[9.5px] font-bold text-white"
      style={{ "--dot": tokenColor(id) } as CSSProperties}
    >
      {initials(label)}
    </span>
  );
}

/** Small colour square for a project, coloured from its id. */
export function Dot({ id }: { id: string }) {
  return <span className="size-2 shrink-0 rounded-[3px] bg-[var(--dot)]" style={{ "--dot": tokenColor(id) } as CSSProperties} />;
}

/** Mono code badge, e.g. a currency. */
export function Code({ children }: { children: string }) {
  return <code className="rounded-[5px] border border-border bg-[var(--bg-subtle)] px-1.5 font-mono text-[11px]">{children}</code>;
}
