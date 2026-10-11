import { DocumentsListSlot } from "@/components/features/documents/documents-list-slot";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Mirrors the children `[id]` detail route. The segment is a document id, not
 * a type slug, so the active type tab comes from `?list=` — which is exactly
 * what `documentDetailHref` puts there when a row is opened from a type tab.
 *
 * The uuid guard is load-bearing, and not about validation. Slot trees resolve
 * INDEPENDENTLY of the children tree: a future children segment with no slot
 * page of its own — `/documents/archived`, say — does not fall through to
 * `default.tsx`, it matches THIS route. Without the guard `typeFromSlug`
 * would return null for it and the pane would render the unfiltered
 * all-documents list beside a filtered detail pane — the same plausible-but-
 * wrong list that made this task's first attempt pass every check while doing
 * nothing. Rendering null instead makes that a visibly empty aside.
 * `lib/documents/document-route-slot-parity.test.ts` catches it earlier still.
 *
 * This also covers `/documents/new`, whose segment is not a uuid: it renders
 * nothing here rather than firing a list query whose result is discarded
 * (the shell is full-bleed on that route and never shows the aside).
 */
export default async function DocumentDetailListSlotPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; recurring?: string; list?: string }>;
}) {
  const [{ id }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  if (!UUID_RE.test(id)) return null;
  return <DocumentsListSlot slug={id} searchParams={resolvedSearchParams} />;
}
