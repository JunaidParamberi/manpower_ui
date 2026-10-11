"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { AUTH_TITLE_CLASS } from "@/components/shared/title-classes";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      // Update this route to redirect to an authenticated route. The user already has an active session.
      router.push("/dashboard");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-8", className)} {...props}>
      <header className="flex flex-col gap-2">
        <h1 className={AUTH_TITLE_CLASS}>
          Set a new password
        </h1>
        <p className="text-sm text-[var(--fg-2)]">
          Choose a strong password for your workspace. Already updated it?{" "}
          <Link href="/auth/login" className="auth-link">
            Sign in
          </Link>
          .
        </p>
      </header>

      <div className="relative flex items-center">
        <span className="h-px flex-1 bg-[var(--border)]" />
        <span className="px-3 text-xs uppercase tracking-[0.16em] text-[var(--fg-3)]">
          secure password
        </span>
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <form onSubmit={handleForgotPassword} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="password" className="text-xs font-medium text-[var(--fg-2)]">
            New password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              required
              autoComplete="new-password"
              className="h-11 rounded-xl bg-[var(--bg-surface)] pr-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-xl text-[var(--fg-3)] transition-colors hover:text-foreground"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <p className="text-xs leading-relaxed text-[var(--fg-3)]">
            Use at least 8 characters with a mix of words, numbers, or symbols.
          </p>
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
          {isLoading ? "Saving password…" : "Save new password"}
          {!isLoading && (
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          )}
        </Button>
      </form>
    </div>
  );
}
