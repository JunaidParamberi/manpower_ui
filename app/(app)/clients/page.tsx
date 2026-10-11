import Link from "next/link";
import { Plus } from "lucide-react";

import { listClientsOverview } from "@/lib/clients/clients-overview-queries";
import { pickMostRecentlyActiveClient } from "@/lib/clients/active-client";
import { parseClientTab } from "@/lib/clients/client-tab";
import { ClientDetail } from "@/components/features/clients/detail/client-detail";
import { Button } from "@/components/ui/button";

type PageProps = {
  searchParams: Promise<{ tab?: string | string[] }>;
};

export default async function ClientsPage({ searchParams }: PageProps) {
  const [result, { tab }] = await Promise.all([listClientsOverview(), searchParams]);
  const clients = result.ok ? result.clients : [];

  if (clients.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-start gap-3 px-4 pt-6 sm:px-6 lg:px-7">
        <h2 className="text-card-title">No clients yet</h2>
        <p className="max-w-md text-body text-[var(--fg-3)]">
          Add a client to see what they owe, how they pay and the work you have with them.
        </p>
        <Button size="sm" nativeButton={false} render={<Link href="/clients/new" />}>
          <Plus />
          Add your first client
        </Button>
      </div>
    );
  }

  const mostRecent = pickMostRecentlyActiveClient(clients);
  return mostRecent ? <ClientDetail id={mostRecent.id} tab={parseClientTab(tab)} /> : null;
}
