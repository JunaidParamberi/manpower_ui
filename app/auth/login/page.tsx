import type { Metadata } from "next";

import { LoginForm } from "@/components/login-form";
import { safeNextPath } from "@/lib/auth/safe-next-path";

export const metadata: Metadata = {
  title: "Log in",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <LoginForm next={safeNextPath(next)} />;
}
