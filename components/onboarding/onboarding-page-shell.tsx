"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { BrandGlow } from "@/components/shared/ambient/brand-glow";
import { GradientText } from "@/components/shared/ambient/gradient-text";
import { BrandLockupLink } from "@/components/shared/brand-lockup";
import { AuthThemeToggle } from "@/components/shared/auth-theme-toggle";
import { LegalPolicyLink } from "@/components/legal/legal-policy-link";
import { OnboardingProgressStrip } from "@/components/onboarding/onboarding-progress-strip";
import { Card, CardContent } from "@/components/ui/card";
import { ONBOARDING_TITLE_CLASS } from "@/components/shared/title-classes";

const STEP_EYEBROW: Record<1 | 2 | 3, string> = {
  1: "Step 1 of 3",
  2: "Step 2 of 3",
  3: "Step 3 of 3",
};

const STEP_HEADLINE: Record<1 | 2 | 3, { lead: string; emphasis: string }> = {
  1: { lead: "Let's ", emphasis: "set up your profile" },
  2: { lead: "Time to ", emphasis: "build your brand" },
  3: { lead: "Add ", emphasis: "your first client" },
};

/**
 * Full-page, centred, ambient onboarding shell. Replaces the split-screen
 * AuthShell + CompanionPanel for the onboarding flow only. The brand glow is
 * `fixed` so it stays put if a tall step's content causes the page to scroll.
 */
export function OnboardingPageShell({
  step,
  children,
}: {
  step: 1 | 2 | 3;
  children: ReactNode;
}) {
  const year = new Date().getFullYear();
  const headline = STEP_HEADLINE[step];

  return (
    <div className="relative flex min-h-svh w-full flex-col bg-[var(--bg-canvas)]">
      <BrandGlow />

      <header className="relative z-10 flex shrink-0 items-center justify-between gap-4 px-6 py-8 sm:px-10">
        <BrandLockupLink href="/" linkClassName="shrink-0" />
        <AuthThemeToggle />
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center gap-8 px-6 py-4 sm:px-10">
        <div className="w-full max-w-2xl">
          <OnboardingProgressStrip step={step} />
        </div>

        <div className="flex w-full max-w-2xl flex-1 flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--fg-3)]">
              {STEP_EYEBROW[step]}
            </span>
            <h1 className={ONBOARDING_TITLE_CLASS}>
              {headline.lead}
              <GradientText as="span">{headline.emphasis}</GradientText>
            </h1>
          </div>

          <Card className="w-full border-[var(--border)]/40 bg-[var(--bg-canvas)]/50 shadow-[var(--shadow-lg)] backdrop-blur-xl">
            <CardContent>{children}</CardContent>
          </Card>
        </div>
      </main>

      <footer className="relative z-10 flex shrink-0 flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-[var(--fg-3)] sm:flex-row sm:px-10">
        <span>© {year} Manpower</span>
        <nav className="flex items-center gap-6">
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
