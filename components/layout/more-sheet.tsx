"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { FileText, FolderKanban, Users } from "lucide-react";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AiIcon } from "@/components/shared/ai-icon";
import { MORE_ROUTES } from "@/config/mobile-nav";
import { PLAN_ORDER } from "@/config/plans";
import { useAiPanel } from "@/lib/ai-panel/context";
import { createClient } from "@/lib/supabase/client";
import type { PlanUsage } from "@/lib/plan-usage/helpers";
import type { PinnedItem } from "@/lib/pinned/queries";
import { cn } from "@/lib/utils";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  agency: "Agency",
};

const PLAN_COLORS: Record<string, string> = {
  free: "var(--fg-3)",
  starter: "var(--info)",
  pro: "var(--warning)",
  agency: "var(--accent)",
};

const GROUP_LABELS: Record<number, string> = {
  0: "Navigation",
  1: "Account",
  2: "",
};

// Type-colored icons matching sidebar
const PIN_COLORS: Record<string, string> = {
  project:  "#E0995E",
  client:   "#6E83F0",
  document: "#9B7FD8",
  task:     "#3FB87D",
};

const PIN_ICONS: Record<string, React.ElementType> = {
  project:  FolderKanban,
  client:   Users,
  document: FileText,
  task:     FolderKanban,
};

type MoreSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string | null;
  userName: string | null;
  userInitials: string;
  planUsage: PlanUsage;
  pinnedItems?: PinnedItem[];
};

function getInitials(initials: string): string {
  return initials.slice(0, 2).toUpperCase();
}

const AVATAR_PALETTES = [
  ["#3550E0", "#6E83F0"],
  ["#1F8A52", "#3FB87D"],
  ["#B36A12", "#E0995E"],
  ["#C13838", "#E76B6B"],
];

function hashInitials(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffffff;
  return Math.abs(h) % AVATAR_PALETTES.length;
}

function isRouteActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

