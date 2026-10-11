import Link from "next/link";

import { LogoutButton } from "@/components/logout-button";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export async function AuthEntryLinks() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (user) {
    return (
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "default" }))}
        >
          Go to protected page
        </Link>
        <LogoutButton />
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <Link href="/auth/login" className={cn(buttonVariants({ variant: "default" }))}>
        Login
      </Link>
      <Link href="/auth/sign-up" className={cn(buttonVariants({ variant: "outline" }))}>
        Sign up
      </Link>
      <Link href="/auth/forgot-password" className={cn(buttonVariants({ variant: "ghost" }))}>
        Forgot password
      </Link>
    </div>
  );
}
