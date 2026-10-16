import { beforeEach, describe, expect, it, vi } from "vitest";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { getWorkerById } from "./worker-queries";

vi.mock("next/cache", () => ({ unstable_cache: vi.fn((fn: unknown) => fn) }));
vi.mock("@/lib/supabase/get-server-context", () => ({ getServerContext: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

import { createAdminClient } from "@/lib/supabase/admin";

describe("getWorkerById", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when unauthenticated", async () => {
    vi.mocked(getServerContext).mockResolvedValue({ supabase: null, user: null } as never);
    const result = await getWorkerById("w1");
    expect(result).toBeNull();
  });

  it("returns null when the worker is not found", async () => {
    vi.mocked(getServerContext).mockResolvedValue({ user: { id: "u1" } } as never);
    const q = {
      select: vi.fn(() => q),
      eq: vi.fn(() => q),
      maybeSingle: vi.fn(async () => ({ data: null, error: null })),
    };
    vi.mocked(createAdminClient).mockReturnValue({ from: vi.fn(() => q) } as never);
    const result = await getWorkerById("missing-id");
    expect(result).toBeNull();
  });
});