export function MoreSheet({
  open,
  onOpenChange,
  userEmail,
  userName,
  userInitials,
  planUsage,
  pinnedItems = [],
}: MoreSheetProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { open: openAiPanel } = useAiPanel();
  const showUpgrade = PLAN_ORDER.indexOf(planUsage.planTier) < PLAN_ORDER.indexOf("pro");
  const palette = AVATAR_PALETTES[hashInitials(userInitials)];

  const signOut = async () => {
    onOpenChange(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const close = () => onOpenChange(false);

  const rowClass = (active: boolean) =>
    cn(
      "flex h-12 items-center gap-3.5 px-5 text-[length:var(--text-base)] no-underline",
      "border-s-2 transition-colors duration-[120ms]",
      "[-webkit-tap-highlight-color:transparent]",
      active
        ? "border-s-foreground bg-[var(--bg-subtle)] text-foreground"
        : "border-s-transparent bg-transparent text-[var(--fg-2)]",
    );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[88dvh] gap-0 rounded-t-2xl bg-[var(--bg-canvas)] p-0"
        // Sheet content: canvas surface, capped so the sheet never covers the
        // whole viewport.
      >
        {/* Drag handle */}
        <div className="flex justify-center pb-1 pt-2.5">
          <div className="h-1 w-9 rounded-full bg-[var(--border-strong)]" />
        </div>

        {/* User card */}
        <div className="flex items-center gap-3 border-b border-border px-5 pb-4 pt-3">
          <div
            className="grid size-10 shrink-0 place-items-center rounded-full text-[14px] font-bold text-white"
            // Gradient is derived per user from their initials.
            style={{ background: `linear-gradient(135deg, ${palette[0]}, ${palette[1]})` }}
          >
            {getInitials(userInitials)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[length:var(--text-sm)] font-semibold text-foreground">
              {userName ?? userEmail ?? "Account"}
            </div>
            {userEmail && (
              <div className="truncate text-[length:var(--text-xs)] text-[var(--fg-3)]">
                {userEmail}
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className="rounded-full border border-border bg-[var(--bg-subtle)] px-2 py-0.5 text-[11px] font-semibold"
              // Colour is per plan tier, from PLAN_COLORS.
              style={{ color: PLAN_COLORS[planUsage.planTier] ?? "var(--fg-3)" }}
            >
              {PLAN_LABELS[planUsage.planTier] ?? planUsage.planTier}
            </span>
            <ThemeToggle />
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto pb-[max(24px,env(safe-area-inset-bottom))]">

          {/* Ask AI */}
          <div className="mt-2">
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                openAiPanel();
              }}
              className={cn(
                "flex h-12 w-full cursor-pointer items-center gap-3.5 px-5 text-start",
                "border-0 border-s-2 border-s-transparent bg-transparent",
                "text-[length:var(--text-base)] text-[var(--fg-2)]",
                "[-webkit-tap-highlight-color:transparent]",
              )}
            >
              <AiIcon size={18} className="shrink-0" />
              <span>Ask AI</span>
            </button>
            <div className="my-2 h-px bg-border" />
          </div>

          {/* Pinned items */}
          {pinnedItems.length > 0 && (
            <div className="mt-2">
              <div className="px-5 pb-0.5 pt-1 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[var(--fg-3)]">
                Pinned
              </div>
              {pinnedItems.map((item) => {
                const Icon = PIN_ICONS[item.item_type] ?? FileText;
                const color = PIN_COLORS[item.item_type] ?? "var(--fg-3)";
                const active = isRouteActive(pathname, item.item_href);
                return (
                  <Link
                    key={item.id}
                    href={item.item_href}
                    onClick={close}
                    className={rowClass(active)}
                  >
                    <Icon size={18} strokeWidth={1.6} className="shrink-0" style={{ color }} />
                    <span className="truncate">
                      {item.item_label}
                    </span>
                  </Link>
                );
              })}
              <div className="my-2 h-px bg-border" />
            </div>
          )}

          {/* Navigation groups */}
          {[0, 1, 2].map((groupId) => {
            const routes = MORE_ROUTES.filter((r) => r.group === groupId);
            if (!routes.length) return null;
            const label = GROUP_LABELS[groupId];

            return (
              <div
                key={groupId}
                className={cn(
                  groupId === 0 && pinnedItems.length === 0 ? "mt-2" : "mt-0",
                )}
              >
                {label && (
                  <div className="px-5 pb-0.5 pt-1 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[var(--fg-3)]">
                    {label}
                  </div>
                )}
                {routes.map((route) => {
                  const Icon = route.icon;
                  const active = route.href ? isRouteActive(pathname, route.href) : false;

                  if (route.action === "signout") {
                    return (
                      <button
                        key={route.id}
                        type="button"
                        onClick={() => void signOut()}
                        className={cn(
                          "flex h-12 w-full cursor-pointer items-center gap-3.5 px-5 text-start",
                          "border-0 border-s-2 border-s-transparent bg-transparent",
                          "text-[length:var(--text-base)] text-[var(--danger)]",
                          "[-webkit-tap-highlight-color:transparent]",
                        )}
                      >
                        <Icon size={18} strokeWidth={1.6} />
                        <span>{route.label}</span>
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={route.id}
                      href={route.href!}
                      onClick={close}
                      className={rowClass(active)}
                    >
                      <Icon
                        size={18}
                        strokeWidth={1.6}
                        className={cn("shrink-0", active ? "text-foreground" : "text-[var(--fg-3)]")}
                      />
                      <span>{route.label}</span>
                    </Link>
                  );
                })}
                {groupId < 1 && (
                  <div className="my-2 h-px bg-border" />
                )}
              </div>
            );
          })}

          {showUpgrade && (
            <div className="mx-5 my-3 rounded-[var(--radius-lg)] border border-[var(--accent-soft-2)] bg-[var(--accent-soft)] px-4 py-3">
              {/* text-primary / bg-primary, not var(--accent): globals.css
                  re-points --accent at --accent-soft for shadcn, so this
                  heading was accent-soft on an accent-soft card and the button
                  was white text on the same tint — both invisible. */}
              <div className="mb-0.5 text-[length:var(--text-sm)] font-semibold text-primary">
                Upgrade to Pro
              </div>
              <div className="text-[length:var(--text-xs)] text-[var(--fg-2)]">
                Unlock all agents + unlimited everything.
              </div>
              <Link
                href="/settings/billing"
                onClick={close}
                className="mt-2.5 inline-block rounded-md bg-primary px-3.5 py-1.5 text-[length:var(--text-sm)] font-semibold text-primary-foreground no-underline"
              >
                View plans
              </Link>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
