import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleOneTap } from "@/components/auth/google-one-tap";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <GoogleOneTap />
      <AuthShell>{children}</AuthShell>
    </>
  );
}
