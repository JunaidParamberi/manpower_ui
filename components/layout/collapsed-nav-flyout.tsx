"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type CollapsedNavFlyoutItem = {
  label: string;
  href: string;
};

export type CollapsedNavFlyoutProps = {
  /** Section name shown as the flyout heading, e.g. "Documents". */
  label: string;
  items: CollapsedNavFlyoutItem[];
  /** Href of the currently active sub-item, or null when the parent route is active. */
  activeHref?: string | null;
  /** The collapsed icon element that opens the flyout on hover. */
  trigger: ReactElement;
  onNavigate?: () => void;
};

/**
 * Hover flyout that exposes a nav section's sub-items while the sidebar is
 * collapsed to icons. The trigger stays a link, so clicking still navigates to
 * the section root.
 */
export function CollapsedNavFlyout({
  label,
  items,
  activeHref,
  trigger,
  onNavigate,
}: CollapsedNavFlyoutProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        openOnHover
        delay={100}
        closeDelay={120}
        nativeButton={false}
        render={trigger}
      />
      <DropdownMenuContent
        side="right"
        sideOffset={8}
        align="start"
        className="w-auto min-w-44"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          {items.map((item) => (
            <DropdownMenuItem
              key={item.href}
              render={<Link href={item.href} onClick={onNavigate} />}
              className={
                item.href === activeHref
                  ? "bg-accent text-accent-foreground"
                  : undefined
              }
            >
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
