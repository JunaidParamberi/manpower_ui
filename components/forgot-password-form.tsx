"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPasswordResetError } from "@/lib/auth/password-reset-error";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { AUTH_TITLE_CLASS } from "@/components/shared/title-classes";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw new Error(error.message ?? "Could not send a reset link.");
      setSuccess(true);
    } catch (error: unknown) {
      setError(formatPasswordResetError(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-8", className)} {...props}>
      {success ? (
        <div className="flex flex-col gap-6">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-[var(--shadow-xs)]">
            <CheckCircle2 className="size-5 text-foreground" />
          </div>
          <header className="flex flex-col gap-2">
            <h1 className={AUTH_TITLE_CLASS}>
              Check your email
            </h1>
            <p className="text-sm leading-6 text-[var(--fg-2)]">
              If an account exists for{" "}
              <span className="font-medium text-foreground">{email}</span>, we sent
              password reset instructions.
            </p>
          </header>
          <Link
            href="/auth/login"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] text-sm font-medium text-foreground shadow-[var(--shadow-xs)] transition-colors hover:bg-[var(--bg-subtle)]"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <header className="flex flex-col gap-2">
            <h1 className={AUTH_TITLE_CLASS}>
              Reset your password
            </h1>
            <p className="text-sm text-[var(--fg-2)]">
              Enter your email and we&apos;ll send a secure reset link. Remembered
              it?{" "}
              <Link href="/auth/login" className="auth-link">
                Sign in
              </Link>
              .
            </p>
          </header>

          <div className="relative flex items-center">
            <span className="h-px flex-1 bg-[var(--border)]" />
            <span className="px-3 text-xs uppercase tracking-[0.16em] text-[var(--fg-3)]">
              account email
            </span>
            <span className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <form onSubmit={handleForgotPassword} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-xs font-medium text-[var(--fg-2)]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@studio.com"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl bg-[var(--bg-surface)]"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="group h-11 w-full justify-center gap-1.5 rounded-xl text-sm font-medium"
              disabled={isLoading}
            >
              {isLoading ? "Sending reset link…" : "Send reset link"}
              {!isLoading && (
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              )}
            </Button>

            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 text-sm font-medium text-[var(--fg-2)] transition-colors hover:text-foreground"
            >
              <Mail className="size-4" />
              Back to sign in
            </Link>
          </form>
        </>
      )}
    </div>
  );
}
