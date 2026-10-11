"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CreditCard, LifeBuoy, LogOut, Monitor, Moon, Settings, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { switchTheme } from "@/components/layout/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PLAN_LABELS, avatarPalette, canUpgrade, planUsageRows } from "@/lib/layout/account";
import type { PlanUsage, UsageLevel } from "@/lib/plan-usage/helpers";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type AccountMenuProps = {
  userName: string | null;
  userEmail: string | null;
  userInitials: string;
  planUsage: PlanUsage;
  /** Storybook seam; defaults to Supabase sign-out + redirect. */
  onSignOut?: () => void;
};

const BAR_TONE: Record<UsageLevel, string> = {
  ok: "bg-[var(--accent)]",
  warn: "bg-[var(--warning)]",
  danger: "bg-[var(--danger)]",
};

function Avatar({ initials, size }: { initials: string; size: "sm" | "lg" }) {
  const [from, to] = avatarPalette(initials);
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold tracking-[-0.01em] text-white",
        size === "sm" ? "size-7 text-[11px]" : "size-9 text-[13px]",
      )}
      // Gradient is derived per user from their initials.
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {initials.slice(0, 2).toUpperCase()}
    </span>
  );
}

const THEMES = [
  { id: "light", label: "Light", Icon: Sun },
  { id: "dark", label: "Dark", Icon: Moon },
  { id: "system", label: "System", Icon: Monitor },
] as const;

function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const current = mounted ? (theme ?? "system") : null;

  return (
    <div role="radiogroup" aria-label="Theme" className="flex gap-0.5 rounded-md bg-[var(--bg-subtle)] p-0.5">
      {THEMES.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={current === id}
          aria-label={label}
          title={label}
          onClick={() => (id === "system" ? setTheme("system") : switchTheme(id, setTheme))}
          className={cn(
            "grid h-6 w-8 cursor-pointer place-items-center rounded-[5px] border-0 bg-transparent text-[var(--fg-3)] transition-colors",
            current === id
              ? "bg-[var(--bg-surface)] text-foreground shadow-[var(--shadow-xs)]"
              : "hover:text-foreground",
          )}
        >
          <Icon size={13} strokeWidth={1.6} />
        </button>
      ))}
    </div>
  );
}

/**
 * Account menu in the top-right of the app header: who you are, plan and
 * usage, billing, settings, support, theme and sign-out. Desktop only — on
 * mobile the More sheet carries the same options.
 */
export function AccountMenu({ userName, userEmail, userInitials, planUsage, onSignOut }: AccountMenuProps) {
  const router = useRouter();
  const tier = planUsage.planTier;
  const rows = planUsageRows(planUsage);
  const displayName = userName ?? userEmail ?? "Account";

  const signOut =
    onSignOut ??
    (async () => {
      await createClient().auth.signOut();
      router.push("/auth/login");
    });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={`Account menu for ${displayName}`}
            className="grid size-8 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 transition-shadow hover:shadow-[0_0_0_2px_var(--border-strong)] focus-visible:shadow-[0_0_0_3px_var(--accent-ring)] focus-visible:outline-none"
          />
        }
      >
        <Avatar initials={userInitials} size="sm" />
      </DropdownMenuTrigger>

      <DropdownMenuContent side="bottom" align="end" sideOffset={8} className="w-72 p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2.5 px-2 py-2 font-normal">
            <Avatar initials={userInitials} size="lg" />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-body font-semibold text-foreground">{displayName}</span>
              {userEmail && userName ? (
                <span className="truncate text-meta text-[var(--fg-3)]">{userEmail}</span>
              ) : null}
            </div>
            <span className="shrink-0 rounded-full bg-[var(--bg-subtle)] px-2 py-0.5 text-label font-medium text-[var(--fg-2)]">
              {PLAN_LABELS[tier]}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        {canUpgrade(tier) ? (
          <div className="px-2 pb-2">
            <Link
              href="/settings/billing"
              className="flex h-8 w-full items-center justify-center rounded-md bg-primary text-body font-medium text-primary-foreground no-underline transition-opacity hover:opacity-90"
            >
              Upgrade
            </Link>
          </div>
        ) : null}

        {rows.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <div className="flex flex-col gap-2.5 px-2 py-2.5">
              {rows.map((row) => (
                <div key={row.key} className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-2 text-meta">
                    <span className="text-[var(--fg-2)]">{row.label}</span>
                    <span className="tabular-nums text-[var(--fg-3)]">
                      {row.used} / {row.limit}
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                    <div
                      className={cn("h-full rounded-full", BAR_TONE[row.level])}
                      style={{ width: `${Math.round(row.ratio * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/settings/billing" />}>
            <CreditCard size={14} strokeWidth={1.6} />
            <span className="flex-1">Plan &amp; billing</span>
            <span className="text-label text-[var(--fg-3)]">{PLAN_LABELS[tier]}</span>
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/settings" />}>
            <Settings size={14} strokeWidth={1.6} />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/support" />}>
            <LifeBuoy size={14} strokeWidth={1.6} />
            Support
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <span className="text-body text-[var(--fg-2)]">Theme</span>
          <ThemeSwitch />
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => void signOut()}>
          <LogOut size={14} strokeWidth={1.6} />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
