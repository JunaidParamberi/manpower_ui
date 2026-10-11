import type { ReactNode } from "react";

export function RailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-0.5 border-b border-border px-3.5 pt-3.5 pb-3 last:border-b-0">
      <h3 className="mb-1.5 ml-1 text-[11px] font-semibold tracking-[0.04em] text-[var(--fg-3)] uppercase">{title}</h3>
      {children}
    </section>
  );
}
