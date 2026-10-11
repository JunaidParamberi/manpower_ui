"use client";

import {
  PostChip,
  type PostChipPost,
} from "@/components/features/marketing/post-chip";
import { buildAgendaGroups } from "@/lib/marketing/agenda";

const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MONTH_LABELS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "Monday, 15 Jun" from a YYYY-MM-DD local day key. */
function dayHeading(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return `${WEEKDAY_LABELS[date.getDay()]}, ${day} ${
    MONTH_LABELS_SHORT[month - 1]
  }`;
}

type AgendaViewProps = {
  posts: PostChipPost[];
  onPostClick: (post: PostChipPost) => void;
};

/**
 * Chronological list of the period's posts, grouped by day.
 *
 * Replaces the old status-section list, which mapped over every status
 * unconditionally and printed an empty "No posts yet." section for each one —
 * a sparse month showed four dead rows. Only days that actually have posts
 * become groups here, and the caller renders the empty state when there is
 * nothing at all.
 */
export function AgendaView({ posts, onPostClick }: AgendaViewProps) {
  const { days, unscheduled } = buildAgendaGroups(posts);

  return (
    <div className="flex flex-col gap-5">
      {days.map((day) => (
        <section key={day.iso} className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-foreground">
            {dayHeading(day.iso)}{" "}
            <span className="text-muted-foreground">({day.posts.length})</span>
          </h2>
          <div className="flex flex-col gap-1.5">
            {day.posts.map((post) => (
              <PostChip
                key={post.id}
                post={post}
                variant="detailed"
                onClick={() => onPostClick(post)}
              />
            ))}
          </div>
        </section>
      ))}

      {unscheduled.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-foreground">
            Unscheduled{" "}
            <span className="text-muted-foreground">({unscheduled.length})</span>
          </h2>
          <div className="flex flex-col gap-1.5">
            {unscheduled.map((post) => (
              <PostChip
                key={post.id}
                post={post}
                variant="detailed"
                onClick={() => onPostClick(post)}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
