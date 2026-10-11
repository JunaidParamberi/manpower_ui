import { describe, it, expect, vi, beforeEach } from "vitest";

const { revalidateTag } = vi.hoisted(() => ({ revalidateTag: vi.fn() }));
vi.mock("next/cache", () => ({ revalidateTag, revalidatePath: vi.fn() }));

import { invalidateAfterAiAction } from "./invalidate-after-action";

describe("invalidateAfterAiAction", () => {
  beforeEach(() => {
    revalidateTag.mockClear();
  });

  it("revalidates the clients tag for client writes", async () => {
    await invalidateAfterAiAction({
      actions: [{ entity: "clients", entityId: "c1" }],
    });
    expect(revalidateTag).toHaveBeenCalledWith("clients");
    expect(revalidateTag).toHaveBeenCalledWith("dashboard");
    expect(revalidateTag).toHaveBeenCalledWith("notifications");
  });

  it("revalidates the documents + projects tags for a payment", async () => {
    await invalidateAfterAiAction({
      actions: [{ entity: "payments", entityId: "doc-1" }],
    });
    expect(revalidateTag).toHaveBeenCalledWith("documents");
    expect(revalidateTag).toHaveBeenCalledWith("projects");
  });

  it("revalidates the finance tag for a payment so the dashboard isn't stale", async () => {
    await invalidateAfterAiAction({
      actions: [{ entity: "payments", entityId: "doc-1" }],
    });
    expect(revalidateTag).toHaveBeenCalledWith("finance");
  });

  it("revalidates content-posts and content-campaigns for marketing writes", async () => {
    await invalidateAfterAiAction({
      actions: [
        { entity: "content_posts", entityId: "p1" },
        { entity: "content_campaigns", entityId: "c1" },
      ],
    });
    expect(revalidateTag).toHaveBeenCalledWith("content-posts");
    expect(revalidateTag).toHaveBeenCalledWith("content-campaigns");
  });

  it("deduplicates tags across multiple actions", async () => {
    await invalidateAfterAiAction({
      actions: [
        { entity: "clients", entityId: "c1" },
        { entity: "clients", entityId: "c2" },
      ],
    });
    const calls = (revalidateTag as unknown as ReturnType<typeof vi.fn>).mock.calls.filter(
      (c) => c[0] === "clients",
    );
    expect(calls.length).toBe(1);
  });

  it("always revalidates ai-thread so cached thread history isn't truncated on reload", async () => {
    const result = await invalidateAfterAiAction({ actions: [] });
    expect(revalidateTag).toHaveBeenCalledWith("ai-thread");
    expect(result.tags).toEqual(expect.arrayContaining(["ai-thread"]));
  });

  it("maps each entity to the tags its query module actually caches with", async () => {
    const cases: Array<[string, string[]]> = [
      ["services", ["services"]],
      ["time_entries", ["projects", "time", "project-profitability"]],
      ["documents", ["documents", "finance", "project-profitability"]],
      ["expenses", ["expenses", "finance", "project-profitability"]],
      ["payments", ["documents", "projects", "finance", "project-profitability"]],
    ];

    for (const [entity, expected] of cases) {
      revalidateTag.mockClear();
      const result = await invalidateAfterAiAction({
        actions: [{ entity, entityId: "x1" }],
      });
      expect(result.tags).toEqual(expect.arrayContaining(expected));
    }
  });

  it("returns the list of tags it revalidated", async () => {
    const result = await invalidateAfterAiAction({
      actions: [{ entity: "projects", entityId: "p1" }],
    });
    expect(result.tags).toEqual(expect.arrayContaining(["projects", "dashboard", "notifications"]));
  });
});
