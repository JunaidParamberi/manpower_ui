import { beforeEach, describe, expect, it, vi } from "vitest";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateInvoiceManualStatus } from "./document-mutations";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const USER_ID = "11111111-1111-4111-8111-111111111111";
const DOCUMENT_ID = "22222222-2222-4222-8222-222222222222";

function createDocumentsQuery(result: unknown) {
  const query = {
    update: vi.fn(() => query),
    eq: vi.fn(() => query),
    not: vi.fn(() => query),
    select: vi.fn(() => query),
    maybeSingle: vi.fn(async () => result),
  };

  return query;
}

function mockSupabase(documentsQuery: ReturnType<typeof createDocumentsQuery>) {
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: USER_ID } },
        error: null,
      })),
    },
    from: vi.fn((table: string) => {
      expect(table).toBe("documents");
      return documentsQuery;
    }),
  } as never);
}

describe("updateInvoiceManualStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects payment-derived statuses before touching the database", async () => {
    const documentsQuery = createDocumentsQuery({
      data: { id: DOCUMENT_ID, status: "paid" },
      error: null,
    });
    mockSupabase(documentsQuery);

    const result = await updateInvoiceManualStatus(DOCUMENT_ID, "paid");

    expect(result).toEqual({
      ok: false,
      message: "Invalid invoice status.",
    });
    expect(createClient).not.toHaveBeenCalled();
  });

  it("blocks status change on a settled invoice via the state machine", async () => {
    // First maybeSingle (SELECT) returns a paid invoice; assertTransition blocks the move.
    const documentsQuery = createDocumentsQuery({
      data: { status: "paid", type: "invoice" },
      error: null,
    });
    mockSupabase(documentsQuery);

    const result = await updateInvoiceManualStatus(DOCUMENT_ID, "archived");

    expect(result.ok).toBe(false);
    expect((result as { ok: false; message: string }).message).toContain("paid");
    expect(documentsQuery.update).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("updates a matching unsettled invoice and revalidates document surfaces", async () => {
    const documentsQuery = createDocumentsQuery({
      data: { id: DOCUMENT_ID, status: "sent" },
      error: null,
    });
    mockSupabase(documentsQuery);

    const result = await updateInvoiceManualStatus(DOCUMENT_ID, "sent");

    expect(result).toEqual({ ok: true, status: "sent" });
    expect(revalidatePath).toHaveBeenCalledWith("/documents");
    expect(revalidatePath).toHaveBeenCalledWith(`/documents/${DOCUMENT_ID}`);
    expect(revalidatePath).toHaveBeenCalledWith(`/documents/${DOCUMENT_ID}/edit`);
    expect(revalidateTag).toHaveBeenCalledWith("dashboard");
    expect(revalidateTag).toHaveBeenCalledWith("finance");
  });
});
