"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { getDocumentReadiness } from "@/lib/documents/readiness";
import { DocumentsListToggle, useDocumentsListPanel } from "./documents-list-panel";
import { cn } from "@/lib/utils";
import { useAgentGlow } from "@/lib/ai-panel/agent-activity-context";
import {
  DOCUMENT_TYPE_NAV,
  deriveActiveTypeFromPathname,
  documentDetailHref,
  documentIdFromPathname,
} from "@/lib/documents/document-routes";
import {
  DOCUMENT_TYPE_ICONS,
  documentListStatusLabel,
  documentStatusDotClass,
  documentTypeLabel,
  formatDocumentAmount,
  getDocumentDueDateCountdown,
  getDocumentListNumber,
  isDocumentOverdue,
} from "@/lib/documents/display";
import { setActiveDocumentType } from "@/lib/documents/active-type-state";
import { NewDocumentButton } from "@/components/features/documents/workspace/new-document-button";
import { useDocumentsData } from "@/components/features/documents/documents-data-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import type { DocumentListRow, DocumentStatus, DocumentType } from "@/types";

function isRecurringInvoice(
  doc: DocumentListRow,
  recurringSourceIds: Set<string>,
): boolean {
  return recurringSourceIds.has(doc.id) || Boolean(doc.recurring_invoice_id);
}

const CREATABLE: DocumentType[] = ["invoice", "quote", "proposal", "local_purchase_order"];

/** The type New creates: the list's own type when it can be created, else an invoice. */
function newDocumentType(activeType: DocumentType | null): DocumentType {
  return activeType && CREATABLE.includes(activeType) ? activeType : "invoice";
}

