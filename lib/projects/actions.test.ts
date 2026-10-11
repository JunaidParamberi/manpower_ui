import { beforeEach, describe, expect, it, vi } from "vitest";

import { revalidateTag } from "next/cache";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { deleteProject } from "./actions";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}));

vi.mock("@/lib/supabase/get-server-context", () => ({
  getServerContext: vi.fn(),
}));

const USER_ID = "11111111-1111-4111-8111-111111111111";
const PROJECT_ID = "22222222-2222-4222-8222-222222222222";
const CLIENT_ID = "33333333-3333-4333-8333-333333333333";

function createLookupQuery() {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(async () => ({
      data: { client_id: CLIENT_ID },
      error: null,
    })),
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);

  return query;
}

function createDeleteQuery(result: { error: { message: string } | null; count: number | null }) {
  const query = {
    error: result.error,
    count: result.count,
    delete: vi.fn(),
    eq: vi.fn(),
  };

  query.delete.mockReturnValue(query);
  query.eq.mockReturnValue(query);

  return query;
}

describe("deleteProject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("removes a stale pinned project after deleting the project", async () => {
    const lookupQuery = createLookupQuery();
    const projectDeleteQuery = createDeleteQuery({ error: null, count: 1 });
    const pinnedDeleteQuery = createDeleteQuery({ error: null, count: 1 });

    const from = vi
      .fn()
      .mockReturnValueOnce(lookupQuery)
      .mockReturnValueOnce(projectDeleteQuery)
      .mockImplementation((table: string) => {
        expect(table).toBe("pinned_items");
        return pinnedDeleteQuery;
      });

    vi.mocked(getServerContext).mockResolvedValue({
      supabase: { from } as never,
      user: { id: USER_ID, email: "test@example.com" },
    });

    const result = await deleteProject(PROJECT_ID);

    expect(result).toEqual({ ok: true });
    expect(pinnedDeleteQuery.delete).toHaveBeenCalled();
    expect(pinnedDeleteQuery.eq).toHaveBeenCalledWith("user_id", USER_ID);
    expect(pinnedDeleteQuery.eq).toHaveBeenCalledWith("item_type", "project");
    expect(pinnedDeleteQuery.eq).toHaveBeenCalledWith("item_id", PROJECT_ID);
    expect(revalidateTag).toHaveBeenCalledWith("pinned");
    expect(revalidateTag).toHaveBeenCalledWith("clients");
  });
});
