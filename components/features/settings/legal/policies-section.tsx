"use client";

import { ExternalLink } from "lucide-react";

import { LegalPolicyLink } from "@/components/legal/legal-policy-link";
import { AccountSection } from "@/components/features/settings/account/account-section";
import { buttonVariants } from "@/components/ui/button";
import type { PrivacyProfileFields } from "@/lib/legal/consent-queries";
import { cn } from "@/lib/utils";

type Props = {
  profile: PrivacyProfileFields;
};

function formatAcceptedAt(value: string | null): string {
  if (!value) return "Not yet accepted";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PoliciesSection({ profile }: Props) {
  return (
    <AccountSection
      title="Policies"
      description="Review our Terms of Service and Privacy Policy. Acceptance dates are recorded in your consent log."
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1 rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">Terms of Service</p>
            <LegalPolicyLink
              policy="terms"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-1.5",
              )}
            >
              View terms
              <ExternalLink className="size-3.5" />
            </LegalPolicyLink>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatAcceptedAt(profile.terms_accepted_at)}
            {profile.terms_version ? ` · Version ${profile.terms_version}` : ""}
          </p>
        </div>

        <div className="flex flex-col gap-1 rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">Privacy Policy</p>
            <LegalPolicyLink
              policy="privacy"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-1.5",
              )}
            >
              View privacy policy
              <ExternalLink className="size-3.5" />
            </LegalPolicyLink>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatAcceptedAt(profile.privacy_accepted_at)}
            {profile.privacy_version ? ` · Version ${profile.privacy_version}` : ""}
          </p>
        </div>
      </div>
    </AccountSection>
  );
}
