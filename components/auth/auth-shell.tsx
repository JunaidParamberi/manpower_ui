"use client";

import Link from "next/link";

import { BrandGlow } from "@/components/shared/ambient/brand-glow";
import { BrandLockupLink } from "@/components/shared/brand-lockup";
import { AuthThemeToggle } from "@/components/shared/auth-theme-toggle";
import { LegalPolicyLink } from "@/components/legal/legal-policy-link";

export function AuthShell({
  children,
  topSlot,
}: {
  children: React.ReactNode;
  topSlot?: React.ReactNode;
}) {
  const year = new Date().getFullYear();
  return (
    <div className="relative grid min-h-dvh w-full grid-rows-[auto_1fr_auto] bg-[var(--bg-canvas)] px-5 sm:px-6">
      <BrandGlow />
      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <header className="flex items-center justify-between gap-4 py-5 sm:py-8">
          <BrandLockupLink href="/" linkClassName="shrink-0" />
          <AuthThemeToggle />
        </header>
        {topSlot ? <div className="pb-6">{topSlot}</div> : null}
      </div>
      <main className="auth-scroll relative z-10 flex min-h-0 w-full items-center justify-center overflow-y-auto py-6 sm:py-4">
        <div className="mx-auto flex w-full max-w-[400px] flex-col items-center gap-6 sm:gap-8">
          <span
            aria-hidden
            className="h-[3px] w-12 rounded-full bg-[length:300%_100%]"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #3550E0, #7C5CFF, #12B5A6, #F2557A)",
            }}
          />
          <div className="w-full rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)]/80 p-6 shadow-[var(--shadow-lg)] backdrop-blur-xl sm:p-10">
            {children}
          </div>
        </div>
      </main>
      <footer className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-2 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-xs text-[var(--fg-3)] sm:flex-row sm:gap-3 sm:py-6">
        <span>© {year} Manpower</span>
        <nav className="flex items-center gap-4 sm:gap-6">
          <LegalPolicyLink
            policy="privacy"
            className="transition-colors hover:text-foreground"
          >
            Privacy
          </LegalPolicyLink>
          <LegalPolicyLink
            policy="terms"
            className="transition-colors hover:text-foreground"
          >
            Terms
          </LegalPolicyLink>
          <Link href="/support" className="transition-colors hover:text-foreground">Help</Link>
        </nav>
      </footer>
    </div>
  );
}
