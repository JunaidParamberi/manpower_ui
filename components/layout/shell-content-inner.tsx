"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Page-frame wrapper inside the dashboard scroll area. Rendered by
 * `ShellInner` (dashboard-shell.tsx), never by the server layout: as RSC
 * children crossing the server→client boundary it hydrated as a streaming
 * `<Suspense>` on one side and a bare `<div>` on the other.
 */
export function ShellContentInner({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        "shell-content-inner flex min-h-full w-full flex-col gap-5",
        "mx-auto max-w-[var(--content-max-w)] px-7 pt-6 pb-20",
        "has-[[data-page-fullbleed]]:mx-0 has-[[data-page-fullbleed]]:max-w-none has-[[data-page-fullbleed]]:p-0",
      )}
    >
      {children}
    </div>
  );
}