function DocumentRow({
  d,
  activeType,
  recurringSourceIds,
  selectedId,
}: {
  d: DocumentListRow;
  activeType: DocumentType | null;
  recurringSourceIds: Set<string>;
  selectedId: string | null;
}) {
  const documentsGlow = useAgentGlow("documents", d.id);
  const paymentsGlow = useAgentGlow("payments", d.id);
  const glow = documentsGlow || paymentsGlow;

  const docNumber = getDocumentListNumber(d);
  const typePrefix = DOCUMENT_TYPE_ICONS[d.type] ?? "DOC";
  const overdue = isDocumentOverdue({
    status: d.status,
    dueDate: d.due_date,
  });
  const dot = documentStatusDotClass(d.status, overdue);
  const statusLabel = documentListStatusLabel(
    d.status as DocumentStatus,
    overdue,
  );
  const countdown = getDocumentDueDateCountdown(d.due_date, d.status);
  const isSelected = selectedId === d.id;
  const isRecurring = isRecurringInvoice(d, recurringSourceIds);
  // Drafts missing a client, a priced line or their date can't be sent yet.
  const isIncomplete =
    d.status === "draft" &&
    !getDocumentReadiness(d, [{ quantity: 1, unit_price: d.total_amount ?? 0 }]).ready;

  return (
    <li key={d.id}>
      <Link
        href={documentDetailHref(d.id, activeType)}
        aria-current={isSelected ? "page" : undefined}
        className={cn(
          "flex flex-col gap-1 border-l-2 px-4 py-3.5 transition-colors lg:py-3",
          isSelected
            ? "border-l-primary bg-muted/50"
            : "border-l-transparent hover:bg-muted/30",
          glow && "agent-glow",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {typePrefix}
            </span>
            <span className="truncate text-sm font-medium text-foreground">
              {docNumber}
            </span>
            {isRecurring ? (
              <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                Recurring
              </span>
            ) : null}
          </div>
          {isIncomplete ? (
            <span className="shrink-0 rounded bg-[var(--warning-soft)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--warning)]">
              Incomplete
            </span>
          ) : (
            <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
              {formatDocumentAmount(d.total_amount, d.currency ?? "USD")}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs text-muted-foreground">
            {d.client?.name ?? "—"}
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            {countdown ? (
              <span
                className={cn(
                  "text-[11px] font-normal",
                  countdown.color === "muted" && "text-muted-foreground",
                  countdown.color === "amber" && "text-amber-600 dark:text-amber-400",
                  countdown.color === "destructive" && "text-destructive",
                )}
              >
                {countdown.label}
              </span>
            ) : null}
            <span className="flex items-center gap-1">
              <span className={cn("size-2 shrink-0 rounded-full", dot)} aria-hidden />
              <span className="text-xs text-foreground/80">{statusLabel}</span>
            </span>
          </span>
        </div>
      </Link>
    </li>
  );
}

const SEARCH_DEBOUNCE_MS = 300;

export function DocumentsListPane() {
  const listPanel = useDocumentsListPanel();
  const {
    documents,
    recurringSourceDocumentIds,
    hasMore,
    loadMore,
    isLoadingMore,
  } = useDocumentsData();

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const recurringOnly = searchParams.get("recurring") === "1";

  // The search term lives in the URL so the server can filter in Postgres.
  // The input keeps a local echo so typing stays responsive between debounced
  // navigations; when the URL changes from elsewhere (back/forward, a cleared
  // search, a type-tab switch) the echo is reconciled during render rather
  // than in an effect, which would paint the stale value first.
  const urlQuery = searchParams.get("q") ?? "";
  const [filterQuery, setFilterQuery] = useState(urlQuery);
  const [isSearchPending, startSearchTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The term THIS component last pushed — not the last URL it observed. The
  // difference matters: a push takes a round trip to the database (Tokyo), and
  // the user keeps typing during it. Reconciling against the last observed URL
  // meant our own navigation committing looked like an external change, so it
  // reset the input to the already-pushed term and threw away every character
  // typed while it was in flight. Comparing against what we pushed makes our
  // own commit a no-op, while a genuine external change (back/forward, a link
  // to a different ?q=) still differs and still reconciles.
  const lastPushedQueryRef = useRef(urlQuery);
  if (urlQuery !== lastPushedQueryRef.current) {
    lastPushedQueryRef.current = urlQuery;
    setFilterQuery(urlQuery);
  }

  // The debounced push fires from a closure created up to 300 ms earlier, so
  // it reads the current location from refs rather than that stale closure —
  // otherwise a navigation mid-debounce would rewrite the previous route.
  const locationRef = useRef({ pathname, search: searchParams.toString() });
  locationRef.current = { pathname, search: searchParams.toString() };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function pushSearch(next: string) {
    const { pathname: currentPath, search } = locationRef.current;
    const params = new URLSearchParams(search);
    if (next.trim()) params.set("q", next);
    else params.delete("q");
    // Record what the URL is about to say, so that when this navigation
    // finally commits the reconciliation above recognises it as ours.
    lastPushedQueryRef.current = next.trim() ? next : "";
    const qs = params.toString();
    startSearchTransition(() => {
      router.replace(qs ? `${currentPath}?${qs}` : currentPath, {
        scroll: false,
      });
    });
  }

  function onSearchChange(next: string) {
    setFilterQuery(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => pushSearch(next),
      SEARCH_DEBOUNCE_MS,
    );
  }

  function clearSearch() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setFilterQuery("");
    pushSearch("");
  }

  const recurringSourceIds = useMemo(
    () => new Set(recurringSourceDocumentIds),
    [recurringSourceDocumentIds],
  );

  const activeType = deriveActiveTypeFromPathname(
    pathname,
    searchParams.get("list"),
  );

  useEffect(() => {
    setActiveDocumentType(activeType);
    return () => setActiveDocumentType(null);
  }, [activeType]);

  // Type and search are applied in Postgres by the @list slot, so nothing is
  // re-filtered here. The recurring toggle is the one exception: "recurring"
  // is not a column but a join against recurring_invoices, so it still narrows
  // the loaded rows client-side.
  //
  // Known consequence, carried over from before this pane was server-filtered:
  // past the first page of invoices the toggle can show "No recurring
  // invoices." while matches sit on page 2, because it only ever sees the rows
  // already loaded. Load more is reachable, so the rows are not lost — but the
  // empty state can lie until the user pages far enough. Fixing it properly
  // means pushing recurring into the query, which needs a variable-length id
  // array threaded through the cache key.
  const filtered = useMemo(() => {
    if (activeType !== "invoice" || !recurringOnly) return documents;
    return documents.filter((d) => isRecurringInvoice(d, recurringSourceIds));
  }, [activeType, documents, recurringOnly, recurringSourceIds]);

  const selectedId = useMemo(() => {
    const idFromPath = documentIdFromPathname(pathname);
    if (idFromPath) return idFromPath;
    return filtered[0]?.id ?? null;
  }, [pathname, filtered]);

  const paneTitle = activeType ? documentTypeLabel(activeType) : "Documents";
  const countLabel = isSearchPending
    ? "Searching…"
    : `${filtered.length} document${filtered.length !== 1 ? "s" : ""}`;

  function setRecurringFilter(on: boolean) {
    const params = new URLSearchParams(searchParams.toString());
    if (on) params.set("recurring", "1");
    else params.delete("recurring");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0 flex flex-col">
          <span className="hidden font-heading text-base font-semibold tracking-tight lg:inline">
            {paneTitle}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "inline-flex max-w-full items-center gap-1 rounded-md",
                "-mx-1 px-1 py-0.5 text-left",
                "font-heading text-base font-semibold tracking-tight text-foreground",
                "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "lg:hidden",
              )}
              aria-label="Filter by document type"
            >
              <span className="truncate">{paneTitle}</span>
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-44">
              {DOCUMENT_TYPE_NAV.map((nav) => {
                const navActive =
                  nav.href === "/documents"
                    ? activeType === null
                    : pathname === nav.href ||
                      deriveActiveTypeFromPathname(nav.href) === activeType;
                return (
                  <DropdownMenuItem
                    key={nav.href}
                    render={<Link href={nav.href} />}
                    className={
                      navActive
                        ? "bg-accent text-accent-foreground"
                        : undefined
                    }
                  >
                    {nav.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="truncate text-xs text-muted-foreground lg:mt-0.5">
            {countLabel}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <NewDocumentButton contextType={newDocumentType(activeType)} />
          {listPanel ? (
            <DocumentsListToggle
              collapsed={false}
              onToggle={listPanel.toggle}
              className="hidden lg:inline-flex"
            />
          ) : null}
        </div>
      </div>

      {activeType === "invoice" ? (
        <div className="flex gap-1 border-b border-border px-4 py-2">
          <Button
            type="button"
            variant={!recurringOnly ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setRecurringFilter(false)}
          >
            All
          </Button>
          <Button
            type="button"
            variant={recurringOnly ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setRecurringFilter(true)}
          >
            Recurring
          </Button>
        </div>
      ) : null}

      <div className="border-b border-border px-4 py-2">
        <InputGroup className="h-8 bg-muted/60">
          <InputGroupAddon>
            <Search aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            value={filterQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search documents…"
            aria-label="Search documents"
          />
        </InputGroup>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-3 px-4">
            <p className="text-center text-sm text-muted-foreground">
              {filterQuery.trim()
                ? "No matching documents."
                : recurringOnly
                  ? "No recurring invoices."
                  : "No documents."}
            </p>
            {filterQuery.trim() ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearSearch}
              >
                Clear search
              </Button>
            ) : null}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((d) => (
              <DocumentRow
                key={d.id}
                d={d}
                activeType={activeType}
                recurringSourceIds={recurringSourceIds}
                selectedId={selectedId}
              />
            ))}
          </ul>
        )}
      </div>

      {hasMore ? (
        <div className="border-t border-border p-3">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            size="sm"
            disabled={isLoadingMore}
            onClick={() => void loadMore()}
          >
            {isLoadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
