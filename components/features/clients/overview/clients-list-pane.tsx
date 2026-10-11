"use client";

import { usePathname, useRouter, useSearchParams, useSelectedLayoutSegment } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Upload } from "lucide-react";

import type { ClientOverviewRow } from "@/lib/clients/clients-overview-queries";
import { pickMostRecentlyActiveClient } from "@/lib/clients/active-client";
import { countClientLenses, matchesClientLens, parseClientLens, type ClientLens } from "@/lib/clients/client-lens";
import { AddClientButton } from "@/components/features/clients/add-client-button";
import { ClientLensChips } from "@/components/features/clients/overview/client-lens-chips";
import { ClientsListCard } from "@/components/features/clients/overview/clients-list-card";
import { PaneSearchBox } from "@/components/shared/pane-search-box";
import { Button } from "@/components/ui/button";
import type { PlanTier } from "@/config/plans";

type ClientsListPaneProps = {
  clients: ClientOverviewRow[];
  defaultCurrency?: string;
  atLimit: boolean;
  planTier: PlanTier;
  clientLimit: number;
  /** e.g. "AED 214,000.00 lifetime" or "Multiple currencies". */
  revenueLabel: string;
  /** Injectable for stories/tests; defaults to now. */
  nowIso?: string;
};

function clientMatchesQuery(client: ClientOverviewRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    client.name,
    client.contact_name,
    client.company,
    client.email,
    client.billing_email,
    client.phone,
    client.website,
    client.address,
    client.lead_source,
    ...client.tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export function ClientsListPane({
  clients,
  defaultCurrency = "USD",
  atLimit,
  planTier,
  clientLimit,
  revenueLabel,
  nowIso,
}: ClientsListPaneProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeId = useSelectedLayoutSegment();
  const now = useMemo(() => nowIso ?? new Date().toISOString(), [nowIso]);
  // On /clients the page renders the most recently active client; mirror that pick.
  const selectedId = activeId ?? pickMostRecentlyActiveClient(clients)?.id ?? null;
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const lens = parseClientLens(searchParams.get("lens"));
  const queryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (queryTimer.current) clearTimeout(queryTimer.current);
    };
  }, []);

  function setParams(next: { q?: string; lens?: ClientLens }) {
    const params = new URLSearchParams(searchParams.toString());
    // Retired filters from the previous list.
    params.delete("health");
    params.delete("sort");
    if (next.q !== undefined) {
      if (next.q.trim()) params.set("q", next.q.trim());
      else params.delete("q");
    }
    if (next.lens !== undefined) {
      if (next.lens === "all") params.delete("lens");
      else params.set("lens", next.lens);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function onSearch(next: string) {
    setQuery(next);
    if (queryTimer.current) clearTimeout(queryTimer.current);
    queryTimer.current = setTimeout(() => setParams({ q: next }), 250);
  }

  const counts = useMemo(() => countClientLenses(clients, now), [clients, now]);
  const visible = useMemo(
    () => clients.filter((c) => matchesClientLens(c, lens, now) && clientMatchesQuery(c, query)),
    [clients, lens, query, now],
  );

  function goToClient(clientId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tab");
    const qs = params.toString();
    router.push(qs ? `/clients/${clientId}?${qs}` : `/clients/${clientId}`);
  }

  const needsYou = counts["needs-you"];

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div className="flex shrink-0 flex-col gap-3 border-b border-border px-4 pt-4 pb-3.5 sm:px-6 lg:px-7 lg:pt-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="font-heading text-[17px] font-semibold tracking-[-0.01em]">Clients</h1>
            <p className="mt-0.5 truncate text-meta text-[var(--fg-3)]">
              <span className="tabular-nums">{clients.length}</span> client{clients.length === 1 ? "" : "s"} · {revenueLabel}
              {needsYou > 0 ? <span className="font-medium text-[var(--danger)]"> · {needsYou} need you</span> : null}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled
              title="CSV client import is coming soon"
              aria-label="Import clients (coming soon)"
            >
              <Upload />
            </Button>
            <AddClientButton atLimit={atLimit} planTier={planTier} clientLimit={clientLimit} compact />
          </div>
        </div>
        <PaneSearchBox value={query} onChange={onSearch} placeholder="Find a client" ariaLabel="Find a client" />
        <ClientLensChips lens={lens} counts={counts} onChange={(l) => setParams({ lens: l })} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <ClientsListCard
          clients={visible}
          selectedId={selectedId}
          defaultCurrency={defaultCurrency}
          groups={lens === "all" && !query.trim()}
          nowIso={now}
          onClearFilters={() => {
            if (queryTimer.current) clearTimeout(queryTimer.current);
            setQuery("");
            router.replace(pathname, { scroll: false });
          }}
          onSelect={goToClient}
        />
      </div>
    </div>
  );
}
