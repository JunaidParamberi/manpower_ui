import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAutosaveQueue, type SaveResult } from "./autosave-queue";

const ok = (): Promise<SaveResult> => Promise.resolve({ ok: true });

describe("autosave queue", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("debounces and keeps only the last write per key", async () => {
    const q = createAutosaveQueue({ delayMs: 600 });
    const first = vi.fn(ok);
    const second = vi.fn(ok);
    q.schedule("meta", first);
    q.schedule("meta", second);
    expect(q.hasPending()).toBe(true);
    await vi.advanceTimersByTimeAsync(600);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
    expect(q.getStatus()).toBe("saved");
  });

  it("runs immediate writes without waiting", async () => {
    const q = createAutosaveQueue({ delayMs: 600 });
    const run = vi.fn(ok);
    q.schedule("client", run, { immediate: true });
    await vi.advanceTimersByTimeAsync(0);
    expect(run).toHaveBeenCalledOnce();
  });

  it("flush sends pending writes now and reports success", async () => {
    const q = createAutosaveQueue({ delayMs: 600 });
    const run = vi.fn(ok);
    q.schedule("notes", run);
    const done = q.flush();
    await vi.advanceTimersByTimeAsync(0);
    await expect(done).resolves.toBe(true);
    expect(run).toHaveBeenCalledOnce();
    expect(q.hasPending()).toBe(false);
  });

  it("runs different keys in order, one at a time", async () => {
    const q = createAutosaveQueue({ delayMs: 0 });
    const order: string[] = [];
    q.schedule("a", async () => { order.push("a"); return { ok: true }; });
    q.schedule("b", async () => { order.push("b"); return { ok: true }; });
    await q.flush();
    expect(order).toEqual(["a", "b"]);
  });

  it("reports errors, keeps the job, and retry re-runs it", async () => {
    const q = createAutosaveQueue({ delayMs: 0 });
    const run = vi.fn<() => Promise<SaveResult>>()
      .mockResolvedValueOnce({ ok: false, error: "Network down" })
      .mockResolvedValueOnce({ ok: true });
    q.schedule("meta", run);
    await expect(q.flush()).resolves.toBe(false);
    expect(q.getStatus()).toBe("error");
    expect(q.getError()).toBe("Network down");
    await expect(q.retry()).resolves.toBe(true);
    expect(q.getStatus()).toBe("saved");
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("treats a thrown run as an error", async () => {
    const q = createAutosaveQueue({ delayMs: 0 });
    q.schedule("x", () => Promise.reject(new Error("boom")));
    await expect(q.flush()).resolves.toBe(false);
    expect(q.getError()).toBe("boom");
  });

  it("tracks whether anything was ever written", () => {
    const q = createAutosaveQueue();
    expect(q.hasWritten()).toBe(false);
    q.schedule("x", ok);
    expect(q.hasWritten()).toBe(true);
  });

  it("notifies subscribers on status changes", async () => {
    const q = createAutosaveQueue({ delayMs: 0 });
    const seen: string[] = [];
    q.subscribe(() => seen.push(q.getStatus()));
    q.schedule("x", ok);
    await q.flush();
    expect(seen).toContain("saving");
    expect(seen.at(-1)).toBe("saved");
  });

  it("sends the latest text when a key is rewritten mid-save", async () => {
    const q = createAutosaveQueue({ delayMs: 0 });
    const sent: string[] = [];
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => { release = r; });
    q.schedule("notes", async () => { sent.push("v1"); await gate; return { ok: true }; });
    const first = q.flush();
    await vi.advanceTimersByTimeAsync(0);
    q.schedule("notes", async () => { sent.push("v2"); return { ok: true }; });
    release();
    await first;
    await q.flush();
    expect(sent).toEqual(["v1", "v2"]);
    expect(q.hasPending()).toBe(false);
  });

  it("keeps saving other keys after one is rejected", async () => {
    const q = createAutosaveQueue({ delayMs: 0 });
    const sent: string[] = [];
    q.schedule("bad", async () => ({ ok: false, error: "Quantity must be positive" }));
    q.schedule("good", async () => { sent.push("good"); return { ok: true }; });
    await expect(q.flush()).resolves.toBe(false);
    expect(sent).toEqual(["good"]);
    expect(q.getStatus()).toBe("error");
    expect(q.getError()).toBe("Quantity must be positive");
  });

  it("sends pending writes when disposed instead of dropping them", async () => {
    const q = createAutosaveQueue({ delayMs: 600 });
    const run = vi.fn(ok);
    q.schedule("notes", run);
    q.dispose();
    await vi.advanceTimersByTimeAsync(0);
    expect(run).toHaveBeenCalledOnce();
  });
});
