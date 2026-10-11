import type { Metadata } from "next";

import { ClientDetail } from "@/components/features/clients/detail/client-detail";
import { getClientById } from "@/lib/clients/actions";
import { parseClientTab } from "@/lib/clients/client-tab";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const client = await getClientById(id);
  return { title: client?.name ?? "Client" };
}

export default async function ClientDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, { tab }] = await Promise.all([params, searchParams]);
  return <ClientDetail id={id} tab={parseClientTab(tab)} />;
}
