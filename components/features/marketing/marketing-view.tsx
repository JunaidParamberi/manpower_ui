"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CalendarPlus, Plus, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { AgendaView } from "@/components/features/marketing/agenda-view";
import { CampaignDialog } from "@/components/features/marketing/campaign-dialog";
import { CampaignLegend } from "@/components/features/marketing/campaign-legend";
import { ContentPostDialog } from "@/components/features/marketing/content-post-dialog";
import { MarketingFilterBar } from "@/components/features/marketing/marketing-filter-bar";
import { MarketingSummaryStrip } from "@/components/features/marketing/marketing-summary-strip";
import {
  DraggablePostChip,
  PostChip,
  type PostChipPost,
} from "@/components/features/marketing/post-chip";
import {
  DroppableUnscheduledRail,
  UNSCHEDULED_DROP_ID,
  UnscheduledRail,
} from "@/components/features/marketing/unscheduled-rail";
import { EmptyStateCard } from "@/components/shared/empty-state-card";
import { MonthCalendar } from "@/components/shared/month-calendar/month-calendar";
import { PageHeader } from "@/components/shared/page-header";
import { WeekCalendar } from "@/components/shared/month-calendar/week-calendar";
import { Button } from "@/components/ui/button";
import { deleteCampaign } from "@/lib/marketing/campaign-actions";
import type { CampaignRow } from "@/lib/marketing/campaign-queries";
import { monthLabel, weekRangeLabel } from "@/lib/marketing/calendar-utils";
import { rescheduleContentPost } from "@/lib/marketing/content-post-actions";
import type { ContentPostRow } from "@/lib/marketing/content-post-queries";
import type { MarketingViewParams } from "@/lib/marketing/marketing-view-params";
import { moveScheduledAtToDay } from "@/lib/marketing/schedule-utils";

type MarketingViewProps = {
  params: MarketingViewParams;
  /** Posts in the visible month or week, unfiltered. */
  periodPosts: ContentPostRow[];
  unscheduledPosts: ContentPostRow[];
  campaigns: CampaignRow[];
  clients: Array<{ id: string; name: string }>;
};

type DialogState =
  | { open: false }
  | { open: true; post?: ContentPostRow; defaultDate?: string };

function toChip(post: ContentPostRow): PostChipPost {
  return {
    id: post.id,
    title: post.title,
    platform: post.platform,
    status: post.status,
    scheduledAt: post.scheduledAt,
    campaignId: post.campaignId,
  };
}

/**
 * Pointer-accurate collision detection: a drop only counts when the pointer is
 * genuinely inside a droppable, so releasing over the page header or the filter
 * bar is a real no-op instead of snapping to the nearest day cell (which is
 * what closestCenter did). Falls back to rect intersection when there is no
 * pointer coordinate to test against.
 */
const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  return pointerCollisions.length > 0
    ? pointerCollisions
    : rectIntersection(args);
};

function parseMonth(month: string): { year: number; month0: number } {
  const [year, month1] = month.split("-").map(Number);
  return { year, month0: month1 - 1 };
}

/**
 * The /marketing page body.
 *
 * No co-located Storybook story: this is pure orchestration wired directly to
 * server actions (rescheduleContentPost, deleteCampaign, and the create/update
 * actions behind ContentPostDialog and CampaignDialog), to the Next.js router,
 * and to live URL-param-driven state — none of which can be safely mocked in
 * Storybook without duplicating real backend and routing logic. Every child it
 * composes (MarketingSummaryStrip, MarketingFilterBar, CampaignLegend,
 * UnscheduledRail, MonthCalendar, WeekCalendar, AgendaView, PostChip) carries
 * full Storybook coverage; story those instead. Same carve-out CampaignDialog
 * documents.
 */
