"use client";

import Link from "next/link";
import { Lock, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/config/plans";
import type { PlanTier } from "@/config/plans";

interface AddClientButtonProps {
  atLimit: boolean;
  planTier: PlanTier;
  clientLimit: number;
  /** Icon-only "+" for pane headers. */
  compact?: boolean;
}

export function AddClientButton({ atLimit, planTier, clientLimit, compact = false }: AddClientButtonProps) {
  if (!atLimit) {
    if (compact) {
      return (
        <Button size="icon-sm" nativeButton={false} render={<Link href="/clients/new" />} aria-label="New client" title="New client">
          <Plus />
        </Button>
      );
    }
    return (
      <Button nativeButton={false} render={<Link href="/clients/new" />}>
        <Plus />
        Add client
      </Button>
    );
  }

  const planName = PLANS[planTier].name;
  const limitDisplay = clientLimit === Infinity ? "unlimited" : String(clientLimit);

  function handleClick() {
    toast.error(`Client limit reached`, {
      description: `${planName} plan allows ${limitDisplay} clients. Upgrade to add more.`,
      action: {
        label: "Upgrade plan",
        onClick: () => window.location.href = "/settings/billing",
      },
      duration: 6000,
    });
  }

  if (compact) {
    return (
      <Button variant="outline" size="icon-sm" onClick={handleClick} aria-label="New client (limit reached)" title="Client limit reached">
        <Lock className="text-muted-foreground" />
      </Button>
    );
  }

  return (
    <Button variant="outline" onClick={handleClick} className="gap-2">
      <Lock className="size-4 text-muted-foreground" />
      Add client
    </Button>
  );
}
