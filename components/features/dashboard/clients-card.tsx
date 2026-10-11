// components/features/dashboard/clients-card.tsx
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  PanelCard,
  PanelCardBody,
  PanelCardHeader,
  PanelCardList,
  PanelCardRow,
} from "@/components/shared/panel-card";
import { signalKindLabel } from "@/lib/clients/health-display";
import type { ClientFacts } from "@/lib/dashboard/snapshot-types";
import type { HealthBand } from "@/lib/clients/health-facts";
import { cn } from "@/lib/utils";

type ClientsCardProps = { clients: ClientFacts };

const BAND_DOT: Record<HealthBand, string> = {
  excellent: "bg-[var(--success)]",
  healthy: "bg-[var(--fg-3)]",
  needs_attention: "bg-[var(--warning)]",
  at_risk: "bg-[var(--danger)]",
};

export function ClientsCard({ clients }: ClientsCardProps) {
  return (
    <PanelCard>
      <PanelCardHeader title="Clients" />
      {clients.cappedForLiveComputation ? (
        <PanelCardBody>
          <p className="text-body text-muted-foreground">
            Health scoring for more than 25 clients runs on the nightly scan —{" "}
            <Link href="/settings/billing" className="underline underline-offset-4">
              available on Starter
            </Link>
            .
          </p>
        </PanelCardBody>
      ) : clients.clients.length === 0 ? (
        <PanelCardBody>
          <p className="text-body text-muted-foreground">Every client relationship looks healthy.</p>
        </PanelCardBody>
      ) : (
        <PanelCardList>
          {clients.clients.map((client) => (
            <PanelCardRow key={client.clientId} href={`/clients/${client.clientId}`}>
              <span className={cn("size-1.5 shrink-0 rounded-full", BAND_DOT[client.band])} />
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">{client.clientName}</span>
              {client.topSignal ? (
                <Badge variant="outline" className="shrink-0 rounded-full font-normal">
                  {signalKindLabel(client.topSignal.kind)}
                </Badge>
              ) : null}
              <span className="shrink-0 text-meta tabular-nums text-muted-foreground">{client.score}/100</span>
            </PanelCardRow>
          ))}
        </PanelCardList>
      )}
    </PanelCard>
  );
}