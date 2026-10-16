import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath, revalidateTag } from "next/cache";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { createWorker, deleteWorker } from "./worker-mutations";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn: unknown) => fn),
}));
vi.mock("@/lib/supabase/get-server-context", () => ({ getServerContext: vi.fn() }));

function chain(result: { data: unknown; error: unknown }) {
  const q: Record<string, unknown> = {};
  q.insert = vi.fn(() => q);
  q.update = vi.fn(() => q);
  q.delete = vi.fn(() => q);
  q.select = vi.fn(() => q);
  q.eq = vi.fn(() => q);
  q.single = vi.fn(async () => result);
  return q;
}

describe("createWorker", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects an empty employee_id/name", async () => {
    const supabase = { from: vi.fn(() => chain({ data: null, error: null })) };
    vi.mocked(getServerContext).mockResolvedValue({
      supabase: supabase as never,
      user: { id: "u1" } as never,
    });
    const result = await createWorker({ employee_id: "", name: "" });
    expect(result.ok).toBe(false);
  });

  it("surfaces a duplicate employee_id as a clean error, not a raw 23505", async () => {
    const supabase = {
      from: vi.fn(() => chain({ data: null, error: { code: "23505", message: "duplicate key value violates unique constraint" } })),
    };
    vi.mocked(getServerContext).mockResolvedValue({
      supabase: supabase as never,
      user: { id: "u1" } as never,
    });
    const result = await createWorker({ employee_id: "EMP/2026/0001", name: "Test" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("An employee with this ID already exists.");
    }
  });

  it("creates a worker with no document files attached", async () => {
    const row = { id: "w1", user_id: "u1", employee_id: "EMP/2026/0099", name: "Test", status: "available" };
    const supabase = { from: vi.fn(() => chain({ data: row, error: null })) };
    vi.mocked(getServerContext).mockResolvedValue({
      supabase: supabase as never,
      user: { id: "u1" } as never,
    });
    const result = await createWorker({ employee_id: "EMP/2026/0099", name: "Test" });
    expect(result.ok).toBe(true);
  });
});

describe("deleteWorker", () => {
  it("rejects an invalid id", async () => {
    const result = await deleteWorker("not-a-uuid");
    expect(result.ok).toBe(false);
  });
});
