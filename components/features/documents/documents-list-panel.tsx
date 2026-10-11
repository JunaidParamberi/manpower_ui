"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  LIST_TOGGLE_KEY,
  isListToggleShortcut,
  serializeListCollapsedCookie,
} from "@/lib/documents/list-panel-state";

type ListPanelState = { collapsed: boolean; toggle: () => void };

const ListPanelContext = createContext<ListPanelState | null>(null);

/**
 * Holds the documents list collapsed / expanded state. Persists to a cookie
 * (read by the documents layout on the server) and listens for the `[`
 * shortcut.
 */
export function DocumentsListPanelProvider({
  initialCollapsed,
  children,
}: {
  initialCollapsed: boolean;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      document.cookie = serializeListCollapsedCookie(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isListToggleShortcut(event, event.target instanceof HTMLElement ? event.target : null)) return;
      event.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  const value = useMemo(() => ({ collapsed, toggle }), [collapsed, toggle]);
  return <ListPanelContext.Provider value={value}>{children}</ListPanelContext.Provider>;
}

/** Null outside the documents shell (e.g. Storybook stories of the pane alone). */
export function useDocumentsListPanel(): ListPanelState | null {
  return useContext(ListPanelContext);
}

type DocumentsListToggleProps = {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
};

/**
 * Icon button that hides or shows the documents list, with the shortcut in
 * its tooltip. Desktop only — on small screens list and document are
 * separate screens already.
 */
export function DocumentsListToggle({ collapsed, onToggle, className }: DocumentsListToggleProps) {
  const label = collapsed ? "Show document list" : "Hide document list";
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onToggle}
            aria-label={label}
            aria-expanded={!collapsed}
            aria-keyshortcuts={LIST_TOGGLE_KEY}
            className={className}
          >
            <Icon strokeWidth={1.6} />
          </Button>
        }
      />
      <TooltipContent side={collapsed ? "right" : "bottom"}>
        {label}
        <kbd className="ml-2 rounded border border-border px-1 font-mono text-[10px]">{LIST_TOGGLE_KEY}</kbd>
      </TooltipContent>
    </Tooltip>
  );
}
