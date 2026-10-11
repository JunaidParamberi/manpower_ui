"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AccountSection } from "@/components/features/settings/account/account-section";
import { createClient } from "@/lib/supabase/client";
import { changePasswordSchema } from "@/lib/validations/account";

type Props = {
  email: string;
};

export function ChangePasswordForm({ email }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const parsed = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setError(
        fieldErrors.currentPassword?.[0] ??
          fieldErrors.newPassword?.[0] ??
          fieldErrors.confirmPassword?.[0] ??
          "Invalid password.",
      );
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: parsed.data.currentPassword,
      });
      if (verifyError) {
        throw new Error("Current password is incorrect.");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: parsed.data.newPassword,
      });
      if (updateError) throw updateError;

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AccountSection
      title="Password"
      description="Choose a strong password. You will stay signed in on this device after updating."
    >
      <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="current_password">Current password</Label>
          <div className="relative">
            <Input
              id="current_password"
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="pr-10"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground"
              onClick={() => setShowCurrent((prev) => !prev)}
              aria-label={showCurrent ? "Hide password" : "Show password"}
            >
              {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="new_password">New password</Label>
          <div className="relative">
            <Input
              id="new_password"
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              required
              className="pr-10"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground"
              onClick={() => setShowNew((prev) => !prev)}
              aria-label={showNew ? "Hide password" : "Show password"}
            >
              {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Use at least 8 characters with a mix of words, numbers, or symbols.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="confirm_password">Confirm new password</Label>
          <Input
            id="confirm_password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
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
            <AlertDescription>Password updated successfully.</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? "Updating…" : "Update password"}
        </Button>
      </form>
    </AccountSection>
  );
}
