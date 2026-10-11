import type { PostStatus } from "@/lib/validations/content-post";

/** Tailwind background classes for post status dots, matching the document status dot convention. */
export const POST_STATUS_DOT: Record<PostStatus, string> = {
  idea: "bg-zinc-400",
  drafted: "bg-amber-400",
  scheduled: "bg-blue-400",
  posted: "bg-emerald-500",
};

export const POST_STATUS_LABEL: Record<PostStatus, string> = {
  idea: "Idea",
  drafted: "Drafted",
  scheduled: "Scheduled",
  posted: "Posted",
};

export function postStatusDotClass(status: PostStatus): string {
  return POST_STATUS_DOT[status] ?? "bg-zinc-400";
}

export function postStatusLabel(status: PostStatus): string {
  return POST_STATUS_LABEL[status] ?? status;
}
