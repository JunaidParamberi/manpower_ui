import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TONES = {
  neutral: "bg-[var(--bg-subtle)] text-[var(--fg-2)] [--pill-dot:var(--fg-3)]",
  accent: "bg-[var(--accent-soft)] text-[var(--accent)] [--pill-dot:var(--accent)]",
  success: "bg-[var(--success-soft)] text-[var(--success)] [--pill-dot:var(--success)]",
  warning: "bg-[var(--warning-soft)] text-[var(--warning)] [--pill-dot:var(--warning)]",
  danger: "bg-[var(--danger-soft)] text-[var(--danger)] [--pill-dot:var(--danger)]",
} as const;

export type StatusTone = keyof typeof TONES;

export function WorkspaceHeader({
  backHref, backLabel, title, statusLabel, statusTone, save, actions, kraft, onBack,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  statusLabel: string;
  statusTone: StatusTone;
  save?: ReactNode;
  actions: ReactNode;
  kraft?: ReactNode;
  /** Runs before the back link navigates (flush saves, discard an untouched draft). */
  onBack?: (href: string) => void;
}) {
  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
      <Link
        href={backHref}
        onClick={
          onBack
            ? (e) => {
                // Let the browser handle open-in-new-tab and friends.
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                e.preventDefault();
                onBack(backHref);
              }
            : undefined
        }
        className="text-[12px] text-[var(--fg-2)] hover:text-[var(--fg)]"
      >
        {backLabel} <span className="text-[var(--fg-3)]">/</span>
      </Link>
      <h1 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h1>
      <span className={cn("inline-flex h-[22px] items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium", TONES[statusTone])}>
        <span aria-hidden className="size-1.5 rounded-full bg-[var(--pill-dot)]" />
        {statusLabel}
      </span>
      {save}
      <span className="flex-1" />
      {kraft}
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    </header>
  );
}
