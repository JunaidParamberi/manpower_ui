"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ExternalLink, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Right-side panel over the board or timeline showing one project's
 * workspace. Esc or the scrim closes it; focus moves to Close on open and
 * back to whatever opened it on close.
 */
export function ProjectPeek({ open, title, href, onClose, children }: { open: boolean; title: string; href: string; onClose: () => void; children: React.ReactNode }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      returnTo.current = document.activeElement as HTMLElement | null;
      closeRef.current?.focus();
    } else {
      returnTo.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "absolute inset-0 z-30 bg-foreground/[0.06] transition-opacity duration-200 motion-reduce:transition-none",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        role="dialog"
        aria-modal="false"
        aria-label={title}
        inert={!open}
        className={cn(
          "absolute inset-y-2 end-2 z-40 flex w-[min(500px,calc(100%-16px))] flex-col overflow-hidden rounded-[var(--surface-radius)] border border-border bg-[var(--panel)] shadow-[var(--shadow-pop)]",
          "transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none",
          open ? "translate-x-0" : "translate-x-[calc(100%+24px)]",
        )}
      >
        <div className="flex h-[46px] shrink-0 items-center gap-1 border-b border-border ps-4 pe-2">
          <span className="min-w-0 flex-1 truncate text-meta text-[var(--fg-3)]">Projects / {title}</span>
          <Button size="sm" variant="ghost" nativeButton={false} render={<Link href={href} />}>
            <ExternalLink data-icon="inline-start" />
            Open page
          </Button>
          <Button ref={closeRef} size="icon-sm" variant="ghost" aria-label="Close" onClick={onClose}>
            <X />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-6">{children}</div>
      </aside>
    </>
  );
}