export function MarketingView({
  params,
  periodPosts,
  unscheduledPosts,
  campaigns,
  clients,
}: MarketingViewProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Pointer only, matching TasksKanbanBoard. Keyboard rescheduling is done
  // through the post dialog's date field, not through drag: a working keyboard
  // drag would need a custom `coordinateGetter` plus a real activator node on
  // the chip, and without one the sensor swallows the chip button's native
  // Enter/Space activation. Reinstating it is a separate task.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Local copies so a drop can move a chip immediately and roll back if the
  // server rejects it. Re-synced whenever the server sends fresh props.
  const [posts, setPosts] = useState(periodPosts);
  const [unscheduled, setUnscheduled] = useState(unscheduledPosts);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>({ open: false });
  const [campaignOpen, setCampaignOpen] = useState(false);

  // dnd-kit must not run during SSR or the pre-hydration render. Same guard as
  // TasksKanbanBoard.
  const [dndReady, setDndReady] = useState(false);
  useEffect(() => {
    setDndReady(true);
  }, []);

  useEffect(() => {
    setPosts(periodPosts);
  }, [periodPosts]);

  useEffect(() => {
    setUnscheduled(unscheduledPosts);
  }, [unscheduledPosts]);

  function matchesFilters(post: ContentPostRow): boolean {
    if (params.client !== "all" && post.clientId !== params.client) return false;
    if (params.platform !== "all" && post.platform !== params.platform) {
      return false;
    }
    if (params.status !== "all" && post.status !== params.status) return false;
    if (params.campaign !== "all" && post.campaignId !== params.campaign) {
      return false;
    }
    return true;
  }

  const filteredPosts = useMemo(
    () => posts.filter(matchesFilters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [posts, params.client, params.platform, params.status, params.campaign],
  );

  const filteredUnscheduled = useMemo(
    () => unscheduled.filter(matchesFilters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      unscheduled,
      params.client,
      params.platform,
      params.status,
      params.campaign,
    ],
  );

  // Sorted, not insertion-ordered: without this the platform dropdown
  // reshuffles every time a post moves between the scheduled and unscheduled
  // lists.
  const postPlatforms = useMemo(
    () =>
      Array.from(
        new Set([...posts, ...unscheduled].map((post) => post.platform)),
      )
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [posts, unscheduled],
  );

  const allById = useMemo(() => {
    const map = new Map<string, ContentPostRow>();
    for (const post of [...posts, ...unscheduled]) map.set(post.id, post);
    return map;
  }, [posts, unscheduled]);

  const activePost = activeId ? allById.get(activeId) : undefined;

  function handleNavigate(href: string) {
    router.push(href);
  }

  function openEdit(post: PostChipPost) {
    const full = allById.get(post.id);
    if (full) setDialog({ open: true, post: full });
  }

  function openCreate(defaultDate?: string) {
    setDialog({ open: true, defaultDate });
  }

  function handleDeleteCampaign(campaign: CampaignRow) {
    const confirmed = window.confirm(
      `Delete the campaign "${campaign.name}"? Its ${campaign.postCount} post(s) will be kept, but will no longer be grouped under it.`,
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteCampaign(campaign.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Campaign deleted");
      router.refresh();
    });
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const postId = String(active.id);
    const overId = String(over.id);
    const post = allById.get(postId);
    if (!post) return;

    const targetIso = overId.startsWith("day:") ? overId.slice(4) : null;
    const toUnscheduled = overId === UNSCHEDULED_DROP_ID;
    if (!targetIso && !toUnscheduled) return;

    const nextScheduledAt = targetIso
      ? moveScheduledAtToDay(post.scheduledAt, targetIso)
      : null;

    // No-op drops (dropped back on the day it came from, or back on the rail
    // it came from) must not round-trip to the server.
    if (
      (nextScheduledAt === null && post.scheduledAt === null) ||
      (nextScheduledAt !== null &&
        post.scheduledAt !== null &&
        new Date(post.scheduledAt).toISOString() === nextScheduledAt)
    ) {
      return;
    }

    const previousPosts = posts;
    const previousUnscheduled = unscheduled;
    const moved: ContentPostRow = { ...post, scheduledAt: nextScheduledAt };

    // Optimistic move between the two lists.
    if (nextScheduledAt === null) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setUnscheduled((prev) => [moved, ...prev.filter((p) => p.id !== postId)]);
    } else {
      setUnscheduled((prev) => prev.filter((p) => p.id !== postId));
      setPosts((prev) => [...prev.filter((p) => p.id !== postId), moved]);
    }

    startTransition(async () => {
      const result = await rescheduleContentPost(postId, nextScheduledAt);
      if (!result.ok) {
        setPosts(previousPosts);
        setUnscheduled(previousUnscheduled);
        toast.error(result.message);
        return;
      }
      // The server may have changed more than the date: clearing the date
      // demotes a "scheduled"/"posted" post to "drafted". Adopt the returned
      // row so the status dot is correct immediately, not one refresh later.
      const saved = result.post;
      const adopt = (prev: ContentPostRow[]) =>
        prev.map((p) => (p.id === saved.id ? saved : p));
      setPosts(adopt);
      setUnscheduled(adopt);
      router.refresh();
    });
  }

  const { year, month0 } = parseMonth(params.month);
  const periodLabel =
    params.view === "week" ? weekRangeLabel(params.week) : monthLabel(params.month);

  const isEmpty =
    filteredPosts.length === 0 && filteredUnscheduled.length === 0;

  const renderChip = (post: ContentPostRow, variant: "compact" | "detailed") =>
    dndReady ? (
      <DraggablePostChip
        post={toChip(post)}
        variant={variant}
        onClick={() => openEdit(toChip(post))}
      />
    ) : (
      <PostChip
        post={toChip(post)}
        variant={variant}
        onClick={() => openEdit(toChip(post))}
      />
    );

  const calendar =
    params.view === "week" ? (
      <WeekCalendar<ContentPostRow>
        weekAnchor={params.week}
        events={filteredPosts}
        eventId={(post) => post.id}
        eventDate={(post) => post.scheduledAt}
        renderEvent={(post) => renderChip(post, "detailed")}
        onDayAdd={openCreate}
        droppable={dndReady}
      />
    ) : (
      <MonthCalendar<ContentPostRow>
        year={year}
        month0={month0}
        events={filteredPosts}
        eventId={(post) => post.id}
        eventDate={(post) => post.scheduledAt}
        renderEvent={(post) => renderChip(post, "compact")}
        onDayAdd={openCreate}
        droppable={dndReady}
      />
    );

  const body =
    params.view === "agenda" ? (
      <AgendaView
        posts={[...filteredPosts, ...filteredUnscheduled].map(toChip)}
        onPostClick={openEdit}
      />
    ) : (
      <>
        {dndReady ? (
          <DroppableUnscheduledRail
            posts={filteredUnscheduled.map(toChip)}
            onPostClick={openEdit}
            draggable
          />
        ) : (
          <UnscheduledRail
            posts={filteredUnscheduled.map(toChip)}
            onPostClick={openEdit}
          />
        )}
        {calendar}
      </>
    );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Marketing"
        description="Plan, draft, and schedule content for you and your clients."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setCampaignOpen(true)}
            >
              <Sparkles className="size-3.5" aria-hidden />
              New campaign
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={() => openCreate()}
            >
              <Plus className="size-3.5" aria-hidden />
              New post
            </Button>
          </>
        }
      />

      {/* Unscheduled posts are counted too: they are visible in the rail, so
          leaving them out would make the Ideas tile read 0 while ideas sit on
          screen. */}
      <MarketingSummaryStrip posts={[...posts, ...unscheduled]} params={params} />

      <MarketingFilterBar
        params={params}
        clients={clients}
        postPlatforms={postPlatforms}
        onNavigate={handleNavigate}
      />

      <CampaignLegend
        campaigns={campaigns}
        params={params}
        onNavigate={handleNavigate}
        onDelete={handleDeleteCampaign}
      />

      {isEmpty ? (
        <EmptyStateCard
          icon={CalendarPlus}
          title={`Nothing planned for ${periodLabel}`}
          description="Add a post to any day, or let AI generate a whole campaign of drafts across a date range."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button type="button" size="sm" onClick={() => openCreate()}>
                New post
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => setCampaignOpen(true)}
              >
                <Sparkles className="size-3.5" aria-hidden />
                Generate a campaign
              </Button>
            </div>
          }
        />
      ) : null}

      {dndReady ? (
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-col gap-3">{body}</div>
          <DragOverlay>
            {activePost ? (
              <div className="w-52">
                <PostChip post={toChip(activePost)} isDragOverlay />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div
          className="flex flex-col gap-3"
          aria-busy="true"
          aria-label="Loading calendar interactions"
        >
          {body}
        </div>
      )}

      <ContentPostDialog
        open={dialog.open}
        onOpenChange={(open) => {
          if (!open) setDialog({ open: false });
        }}
        post={dialog.open ? dialog.post : undefined}
        defaultDate={dialog.open ? dialog.defaultDate : undefined}
        clients={clients}
      />

      <CampaignDialog
        open={campaignOpen}
        onOpenChange={setCampaignOpen}
        clients={clients}
      />
    </div>
  );
}
