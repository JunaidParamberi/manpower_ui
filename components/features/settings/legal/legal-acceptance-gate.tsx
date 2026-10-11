"use client";

import { useEffect, useState } from "react";

import { LegalAcceptanceModal } from "@/components/features/settings/legal/legal-acceptance-modal";
import { PENDING_LEGAL_ACCEPTANCE_KEY } from "@/config/legal";

type Props = {
  needsAcceptance: boolean;
};

export function LegalAcceptanceGate({ needsAcceptance }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!needsAcceptance) return;

    const pending =
      typeof window !== "undefined" &&
      sessionStorage.getItem(PENDING_LEGAL_ACCEPTANCE_KEY) === "1";

    if (pending || needsAcceptance) {
      setOpen(true);
    }
  }, [needsAcceptance]);

  if (!open) return null;

  return (
    <LegalAcceptanceModal
      open={open}
      onAccepted={() => {
        sessionStorage.removeItem(PENDING_LEGAL_ACCEPTANCE_KEY);
        setOpen(false);
      }}
    />
  );
}
