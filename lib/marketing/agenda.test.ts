import { describe, expect, it } from "vitest";

import { buildAgendaGroups } from "./agenda";

type SamplePost = { id: string; scheduledAt: string | null };

describe("buildAgendaGroups", () => {
  it("groups by local day in chronological order", () => {
    const posts: SamplePost[] = [
      { id: "later", scheduledAt: new Date(2026, 5, 18, 9, 0).toISOString() },
      { id: "earlier", scheduledAt: new Date(2026, 5, 15, 9, 0).toISOString() },
    ];
    const { days } = buildAgendaGroups(posts);
    expect(days.map((d) => d.iso)).toEqual(["2026-06-15", "2026-06-18"]);
    expect(days[0].posts.map((p) => p.id)).toEqual(["earlier"]);
  });

  it("sorts posts inside a day by time", () => {
    const posts: SamplePost[] = [
      { id: "pm", scheduledAt: new Date(2026, 5, 15, 17, 0).toISOString() },
      { id: "am", scheduledAt: new Date(2026, 5, 15, 8, 0).toISOString() },
      { id: "noon", scheduledAt: new Date(2026, 5, 15, 12, 0).toISOString() },
    ];
    const { days } = buildAgendaGroups(posts);
    expect(days).toHaveLength(1);
    expect(days[0].posts.map((p) => p.id)).toEqual(["am", "noon", "pm"]);
  });

  it("puts null-dated posts in their own bucket, never in a day", () => {
    const posts: SamplePost[] = [
      { id: "idea-1", scheduledAt: null },
      { id: "idea-2", scheduledAt: null },
      { id: "dated", scheduledAt: new Date(2026, 5, 15, 9, 0).toISOString() },
    ];
    const { days, unscheduled } = buildAgendaGroups(posts);
    expect(unscheduled.map((p) => p.id)).toEqual(["idea-1", "idea-2"]);
    expect(days.flatMap((d) => d.posts.map((p) => p.id))).toEqual(["dated"]);
  });

  it("emits no empty groups", () => {
    const { days, unscheduled } = buildAgendaGroups<SamplePost>([]);
    expect(days).toEqual([]);
    expect(unscheduled).toEqual([]);
  });
});
