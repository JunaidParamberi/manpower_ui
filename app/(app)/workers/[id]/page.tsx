import type { Metadata } from "next";
import { WorkerDetail } from "@/components/features/workers/detail/worker-detail";
import { parseWorkerTab } from "@/lib/workers/worker-tab";
import { getWorkerById } from "@/lib/workers/worker-queries";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const worker = await getWorkerById(id);
  return { title: worker?.name ?? "Worker" };
}

export default async function WorkerDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, { tab }] = await Promise.all([params, searchParams]);
  return <WorkerDetail id={id} tab={parseWorkerTab(tab)} />;
}
