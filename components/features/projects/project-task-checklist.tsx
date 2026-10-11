"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { toast } from "sonner";

import { createTask, updateTask } from "@/lib/tasks/actions";
import { formatShortDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import type { TaskRow } from "@/types";

type Props = {
  projectId: string;
  tasks: TaskRow[];
  today: string;
};

function Check({ done, label, onToggle }: { done: boolean; label: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        "grid size-4 shrink-0 cursor-pointer place-items-center rounded-full border-[1.5px] p-0 transition-colors",
        done
          ? "border-[var(--success)] bg-[var(--success)] text-white"
          : "border-[var(--border-strong)] bg-transparent hover:border-[var(--fg-3)]",
      )}
    >
      {done ? (
        <svg viewBox="0 0 12 12" aria-hidden className="size-2.5">
          <path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </button>
  );
}

/**
 * The projects page's compact task list: To do / Done, tick to complete,
 * type to add. The full board (filters, statuses, priorities) lives on the
 * project page.
 */
export function ProjectTaskChecklist({ projectId, tasks, today }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [doneOverride, setDoneOverride] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [adding, setAdding] = useState(false);

  const top = tasks.filter((t) => t.parent_task_id === null && t.status !== "cancelled");
  const isDone = (t: TaskRow) => doneOverride[t.id] ?? t.status === "done";
  const open = top
    .filter((t) => !isDone(t))
    .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999") || a.sort_order - b.sort_order);
  const done = top.filter(isDone);

  async function toggle(t: TaskRow) {
    const next = !isDone(t);
    setDoneOverride((prev) => ({ ...prev, [t.id]: next }));
    const result = await updateTask(projectId, t.id, { status: next ? "done" : "todo" });
    if (!result.ok) {
      setDoneOverride((prev) => ({ ...prev, [t.id]: !next }));
      toast.error("Couldn't update that task. Try again.");
      return;
    }
    startTransition(() => router.refresh());
  }

  async function add() {
    const title = draft.trim();
    if (!title || adding) return;
    setAdding(true);
    const result = await createTask(projectId, { title, status: "todo", priority: "medium", due_date: "" });
    setAdding(false);
    if (!result.ok) {
      toast.error(result.message ?? "Couldn't add that task.");
      return;
    }
    setDraft("");
    startTransition(() => router.refresh());
  }

  function row(t: TaskRow) {
    const late = !isDone(t) && t.due_date !== null && t.due_date < today;
    return (
      <li key={t.id} className="-mx-2 flex h-9 items-center gap-2.5 rounded-md px-2 hover:bg-[var(--bg-subtle)]/60">
        <Check done={isDone(t)} label={`Mark "${t.title}" ${isDone(t) ? "not done" : "done"}`} onToggle={() => void toggle(t)} />
        <span className={cn("min-w-0 flex-1 truncate text-body", isDone(t) && "text-[var(--fg-3)]")}>{t.title}</span>
        {t.due_date ? (
          <span className={cn("shrink-0 text-meta tabular-nums", late ? "text-[var(--danger)]" : "text-[var(--fg-3)]")}>
            {formatShortDate(t.due_date)}
          </span>
        ) : null}
      </li>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <section>
        <h3 className="flex h-7 items-center gap-1.5 text-meta font-medium text-[var(--fg-2)]">
          <ChevronDown className="size-3.5" aria-hidden />
          To do <span className="font-normal text-[var(--fg-3)]">{open.length}</span>
        </h3>
        <ul className="m-0 list-none p-0">{open.map(row)}</ul>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void add();
          }}
          className="-mx-2 flex h-9 items-center gap-2.5 rounded-md px-2 text-[var(--fg-3)] focus-within:bg-[var(--bg-subtle)]/60 hover:bg-[var(--bg-subtle)]/60"
        >
          <Plus className="size-4 shrink-0" aria-hidden />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a task"
            aria-label="Add a task"
            disabled={adding}
            className="min-w-0 flex-1 border-0 bg-transparent text-body text-foreground outline-none placeholder:text-[var(--fg-3)]"
          />
          {draft.trim() ? <kbd className="rounded border border-border px-1.5 text-label text-[var(--fg-3)]">Enter</kbd> : null}
        </form>
      </section>

      {done.length > 0 ? (
        <section>
          <button
            type="button"
            aria-expanded={showDone}
            onClick={() => setShowDone((v) => !v)}
            className="flex h-7 cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-meta font-medium text-[var(--fg-2)]"
          >
            <ChevronDown className={cn("size-3.5 transition-transform", !showDone && "-rotate-90")} aria-hidden />
            Done <span className="font-normal text-[var(--fg-3)]">{done.length}</span>
          </button>
          {showDone ? <ul className="m-0 list-none p-0">{done.map(row)}</ul> : null}
        </section>
      ) : null}

      <Link
        href={`/projects/${projectId}`}
        className="w-fit text-meta text-[var(--fg-3)] underline-offset-4 hover:text-foreground hover:underline"
      >
        Open the full task board
      </Link>
    </div>
  );
}
