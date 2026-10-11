import { beforeEach, describe, expect, it, vi } from "vitest";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createClient as createAppClient,
  deleteClient,
} from "./client-mutations";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn: unknown) => fn),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const USER_ID = "11111111-1111-4111-8111-111111111111";
const CLIENT_ID = "22222222-2222-4222-8222-222222222222";

function createSelectQuery<TData>(result: {
  data: TData | null;
  error: { message: string } | null;
  count?: number | null;
}) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(async () => ({
      data: result.data,
      error: result.error,
      count: result.count ?? null,
    })),
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);

  return query;
}

function createDeleteClientQuery(result: {
  error: { message: string; code?: string } | null;
  count: number | null;
}) {
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

function mockSupabase(clientsQuery: ReturnType<typeof createDeleteClientQuery>) {
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: USER_ID } },
        error: null,
      })),
    },
    from: vi.fn((table: string) => {
      expect(table).toBe("clients");
      return clientsQuery;
    }),
  } as never);
}

describe("deleteClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a friendly message when projects still reference the client", async () => {
    const clientsQuery = createDeleteClientQuery({
      error: {
        code: "23503",
        message:
          'update or delete on table "clients" violates foreign key constraint "projects_client_id_fkey" on table "projects"',
      },
      count: null,
    });
    mockSupabase(clientsQuery);

    const result = await deleteClient(CLIENT_ID);

    expect(result).toEqual({
      ok: false,
      message:
        "You can't delete this client yet because it has linked projects. Move or delete those projects first, then try again.",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});

describe("createClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks free users from creating clients past their plan limit", async () => {
    const profileQuery = createSelectQuery({
      data: { plan_tier: "free" },
      error: null,
    });
    const insertQuery = {
      insert: vi.fn(),
      select: vi.fn(),
      maybeSingle: vi.fn(),
    };
    const clientsQuery = {
      count: 3,
      error: null,
      select: vi.fn(),
      eq: vi.fn(),
      insert: insertQuery.insert,
      maybeSingle: vi.fn(async () => ({
        data: null,
        error: null,
        count: 3,
      })),
    };

    clientsQuery.select.mockReturnValue(clientsQuery);
    clientsQuery.eq.mockReturnValue(clientsQuery);
    insertQuery.insert.mockReturnValue(insertQuery);
    insertQuery.select.mockReturnValue(insertQuery);
    insertQuery.maybeSingle.mockResolvedValue({
      data: {
        id: CLIENT_ID,
        user_id: USER_ID,
        name: "Fourth client",
        contact_name: null,
        email: null,
        phone: null,
        company: null,
        address: null,
        currency: null,
        notes: null,
        health_score: null,
        portal_token: null,
        created_at: "2026-06-01T00:00:00.000Z",
        updated_at: "2026-06-01T00:00:00.000Z",
      },
      error: null,
    });

    const from = vi.fn((table: string) => {
      if (table === "profiles") return profileQuery;
      if (table === "clients") return clientsQuery;
      throw new Error(`Unexpected table: ${table}`);
    });

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: { id: USER_ID } },
          error: null,
        })),
      },
      from,
    } as never);

    const result = await createAppClient({
      name: "Fourth client",
      contact_name: "",
      email: "",
      phone: "",
      company: "",
      address: "",
      currency: "",
      notes: "",
    });

    expect(result).toEqual({
      ok: false,
      message: "Client limit reached (3/3). Upgrade to add more clients.",
    });
    expect(insertQuery.insert).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
