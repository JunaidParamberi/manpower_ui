export type ViewMode = "edit" | "read";

/**
 * Which view a document page opens in. Drafts edit unless you chose to see the finished
 * document (`?view=1`, what Done does); anything else reads unless edit is asked for and allowed.
 */
export function pickMode(args: {
  isDraft: boolean;
  wantEdit: boolean;
  wantRead: boolean;
  /** A document that has been sent may still be edited (some fields) or not (settled, voided). */
  canEditWhenSent: boolean;
}): ViewMode {
  if (args.isDraft) return args.wantRead ? "read" : "edit";
  return args.wantEdit && args.canEditWhenSent ? "edit" : "read";
}
