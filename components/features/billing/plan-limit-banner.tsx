"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { shouldShowBanner, getBannerMessage } from "@/lib/plan-usage/helpers";
import { usePlanUsage } from "@/lib/plan-usage/context";

function getDismissKey(): string {
  const now = new Date();
  return `plan-banner-dismissed-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function PlanLimitBanner() {
  const usage = usePlanUsage();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const key = getDismissKey();
    setDismissed(localStorage.getItem(key) === "true");
  }, []);

  if (!shouldShowBanner(usage) || dismissed) return null;

  function dismiss() {
    localStorage.setItem(getDismissKey(), "true");
    setDismissed(true);
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-[var(--warning)]/30",
        "bg-[var(--warning-soft)]/60 px-4 py-2.5"
      )}
    >
      <Zap className="size-4 shrink-0 text-[var(--warning)]" strokeWidth={1.6} aria-hidden />
      <p className="flex-1 text-sm text-foreground">
        {getBannerMessage(usage)}
      </p>
      <Link
        href="/settings/billing"
        className="shrink-0 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground transition-colors duration-[var(--dur-base)] ease-[var(--ease-out)] hover:bg-[var(--accent-hover)]"
      >
        Upgrade
      </Link>
      <button
        onClick={dismiss}
        className="shrink-0 text-muted-foreground transition-colors duration-[var(--dur-base)] ease-[var(--ease-out)] hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
