import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidateTag } from "next/cache";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { createProjectClient, deleteProjectClient } from "./project-client-mutations";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn: unknown) => fn),
}));

vi.mock("@/lib/supabase/get-server-context", () => ({
  getServerContext: vi.fn(),
}));

function chain(result: { data: unknown; error: unknown }) {
  const q: Record<string, unknown> = {};
  q.insert = vi.fn(() => q);
  q.select = vi.fn(() => q);
  q.eq = vi.fn(() => q);
  q.single = vi.fn(async () => result);
  return q;
}

describe("createProjectClient", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects an empty name", async () => {
    const supabase = { from: vi.fn(() => chain({ data: null, error: null })) };
    vi.mocked(getServerContext).mockResolvedValue({
      supabase: supabase as never,
      user: { id: "u1" } as never,
    });
    const result = await createProjectClient({ name: "" });
    expect(result.ok).toBe(false);
  });

  it("creates and revalidates", async () => {
    const row = { id: "c1", user_id: "u1", name: "GCS" };
    const supabase = { from: vi.fn(() => chain({ data: row, error: null })) };
    vi.mocked(getServerContext).mockResolvedValue({
      supabase: supabase as never,
      user: { id: "u1" } as never,
    });
    const result = await createProjectClient({ name: "GCS" });
    expect(result.ok).toBe(true);
    expect(revalidateTag).toHaveBeenCalledWith("project_clients");
  });

  it("surfaces a duplicate client_code as a clean error, not a raw 23505", async () => {
    const supabase = {
      from: vi.fn(() => chain({ data: null, error: { code: "23505", message: "duplicate key value violates unique constraint" } })),
    };
    vi.mocked(getServerContext).mockResolvedValue({
      supabase: supabase as never,
      user: { id: "u1" } as never,
    });
    const result = await createProjectClient({ name: "GCS", client_code: "CLI-1" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("A client with this ID already exists.");
    }
  });
});

describe("deleteProjectClient", () => {
  it("rejects an invalid id", async () => {
    const result = await deleteProjectClient("not-a-uuid");
    expect(result.ok).toBe(false);
  });
});
