"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

import { MOBILE_TABS, MORE_ROUTES } from "@/config/mobile-nav";
import { cn } from "@/lib/utils";

type MobileTabBarProps = {
  onOpenMore: () => void;
  className?: string;
};

function isTabActive(pathname: string, href: string | undefined): boolean {
  if (!href) return false;
  return pathname === href || pathname.startsWith(href + "/");
}

function isMoreActive(pathname: string): boolean {
  return MORE_ROUTES.some(
    (r) => r.href && (pathname === r.href || pathname.startsWith(r.href + "/")),
  );
}

export function MobileTabBar({ onOpenMore, className }: MobileTabBarProps) {
  const pathname = usePathname();
  const moreActive = isMoreActive(pathname);

  return (
    <nav
      className={cn(
        "mobile-tab-bar fixed inset-x-0 bottom-0 z-50 flex items-stretch",
        "h-[var(--tab-h)] border-t border-border pb-[env(safe-area-inset-bottom)]",
        "bg-[color-mix(in_srgb,var(--bg-canvas)_96%,transparent)]",
        "backdrop-blur-[20px] backdrop-saturate-[1.8]",
      )}
    >
      {MOBILE_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          tab.action === "more"
            ? moreActive
            : isTabActive(pathname, tab.href);

        const inner = (
          <span className="relative flex flex-col items-center gap-[3px] px-3 py-1.5">
            {/* Active indicator bar */}
            <span
              className={cn(
                "absolute -top-px left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-foreground",
                "origin-center transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                isActive ? "scale-x-100" : "scale-x-0",
              )}
            />
            <Icon
              size={21}
              strokeWidth={isActive ? 2.1 : 1.6}
              className={cn(
                "transition-colors duration-150",
                isActive ? "text-foreground" : "text-[var(--fg-3)]",
              )}
            />
            <span
              className={cn(
                "font-heading text-[10px] leading-none transition-colors duration-150",
                isActive
                  ? "font-semibold tracking-[-0.01em] text-foreground"
                  : "font-medium tracking-normal text-[var(--fg-3)]",
              )}
            >
              {tab.label}
            </span>
          </span>
        );

        const sharedClass = cn(
          "relative flex flex-1 cursor-pointer flex-col items-center justify-center",
          "min-h-11 border-0 bg-transparent pt-1 no-underline",
          "[-webkit-tap-highlight-color:transparent]",
        );

        if (tab.action === "more") {
          return (
            <button
              key={tab.id}
              type="button"
              onClick={onOpenMore}
              className={sharedClass}
              aria-label="More options"
              aria-pressed={moreActive}
            >
              {inner}
            </button>
          );
        }

        return (
          <Link
            key={tab.id}
            href={tab.href!}
            className={sharedClass}
            aria-current={isActive ? "page" : undefined}
          >
            {inner}
          </Link>
        );
      })}
    </nav>
  );
}
