"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/settings/account", label: "Account" },
  { href: "/settings/legal", label: "Legal & privacy" },
  { href: "/settings/notifications", label: "Notifications" },
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/brand", label: "Brand kit" },
  { href: "/settings/billing", label: "Billing & plan" },
  { href: "/settings/api", label: "API & integrations" },
] as const;

export function SettingsTabs() {
  const pathname = usePathname();

  return (
    <div className="scroll-x flex gap-0 shadow-[inset_0_-1px_0_var(--border)]">
      {TABS.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative shrink-0 px-4 py-3 text-sm font-medium transition-colors",
              "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-foreground"
                : "text-muted-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
