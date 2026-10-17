"use client";

import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AccountSection } from "@/components/features/settings/account/account-section";
import { authClient } from "@/lib/auth-client";
import { changeEmailSchema } from "@/lib/validations/account";

type Props = {
  currentEmail: string;
};

export function ChangeEmailForm({ currentEmail }: Props) {
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const parsed = changeEmailSchema.safeParse({ newEmail });
    if (!parsed.success) {
      setError(parsed.error.flatten().fieldErrors.newEmail?.[0] ?? "Invalid email.");
      return;
    }

    if (parsed.data.newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      setError("That is already your current email.");
      return;
    }

    setPending(true);
    try {
      const { error: updateError } = await authClient.changeEmail({
        newEmail: parsed.data.newEmail,
        callbackURL: "/settings/account",
      });
      if (updateError) throw new Error(updateError.message);
      setSuccess(`Check ${parsed.data.newEmail} to confirm the change.`);
      setNewEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update email.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AccountSection
      title="Email address"
      description="Update the email you use to sign in. You will need to confirm the new address before it takes effect."
    >
      <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="current_email">Current email</Label>
          <Input
            id="current_email"
            value={currentEmail}
            readOnly
            disabled
            autoComplete="email"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="new_email">New email</Label>
          <Input
            id="new_email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? "Sending confirmation…" : "Change email"}
        </Button>
      </form>
    </AccountSection>
  );
}
