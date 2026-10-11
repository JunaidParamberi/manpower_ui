"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Pin, Plus, Search } from "lucide-react";
import { Command as CommandPrimitive } from "cmdk";

import {
  COMMAND_PALETTE_CREATE,
  COMMAND_PALETTE_GO_TO,
  COMMAND_PALETTE_SUGGESTED,
  type CommandPaletteNavItem,
} from "@/config/command-palette";
import { useCommandSearch } from "@/hooks/use-command-search";
import { useRecentItems, type RecentItem } from "@/hooks/use-recent-items";
import type { PinnedItem } from "@/lib/pinned/queries";
import type { GlobalSearchResult } from "@/lib/search/types";
import { cn } from "@/lib/utils";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  CommandPaletteResultRow,
} from "./command-palette-result-row";
import { CommandPaletteSearchLoading } from "./command-palette-search-loading";

export type CommandPalettePreviewState = {
  query?: string;
  loading?: boolean;
  error?: string | null;
  results?: {
    clients: GlobalSearchResult[];
    projects: GlobalSearchResult[];
    documents: GlobalSearchResult[];
  };
  recentItems?: RecentItem[];
  pinnedItems?: PinnedItem[];
};

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pinnedItems?: PinnedItem[];
  preview?: CommandPalettePreviewState;
};

function ItemIcon({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <div className="grid size-[26px] shrink-0 place-items-center rounded-[7px] bg-[var(--bg-subtle)] text-[var(--fg-3)]">
      <Icon size={13} strokeWidth={1.6} />
    </div>
  );
}

function navMatchesQuery(item: CommandPaletteNavItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  return [item.label, item.sub].filter(Boolean).join(" ").toLowerCase().includes(q);
}

function searchResultValue(result: GlobalSearchResult): string {
  return [result.label, result.subtitle, result.kind].join(" ");
}

function pinnedKindLabel(type: PinnedItem["item_type"]): string {
  switch (type) {
    case "client":
      return "client";
    case "project":
      return "project";
    case "document":
      return "document";
    case "task":
      return "task";
    default:
      return type;
  }
}

