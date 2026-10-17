// lib/suppliers/supplier-mutations.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath, revalidateTag } from "next/cache";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { createSupplier, deleteSupplier } from "./supplier-mutations";

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
  q.update = vi.fn(() => q);
  q.select = vi.fn(() => q);
  q.eq = vi.fn(() => q);
  q.single = vi.fn(async () => result);
  return q;
}

describe("createSupplier", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects when unauthenticated", async () => {
    vi.mocked(getServerContext).mockResolvedValue({ supabase: null, user: null } as never);
    const result = await createSupplier({ name: "Acme" });
    expect(result.ok).toBe(false);
  });

  it("rejects an empty name", async () => {
    const supabase = { from: vi.fn(() => chain({ data: null, error: null })) };
    vi.mocked(getServerContext).mockResolvedValue({
      supabase: supabase as never,
      user: { id: "u1" } as never,
    });
    const result = await createSupplier({ name: "" });
    expect(result.ok).toBe(false);
  });

  it("creates a supplier and revalidates", async () => {
    const row = { id: "s1", user_id: "u1", name: "Acme", supplier_code: "" };
    const supabase = { from: vi.fn(() => chain({ data: row, error: null })) };
    vi.mocked(getServerContext).mockResolvedValue({
      supabase: supabase as never,
      user: { id: "u1" } as never,
    });
    const result = await createSupplier({ name: "Acme" });
    expect(result.ok).toBe(true);
    expect(revalidateTag).toHaveBeenCalledWith("suppliers");
    expect(revalidatePath).toHaveBeenCalledWith("/suppliers");
  });

  it("surfaces a duplicate supplier_code as a clean error, not a raw 23505", async () => {
    const supabase = {
      from: vi.fn(() => chain({ data: null, error: { code: "23505", message: "duplicate key value violates unique constraint" } })),
    };
    vi.mocked(getServerContext).mockResolvedValue({
      supabase: supabase as never,
      user: { id: "u1" } as never,
    });
    const result = await createSupplier({ name: "Acme", supplier_code: "SUP-1" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("A supplier with this ID already exists.");
    }
  });
});

describe("deleteSupplier", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects an invalid id", async () => {
    const result = await deleteSupplier("not-a-uuid");
    expect(result.ok).toBe(false);
  });

  it("nulls out supplier_id on linked workers before deleting", async () => {
    const workersUpdateEq = vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) }));
    const workersQuery = { update: vi.fn(() => ({ eq: workersUpdateEq })) };
    const suppliersQuery = { delete: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) })) })) };
    const supabase = {
      from: vi.fn((table: string) => (table === "workers" ? workersQuery : suppliersQuery)),
    };
    vi.mocked(getServerContext).mockResolvedValue({
      supabase: supabase as never,
      user: { id: "u1" } as never,
    });
    const id = "11111111-1111-4111-8111-111111111111";
    const result = await deleteSupplier(id);
    expect(result.ok).toBe(true);
    expect(workersQuery.update).toHaveBeenCalledWith({ supplier_id: null });
  });
});
