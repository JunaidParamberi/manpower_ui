import type { ReactNode } from "react";

import {
  LEGAL_LINK_REL,
  LEGAL_LINK_TARGET,
  privacyPolicyUrl,
  termsPolicyUrl,
} from "@/lib/legal/policy-links";
import { cn } from "@/lib/utils";

type Policy = "terms" | "privacy";

type Props = {
  policy: Policy;
  children: ReactNode;
  className?: string;
};

export function LegalPolicyLink({ policy, children, className }: Props) {
  const href = policy === "terms" ? termsPolicyUrl() : privacyPolicyUrl();

  return (
    <a
      href={href}
      target={LEGAL_LINK_TARGET}
      rel={LEGAL_LINK_REL}
      className={cn(className)}
    >
      {children}
    </a>
  );
}
