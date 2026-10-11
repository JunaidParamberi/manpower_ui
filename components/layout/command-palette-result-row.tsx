"use client";

import { Briefcase, FileText, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import type { GlobalSearchResult } from "@/lib/search/types";

type CommandPaletteResultRowProps = {
  result: GlobalSearchResult;
};

function ItemIcon({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid size-[26px] shrink-0 place-items-center rounded-[7px] bg-[var(--bg-subtle)] text-[var(--fg-3)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CommandPaletteResultRow({ result }: CommandPaletteResultRowProps) {
  if (result.kind === "client") {
    return (
      <>
        <ItemIcon>
          <Users size={13} strokeWidth={1.6} />
        </ItemIcon>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[length:var(--text-sm)] text-foreground">
            {result.label}
          </div>
          {result.subtitle ? (
            <div className="truncate text-[11px] text-[var(--fg-3)]">
              {result.subtitle}
            </div>
          ) : null}
        </div>
      </>
    );
  }

  if (result.kind === "project") {
    return (
      <>
        <ItemIcon>
          <Briefcase size={13} strokeWidth={1.6} />
        </ItemIcon>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[length:var(--text-sm)] text-foreground">
            {result.label}
          </div>
          <div className="truncate text-[11px] text-[var(--fg-3)]">
            {result.subtitle}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ItemIcon className="font-mono text-[10px] font-semibold tracking-tight">
        {result.typeBadge}
      </ItemIcon>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[length:var(--text-sm)] text-foreground">
          {result.label}
        </div>
        <div className="truncate text-[11px] text-[var(--fg-3)]">
          {result.subtitle}
        </div>
      </div>
      <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--bg-subtle)] px-1.5 py-px text-[10px] text-[var(--fg-3)]">
        {result.statusLabel}
      </span>
    </>
  );
}

export function CommandPaletteResultRowIcon({ kind }: { kind: GlobalSearchResult["kind"] }) {
  if (kind === "client") {
    return <Users size={13} strokeWidth={1.6} />;
  }
  if (kind === "project") {
    return <Briefcase size={13} strokeWidth={1.6} />;
  }
  return <FileText size={13} strokeWidth={1.6} />;
}
