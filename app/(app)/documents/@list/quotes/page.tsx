import { DocumentsListSlot } from "@/components/features/documents/documents-list-slot";

// One slot page per children route segment. A catch-all slot segment does NOT
// match the static segments that exist on the children side, so the structure
// is mirrored literally — see @list/default.tsx.
export default async function QuotesListSlotPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; recurring?: string; list?: string }>;
}) {
  return <DocumentsListSlot slug="quotes" searchParams={await searchParams} />;
}
