"use client";

import { ClientTile } from "@/components/features/projects/client-tile";
import { PaceBar, PACE_TEXT } from "@/components/features/projects/pace-bar";
import { groupForList, type PacedProject } from "@/lib/projects/portfolio-filters";
import { cn } from "@/lib/utils";

/** The list block's body: projects grouped by what needs you, sticky group headings. */
export function ProjectsListPane({ projects, selectedId, onSelect, emptyMessage }: { projects: PacedProject[]; selectedId: string | null; onSelect: (id: string) => void; emptyMessage: React.ReactNode }) {
  const groups = groupForList(projects);
  return (
    <nav aria-label="Project list" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2 pb-6 sm:px-6 lg:px-7">
        {groups.length === 0 ? <div className="py-6 text-body text-[var(--fg-3)]">{emptyMessage}</div> : null}
        {groups.map((group) => (
          <section key={group.id} className="mt-1.5 first:mt-0" aria-label={group.label}>
            <h3 className="sticky top-0 z-[1] flex h-8 items-center gap-1.5 bg-[var(--panel)] text-meta font-medium text-[var(--fg-2)]">
              {group.label} <span className="font-normal text-[var(--fg-3)]">{group.projects.length}</span>
            </h3>
            <ul className="-mx-2.5 m-0 flex list-none flex-col gap-0.5 p-0">
              {group.projects.map((p) => {
                const selected = p.id === selectedId;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      aria-current={selected ? "true" : undefined}
                      onClick={() => onSelect(p.id)}
                      className={cn(
                        "flex w-full flex-col gap-2 rounded-[10px] border-0 bg-transparent px-2.5 pt-2.5 pb-3 text-start transition-colors",
                        selected ? "bg-card shadow-[var(--shadow-sm),0_0_0_1px_var(--border)]" : "hover:bg-[var(--bg-subtle)]/60",
                      )}
                    >
                      <span className="flex min-w-0 items-baseline gap-2">
                        <span className="min-w-0 flex-1 truncate text-body font-medium text-foreground">{p.title}</span>
                        <span className={cn("shrink-0 text-meta font-medium", PACE_TEXT[p.pace.kind])}>{p.pace.label}</span>
                      </span>
                      <ClientTile name={p.client?.name ?? null} />
                      <PaceBar pace={p.pace} size="sm" showBudget={false} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
    </nav>
  );
}
