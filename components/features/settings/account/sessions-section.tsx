"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AccountSection } from "@/components/features/settings/account/account-section";
import { signOutOtherSessions } from "@/lib/account/actions";

export function SessionsSection() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSignOutOthers() {
    setError(null);
    startTransition(async () => {
      const result = await signOutOtherSessions();
      if (!result.ok) {
        setError(result.message);
        toast.error(result.message);
        return;
      }
      toast.success("Signed out of all other devices.");
    });
  }

  return (
    <AccountSection
      title="Sessions"
      description="If you signed in on another browser or device, you can sign out everywhere except this session."
    >
      <div className="flex flex-col gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onSignOutOthers}
          disabled={pending}
          className="w-fit"
        >
          {pending ? "Signing out…" : "Sign out of all other devices"}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </AccountSection>
  );
}
