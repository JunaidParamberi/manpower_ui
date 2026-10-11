import { describe, expect, it } from "vitest";
import { parseContentPost, POST_STATUSES } from "./content-post";

describe("parseContentPost", () => {
  const base = { title: "Launch teaser", platform: "Instagram", caption: "Hi", status: "idea" as const };

  it("accepts a minimal valid idea post", () => {
    const r = parseContentPost(base);
    expect(r.ok).toBe(true);
  });

  it("rejects an unknown status", () => {
    const r = parseContentPost({ ...base, status: "live" });
    expect(r.ok).toBe(false);
  });

  it("defaults hashtags and media to empty arrays", () => {
    const r = parseContentPost(base);
    if (!r.ok) throw new Error("expected ok");
    expect(r.data.hashtags).toEqual([]);
    expect(r.data.media).toEqual([]);
  });

  it("requires scheduled_at when status is scheduled", () => {
    const r = parseContentPost({ ...base, status: "scheduled", scheduledAt: null });
    expect(r.ok).toBe(false);
  });

  it("exposes the four statuses in order", () => {
    expect(POST_STATUSES).toEqual(["idea", "drafted", "scheduled", "posted"]);
  });
});
