import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpgradeGhostRowProps {
  title: string;
  description: string;
  className?: string;
}

export function UpgradeGhostRow({ title, description, className }: UpgradeGhostRowProps) {
  return (
    <Link
      href="/settings/billing"
      className={cn(
        // Accent, not success green: this is an offer, not something that went
        // well. Green is reserved for money arriving.
        "group flex items-center gap-3 rounded-lg border border-dashed border-primary/30",
        "bg-[var(--accent-soft)]/50 px-4 py-3",
        "transition-colors duration-[var(--dur-base)] ease-[var(--ease-out)] hover:bg-[var(--accent-soft)]",
        className
      )}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-dashed border-primary/40 bg-[var(--bg-surface)]">
        <Plus className="size-3.5 text-primary" strokeWidth={1.6} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      <span className="shrink-0 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
        Upgrade
      </span>
    </Link>
  );
}
