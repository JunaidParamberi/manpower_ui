import Link from "next/link";

import { BrandLockupLink } from "@/components/shared/brand-lockup";
import { legalConfig } from "@/config/legal";
import type { LegalDocumentSection } from "@/content/legal/types";

type Props = {
  title: string;
  effectiveDate: string;
  sections: LegalDocumentSection[];
  sibling?: { href: string; label: string };
};

export function LegalDocumentPage({
  title,
  effectiveDate,
  sections,
  sibling,
}: Props) {
  return (
    <div className="min-h-dvh bg-[var(--bg-canvas)]">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-5 sm:px-6">
          <BrandLockupLink href="/auth/login" linkClassName="shrink-0" />
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            {sibling ? (
              <Link href={sibling.href} className="hover:text-foreground">
                {sibling.label}
              </Link>
            ) : null}
            <Link href="/auth/login" className="hover:text-foreground">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Version {legalConfig.policyVersion}
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Effective {effectiveDate}. Draft placeholder — replace with final legal copy
            before public launch.
          </p>
        </div>

        <div className="flex flex-col gap-8">
          {sections.map((section) => (
            <section key={section.title} className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 48)}
                  className="text-sm leading-relaxed text-muted-foreground"
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Manpower
      </footer>
    </div>
  );
}
