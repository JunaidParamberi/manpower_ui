import { DocumentsListSlot } from "@/components/features/documents/documents-list-slot";

export default async function DocumentsListSlotPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; recurring?: string; list?: string }>;
}) {
  return <DocumentsListSlot searchParams={await searchParams} />;
}
