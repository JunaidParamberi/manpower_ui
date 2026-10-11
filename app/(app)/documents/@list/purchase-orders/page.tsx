import { DocumentsListSlot } from "@/components/features/documents/documents-list-slot";

// One slot page per children route segment. A catch-all slot segment does NOT
// match the static segments that exist on the children side, so the structure
// is mirrored literally — see @list/default.tsx.
export default async function PurchaseOrdersListSlotPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; recurring?: string; list?: string }>;
}) {
  return <DocumentsListSlot slug="purchase-orders" searchParams={await searchParams} />;
}
