"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import { campaignColorClass } from "@/lib/marketing/campaign-color";
import { platformIcon } from "@/lib/marketing/platform-icon";
import {
  postStatusDotClass,
  postStatusLabel,
} from "@/lib/marketing/post-display";
import { formatPostTime } from "@/lib/marketing/schedule-utils";
import { cn } from "@/lib/utils";
import type { PostStatus } from "@/lib/validations/content-post";

export type PostChipPost = {
  id: string;
  title: string;
  platform: string;
  status: PostStatus;
  /**
   * Required, not optional: AgendaView feeds these straight into
   * buildAgendaGroups, whose constraint is `{ scheduledAt: Date | string | null }`.
   * An optional property would not satisfy that constraint.
   */
  scheduledAt: Date | string | null;
  campaignId?: string | null;
};

type PostChipProps = {
  post: PostChipPost;
  /** "compact" for month cells, "detailed" for week columns and the agenda. */
  variant?: "compact" | "detailed";
  onClick?: () => void;
  isDragOverlay?: boolean;
  className?: string;
};

/**
 * A single content-calendar post: a campaign colour stripe, the platform icon,
 * the scheduled time, a status dot, and the title.
 *
 * The leading stripe is how campaign membership becomes visible without a
 * colour column on content_campaigns — see lib/marketing/campaign-color.ts.
 * Posts with no campaign get a transparent stripe so every chip keeps the same
 * text alignment.
 *
 * Pure: no dnd hooks. Use DraggablePostChip inside a DndContext.
 */
export function PostChip({
  post,
  variant = "compact",
  onClick,
  isDragOverlay = false,
  className,
}: PostChipProps) {
  const PlatformIcon = platformIcon(post.platform);
  const time = formatPostTime(post.scheduledAt);
  const detailed = variant === "detailed";

  const content = (
    <>
      <span
        className={cn(
          "w-0.5 shrink-0 self-stretch rounded-full",
          campaignColorClass(post.campaignId ?? null),
        )}
        aria-hidden
      />
      <PlatformIcon
        className="size-3 shrink-0 text-muted-foreground"
        aria-hidden
      />
      {time ? (
        <span className="shrink-0 text-[10px] font-medium tabular-nums text-muted-foreground">
          {time}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 truncate text-start text-xs text-foreground">
        {post.title}
      </span>
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          postStatusDotClass(post.status),
        )}
        aria-hidden
      />
    </>
  );

  const baseClass = cn(
    "flex w-full items-center gap-1.5 rounded-md border border-transparent bg-muted/40 px-1.5",
    detailed ? "py-1.5" : "py-1",
    onClick &&
      "transition-colors hover:border-border hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
    isDragOverlay && "border-border bg-card shadow-lg",
    className,
  );

  const label = `${postStatusLabel(post.status)} · ${post.platform}${
    time ? ` · ${time}` : ""
  } · ${post.title}`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={baseClass} aria-label={label}>
        {content}
      </button>
    );
  }

  return (
    <div className={baseClass} aria-label={label}>
      {content}
    </div>
  );
}

/**
 * PostChip wired as a dnd-kit drag source. Must be rendered inside a
 * DndContext.
 *
 * The drag handle is a wrapper element rather than the chip button itself, so
 * the inner button keeps its native click and keyboard activation. The
 * transform is applied via the `style` prop because dnd-kit computes it at
 * runtime — this is the same functional exception the kanban card makes
 * (components/features/tasks/kanban-card.tsx), not decorative styling.
 */
export function DraggablePostChip({
  post,
  variant,
  onClick,
  className,
}: Omit<PostChipProps, "isDragOverlay">) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: post.id });

  // dnd-kit's `attributes` carries `role: "button"` and `tabIndex: 0`. Both are
  // dropped here because the inner PostChip renders a real <button>: keeping
  // them would nest an interactive control inside an ARIA button (an axe
  // violation), add a second tab stop per chip, and make screen readers
  // announce the post title twice. Everything else (aria-roledescription,
  // aria-describedby) is kept so the drag instructions still reach AT.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { role: _role, tabIndex: _tabIndex, ...dragAttributes } = attributes;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn("touch-none", isDragging && "opacity-40")}
      {...dragAttributes}
      {...listeners}
    >
      <PostChip
        post={post}
        variant={variant}
        onClick={onClick}
        className={className}
      />
    </div>
  );
}
