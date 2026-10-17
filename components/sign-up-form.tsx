"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LegalPolicyLink } from "@/components/legal/legal-policy-link";
import { authClient } from "@/lib/auth-client";
import { PENDING_LEGAL_ACCEPTANCE_KEY } from "@/config/legal";
import { cn } from "@/lib/utils";
import { AUTH_TITLE_CLASS } from "@/components/shared/title-classes";

export function SignUpForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!acceptedPolicies) {
      setError("You must accept the Terms of Service and Privacy Policy.");
      return;
    }

    setIsLoading(true);

    try {
      const name = email.split("@")[0]?.replace(/[._+-]+/g, " ").trim() || "User";
      const { error } = await authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: "/onboarding",
      });
      if (error) throw new Error(error.message);
      sessionStorage.setItem(PENDING_LEGAL_ACCEPTANCE_KEY, "1");
      router.push("/onboarding");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError("Google sign-in isn't available yet. Create an account with email.");
  };

  return (
    <div className={cn("flex flex-col gap-8", className)} {...props}>
      <header className="flex flex-col gap-2">
        <h1 className={AUTH_TITLE_CLASS}>
          Create your account
        </h1>
        <p className="text-sm text-[var(--fg-2)]">Start free in under a minute.</p>
      </header>

      <Button
        type="button"
        variant="outline"
        className="h-11 w-full justify-center gap-2 rounded-xl border-[var(--border-strong)] bg-[var(--bg-surface)] text-sm font-medium shadow-[var(--shadow-xs)] hover:bg-[var(--bg-subtle)]"
        onClick={handleGoogleSignUp}
      >
        <FcGoogle className="size-[18px]" />
        Continue with Google
      </Button>

      <div className="relative flex items-center">
        <span className="h-px flex-1 bg-[var(--border)]" />
        <span className="px-3 text-xs uppercase tracking-[0.16em] text-[var(--fg-3)]">
          or with email
        </span>
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <form onSubmit={handleSignUp} className="flex flex-col gap-5">
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

        <div className="flex flex-col gap-2">
          <Label htmlFor="password" className="text-xs font-medium text-[var(--fg-2)]">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
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
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="repeat-password" className="text-xs font-medium text-[var(--fg-2)]">
            Repeat password
          </Label>
          <div className="relative">
            <Input
              id="repeat-password"
              type={showRepeatPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              className="h-11 rounded-xl bg-[var(--bg-surface)] pr-11"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-xl text-[var(--fg-3)] transition-colors hover:text-foreground"
              onClick={() => setShowRepeatPassword((prev) => !prev)}
              aria-label={showRepeatPassword ? "Hide password" : "Show password"}
            >
              {showRepeatPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]"
          >
            {error}
          </p>
        )}

        <div className="flex items-start gap-3">
          <Checkbox
            id="accept-policies"
            checked={acceptedPolicies}
            onCheckedChange={(checked) => setAcceptedPolicies(checked === true)}
            className="mt-0.5"
          />
          <Label
            htmlFor="accept-policies"
            className="text-sm font-normal leading-snug text-[var(--fg-2)]"
          >
            I agree to the{" "}
            <LegalPolicyLink policy="terms" className="auth-link">
              Terms of Service
            </LegalPolicyLink>{" "}
            and{" "}
            <LegalPolicyLink policy="privacy" className="auth-link">
              Privacy Policy
            </LegalPolicyLink>
            .
          </Label>
        </div>

        <Button
          type="submit"
          className="group h-11 w-full justify-center gap-1.5 rounded-xl text-sm font-medium"
          disabled={isLoading}
        >
          {isLoading ? "Creating account…" : "Create account"}
          {!isLoading && (
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--fg-2)]">
        Already have an account?{" "}
        <Link href="/auth/login" className="auth-link">
          Sign in
        </Link>
      </p>
    </div>
  );
}
