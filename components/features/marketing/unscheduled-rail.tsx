"use client";

import { useDroppable } from "@dnd-kit/core";
import { Inbox } from "lucide-react";

import {
  DraggablePostChip,
  PostChip,
  type PostChipPost,
} from "@/components/features/marketing/post-chip";
import { cn } from "@/lib/utils";

/** dnd-kit id for the rail as a drop target. Dropping here clears the date. */
export const UNSCHEDULED_DROP_ID = "unscheduled";

type UnscheduledRailProps = {
  posts: PostChipPost[];
  onPostClick: (post: PostChipPost) => void;
  draggable?: boolean;
  dropRef?: (node: HTMLElement | null) => void;
  isOver?: boolean;
};

/**
 * Horizontal rail of posts that have no scheduled date.
 *
 * These posts were previously invisible: the month query fetched them and the
 * day-bucketing silently discarded them, so an idea saved without a date
 * vanished. The rail gives them a home, and doubles as a drop target — drag a
 * post here to clear its date and send it back to the idea queue.
 *
 * Renders nothing when empty and not receiving a drag, so it costs no vertical
 * space on a fully-scheduled month.
 */
export function UnscheduledRail({
  posts,
  onPostClick,
  draggable = false,
  dropRef,
  isOver = false,
}: UnscheduledRailProps) {
  if (posts.length === 0 && !isOver) {
    return null;
  }

  const Chip = draggable ? DraggablePostChip : PostChip;

  return (
    <div
      ref={dropRef}
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-dashed border-border bg-[var(--bg-subtle)] p-2.5 transition-colors",
        isOver && "border-primary/40 bg-muted",
      )}
    >
      <div className="flex items-center gap-1.5">
        <Inbox className="size-3.5 text-muted-foreground" aria-hidden />
        <p className="text-xs font-medium text-foreground">
          Unscheduled{" "}
          <span className="text-muted-foreground">({posts.length})</span>
        </p>
        <p className="ms-auto hidden text-[11px] text-muted-foreground sm:block">
          Drag onto a day to schedule
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="px-1 py-2 text-xs text-muted-foreground">
          Drop a post here to clear its date.
        </p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {posts.map((post) => (
            <div key={post.id} className="w-52 shrink-0">
              <Chip
                post={post}
                variant="detailed"
                onClick={() => onPostClick(post)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** UnscheduledRail wired as a drop target. Must be inside a DndContext. */
export function DroppableUnscheduledRail(
  props: Omit<UnscheduledRailProps, "dropRef" | "isOver">,
) {
  const { setNodeRef, isOver } = useDroppable({ id: UNSCHEDULED_DROP_ID });
  return <UnscheduledRail {...props} dropRef={setNodeRef} isOver={isOver} />;
}