export function CommandPalette({
  open,
  onOpenChange,
  pinnedItems = [],
  preview,
}: CommandPaletteProps) {
  const router = useRouter();
  const isPreview = preview != null;
  const [query, setQuery] = useState("");
  const { recentItems, pushRecentItem } = useRecentItems();
  const liveSearch = useCommandSearch(query, open && !isPreview);

  const effectiveQuery = preview?.query ?? query;
  const effectiveLoading = preview?.loading ?? liveSearch.loading;
  const effectiveError = preview?.error ?? liveSearch.error;
  const effectiveResults = preview?.results ?? liveSearch.results;
  const effectiveRecent = preview?.recentItems ?? recentItems;
  const effectivePinned = preview?.pinnedItems ?? pinnedItems;
  const isSearching = effectiveQuery.trim().length > 0;

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  const filteredGoTo = useMemo(
    () => COMMAND_PALETTE_GO_TO.filter((item) => navMatchesQuery(item, effectiveQuery)),
    [effectiveQuery],
  );
  const filteredCreate = useMemo(
    () => COMMAND_PALETTE_CREATE.filter((item) => navMatchesQuery(item, effectiveQuery)),
    [effectiveQuery],
  );
  const filteredSuggested = useMemo(
    () => COMMAND_PALETTE_SUGGESTED.filter((item) => navMatchesQuery(item, effectiveQuery)),
    [effectiveQuery],
  );

  const entityCount =
    effectiveResults.clients.length +
    effectiveResults.projects.length +
    effectiveResults.documents.length;

  const hasNavMatches =
    filteredSuggested.length + filteredGoTo.length + filteredCreate.length > 0;

  const showBrowseSections = !isSearching;
  const showEmptySearch =
    isSearching && !effectiveLoading && entityCount === 0 && !hasNavMatches;

  function navigate(href: string, recent?: RecentItem) {
    if (recent) {
      pushRecentItem(recent);
    }
    onOpenChange(false);
    router.push(href);
  }

  function handleEntitySelect(result: GlobalSearchResult) {
    navigate(result.href, {
      id: result.id,
      label: result.label,
      subtitle: result.subtitle,
      href: result.href,
      kind: result.kind,
    });
  }

  function handleNavSelect(item: CommandPaletteNavItem) {
    if (!item.href) {
      return;
    }
    navigate(item.href, {
      id: item.id,
      label: item.label,
      href: item.href,
      kind: "nav",
    });
  }

  function handlePinnedSelect(item: PinnedItem) {
    navigate(item.item_href, {
      id: item.item_id,
      label: item.item_label,
      href: item.item_href,
      kind:
        item.item_type === "client" ||
        item.item_type === "project" ||
        item.item_type === "document"
          ? item.item_type
          : "nav",
    });
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Search clients, projects, and documents, or jump to a page"
      showCloseButton={false}
      className={cn(
        "top-[10vh]! left-1/2! -translate-x-1/2! translate-y-0!",
        "w-[min(100%-2rem,var(--dialog-max-w))]! max-w-[var(--dialog-max-w)]!",
        "h-auto! max-h-[min(480px,calc(100dvh-12vh-1.5rem))]!",
        "overflow-hidden border border-[var(--border)] bg-[var(--bg-surface)] p-0!",
        "shadow-[var(--shadow-pop)] ring-0!",
      )}
    >
      <Command
        className="flex h-full flex-col overflow-hidden rounded-xl! bg-[var(--bg-surface)] p-0"
        shouldFilter={false}
      >
        <div className="flex shrink-0 items-center gap-2.5 border-b border-[var(--border)] px-3.5 py-3">
          <Search size={16} strokeWidth={1.6} className="shrink-0 text-[var(--fg-3)]" />
          <CommandPrimitive.Input
            placeholder="Search clients, projects, documents…"
            value={isPreview ? effectiveQuery : query}
            onValueChange={isPreview ? undefined : setQuery}
            readOnly={isPreview}
            autoFocus
            className="min-w-0 flex-1 border-none bg-transparent font-sans text-[length:var(--text-base)] text-foreground outline-none placeholder:text-[var(--fg-3)]"
          />
          <KbdHint className="hidden sm:inline-flex">esc</KbdHint>
        </div>

        <CommandPrimitive.List
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 py-1.5",
            "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1",
            "[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase",
            "[&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-[var(--fg-3)]",
          )}
        >
          {showEmptySearch ? (
            <CommandEmpty>
              <div className="px-4 py-6 text-[13px] text-[var(--fg-3)]">
                No matches for &ldquo;{effectiveQuery.trim()}&rdquo;. Try a client name,
                project title, or INV-0042.
              </div>
            </CommandEmpty>
          ) : null}

          {isSearching && effectiveLoading ? (
            <CommandPaletteSearchLoading />
          ) : null}

          {isSearching && effectiveError ? (
            <div className="px-4 py-3 text-[13px] text-destructive">{effectiveError}</div>
          ) : null}

          {isSearching && !effectiveLoading ? (
            <>
              {effectiveResults.clients.length > 0 ? (
                <CommandGroup heading="Clients">
                  {effectiveResults.clients.map((result) => (
                    <CommandItem
                      key={`client-${result.id}`}
                      value={searchResultValue(result)}
                      onSelect={() => handleEntitySelect(result)}
                      className="mx-1 gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer"
                    >
                      <CommandPaletteResultRow result={result} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}

              {effectiveResults.projects.length > 0 ? (
                <CommandGroup heading="Projects">
                  {effectiveResults.projects.map((result) => (
                    <CommandItem
                      key={`project-${result.id}`}
                      value={searchResultValue(result)}
                      onSelect={() => handleEntitySelect(result)}
                      className="mx-1 gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer"
                    >
                      <CommandPaletteResultRow result={result} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}

              {effectiveResults.documents.length > 0 ? (
                <CommandGroup heading="Documents">
                  {effectiveResults.documents.map((result) => (
                    <CommandItem
                      key={`document-${result.id}`}
                      value={searchResultValue(result)}
                      onSelect={() => handleEntitySelect(result)}
                      className="mx-1 gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer"
                    >
                      <CommandPaletteResultRow result={result} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}

              {(filteredSuggested.length > 0 ||
                filteredGoTo.length > 0 ||
                filteredCreate.length > 0) &&
              entityCount > 0 ? (
                <CommandSeparator />
              ) : null}
            </>
          ) : null}

          {showBrowseSections && effectiveRecent.length > 0 ? (
            <CommandGroup heading="Recent">
              {effectiveRecent.map((item) => (
                <CommandItem
                  key={`recent-${item.href}`}
                  value={`recent ${item.label} ${item.subtitle ?? ""}`}
                  onSelect={() => navigate(item.href, item)}
                  className="mx-1 gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer"
                >
                  <ItemIcon icon={Clock} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[length:var(--text-sm)] text-foreground">
                      {item.label}
                    </div>
                    {item.subtitle ? (
                      <div className="truncate text-[11px] text-[var(--fg-3)]">
                        {item.subtitle}
                      </div>
                    ) : null}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {showBrowseSections && effectivePinned.length > 0 ? (
            <>
              {effectiveRecent.length > 0 ? <CommandSeparator /> : null}
              <CommandGroup heading="Pinned">
                {effectivePinned.map((item) => (
                  <CommandItem
                    key={`pinned-${item.id}`}
                    value={`pinned ${item.item_label}`}
                    onSelect={() => handlePinnedSelect(item)}
                    className="mx-1 gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer"
                  >
                    <ItemIcon icon={Pin} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[length:var(--text-sm)] text-foreground">
                        {item.item_label}
                      </div>
                      <div className="truncate text-[11px] capitalize text-[var(--fg-3)]">
                        {pinnedKindLabel(item.item_type)}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ) : null}

          {showBrowseSections && filteredSuggested.length > 0 ? (
            <>
              {effectiveRecent.length > 0 || effectivePinned.length > 0 ? (
                <CommandSeparator />
              ) : null}
              <CommandGroup heading="Suggested">
                {filteredSuggested.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.label}
                    onSelect={() => handleNavSelect(item)}
                    className="mx-1 gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer"
                  >
                    <ItemIcon icon={item.icon} />
                    <span className="text-[length:var(--text-sm)] text-foreground">
                      {item.label}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ) : null}

          {(showBrowseSections || isSearching) && filteredGoTo.length > 0 ? (
            <>
              {showBrowseSections &&
              (effectiveRecent.length > 0 ||
                effectivePinned.length > 0 ||
                filteredSuggested.length > 0) ? (
                <CommandSeparator />
              ) : null}
              <CommandGroup heading="Go to">
                {filteredGoTo.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.label}
                    onSelect={() => handleNavSelect(item)}
                    className="mx-1 gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer"
                  >
                    <ItemIcon icon={item.icon} />
                    <span className="text-[length:var(--text-sm)] text-foreground">
                      {item.label}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ) : null}

          {(showBrowseSections || isSearching) && filteredCreate.length > 0 ? (
            <>
              <CommandSeparator />
              <CommandGroup heading="Create">
                {filteredCreate.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.label}
                    onSelect={() => handleNavSelect(item)}
                    className="mx-1 gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer"
                  >
                    <ItemIcon icon={Plus} />
                    <span className="text-[length:var(--text-sm)] text-foreground">
                      {item.label}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ) : null}
        </CommandPrimitive.List>

        <div className="flex shrink-0 items-center justify-end gap-2.5 rounded-b-xl border-t border-[var(--border)] bg-[var(--bg-canvas)] px-3.5 py-2">
          <div className="flex items-center gap-2.5 text-[11px] text-[var(--fg-3)]">
            <span className="hidden sm:inline">
              <KbdHint>↑↓</KbdHint> navigate
            </span>
            <span>
              <KbdHint>↵</KbdHint> select
            </span>
            <span className="sm:hidden">
              <KbdHint>esc</KbdHint> close
            </span>
          </div>
        </div>
      </Command>
    </CommandDialog>
  );
}

function KbdHint({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <kbd
      className={cn(
        "rounded-[4px] border border-[var(--border)] bg-[var(--bg-subtle)] px-1.5 py-0.5 font-sans text-[10px] text-[var(--fg-3)]",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
