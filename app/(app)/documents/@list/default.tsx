/**
 * Rendered when no slot page under `@list` matches the active route.
 *
 * In practice almost nothing reaches here, because slot trees resolve
 * independently of the children tree and `@list/[id]` is a dynamic segment
 * that swallows any single unmatched segment (it renders null unless the
 * segment is a uuid). `/documents/[id]/edit` is the realistic caller, and the
 * shell is full-bleed there, so the aside is not rendered at all.
 *
 * It deliberately renders nothing rather than re-exporting the all-documents
 * index. An earlier version did re-export it, which meant a slot that failed
 * to match a type segment silently served the UNFILTERED list — a plausible
 * looking pane that made a dead feature pass every check. An empty aside is a
 * loud failure; a wrong list is not. Every other guard in this slot tree
 * (`@list/[id]`'s uuid check, the parity test in
 * `lib/documents/document-route-slot-parity.test.ts`) exists for the same
 * reason: never let a routing miss degrade into a believable wrong answer.
 */
export default function DocumentsListSlotDefault() {
  return null;
}
