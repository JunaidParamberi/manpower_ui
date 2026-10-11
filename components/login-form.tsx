"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { AUTH_TITLE_CLASS } from "@/components/shared/title-classes";

export function LoginForm({
  className,
  next = "/dashboard",
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { next?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [mode, setMode] = useState<"password" | "magic">("password");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push(next);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError("Enter your email above, then request a magic link.");
      return;
    }

    const supabase = createClient();
    setIsMagicLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Existing-user sign-in only; reuse the standard destination path so
          // the send-auth-email edge function builds the confirm link itself.
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}${next}`,
        },
      });
      if (error) throw error;
      setMagicLinkSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsMagicLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    setIsGoogleLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsGoogleLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <div className="flex size-12 items-center justify-center rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-[var(--shadow-xs)]">
          <CheckCircle2 className="size-5 text-foreground" />
        </div>
        <header className="flex flex-col gap-2">
          <h1 className={AUTH_TITLE_CLASS}>
            Check your email
          </h1>
          <p className="text-sm leading-6 text-[var(--fg-2)]">
            If an account exists for{" "}
            <span className="font-medium text-foreground">{email}</span>, we sent a
            magic link. Tap it on this device to sign in — no password needed.
          </p>
        </header>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full justify-center rounded-xl border-[var(--border-strong)] bg-[var(--bg-surface)] text-sm font-medium shadow-[var(--shadow-xs)] hover:bg-[var(--bg-subtle)]"
          onClick={() => {
            setMagicLinkSent(false);
            setMode("password");
          }}
        >
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-8", className)} {...props}>
      <header className="flex flex-col gap-2">
        <h1 className={AUTH_TITLE_CLASS}>
          Welcome back
        </h1>
        <p className="text-sm text-[var(--fg-2)]">Sign in to continue.</p>
      </header>

      <Button
        type="button"
        variant="outline"
        className="h-11 w-full justify-center gap-2 rounded-xl border-[var(--border-strong)] bg-[var(--bg-surface)] text-sm font-medium shadow-[var(--shadow-xs)] hover:bg-[var(--bg-subtle)]"
        disabled={isGoogleLoading}
        onClick={handleGoogleLogin}
      >
        <FcGoogle className="size-[18px]" />
        {isGoogleLoading ? "Redirecting…" : "Continue with Google"}
      </Button>

      <div className="relative flex items-center">
        <span className="h-px flex-1 bg-[var(--border)]" />
        <span className="px-3 text-xs uppercase tracking-[0.16em] text-[var(--fg-3)]">
          or with email
        </span>
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <div
        role="tablist"
        aria-label="Sign-in method"
        className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--bg-subtle)] p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "password"}
          onClick={() => {
            setError(null);
            setMode("password");
          }}
          className={cn(
            "h-9 rounded-lg text-sm font-medium transition-colors",
            mode === "password"
              ? "bg-[var(--bg-surface)] text-foreground shadow-[var(--shadow-xs)]"
              : "text-[var(--fg-3)] hover:text-[var(--fg-2)]",
          )}
        >
          Password
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "magic"}
          onClick={() => {
            setError(null);
            setMode("magic");
          }}
          className={cn(
            "h-9 rounded-lg text-sm font-medium transition-colors",
            mode === "magic"
              ? "bg-[var(--bg-surface)] text-foreground shadow-[var(--shadow-xs)]"
              : "text-[var(--fg-3)] hover:text-[var(--fg-2)]",
          )}
        >
          Magic link
        </button>
      </div>

      <form
        onSubmit={(e) => {
          if (mode === "magic") {
            e.preventDefault();
            void handleMagicLink();
          } else {
            void handleLogin(e);
          }
        }}
        className="flex flex-col gap-5"
      >
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

        {mode === "password" && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-medium text-[var(--fg-2)]">
                Password
              </Label>
              <Link href="/auth/forgot-password" className="text-xs auth-link">
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
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
          </div>
        )}

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
          disabled={mode === "password" ? isLoading : isMagicLoading}
        >
          {mode === "password"
            ? isLoading
              ? "Signing in…"
              : "Sign in"
            : isMagicLoading
              ? "Sending magic link…"
              : "Send magic link"}
          {!(mode === "password" ? isLoading : isMagicLoading) && (
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--fg-2)]">
        New here?{" "}
        <Link href="/auth/sign-up" className="auth-link">
          Create a free account
        </Link>
      </p>
    </div>
  );
}
