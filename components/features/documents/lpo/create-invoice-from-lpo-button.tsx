"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createInvoiceFromLpo } from "@/lib/documents/lpo-mutations";
import { FilePlus } from "lucide-react";

interface Props {
  lpoId: string;
}

export function CreateInvoiceFromLpoButton({ lpoId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [warning, setWarning] = useState<string | null>(null);

  function handleClick() {
    startTransition(async () => {
      const result = await createInvoiceFromLpo(lpoId);
      if (!result.ok) {
        alert(result.error ?? "Failed to create invoice.");
        return;
      }
      if (result.warning) {
        setWarning(result.warning);
      }
      if (result.invoiceId) {
        router.push(`/documents/${result.invoiceId}`);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {warning && (
        <p className="text-sm text-amber-700 bg-amber-50 rounded px-3 py-2">{warning}</p>
      )}
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={handleClick}
      >
        <FilePlus className="h-4 w-4" />
        {isPending ? "Creating…" : "Create invoice from LPO"}
      </Button>
    </div>
  );
}
