import type { Metadata } from "next";
import Link from "next/link";

import { AUTH_TITLE_CLASS } from "@/components/shared/title-classes";

export const metadata: Metadata = { title: "Account deleted" };

export default function AccountDeletedPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center gap-4 px-6 py-12 text-center">
      <h1 className={AUTH_TITLE_CLASS}>
        Your account has been deleted
      </h1>
      <p className="text-sm text-muted-foreground">
        All of your Manpower data has been permanently removed. You can create
        a new account any time if you return.
      </p>
      <Link
        href="/auth/sign-up"
        className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
      >
        Create a new account
      </Link>
    </div>
  );
}
