import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidateTag } from "next/cache";
import { getServerContext } from "@/lib/supabase/get-server-context";
import {
  addWorkerDocumentListItem,
  removeWorkerDocument,
  uploadWorkerDocument,
} from "./worker-document-mutations";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
vi.mock("@/lib/supabase/get-server-context", () => ({ getServerContext: vi.fn() }));

describe("uploadWorkerDocument", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects when no file is attached", async () => {
    const supabase = {} as never;
    vi.mocked(getServerContext).mockResolvedValue({ supabase, user: { id: "u1" } } as never);
    const fd = new FormData();
    const result = await uploadWorkerDocument("w1", "passport_document", fd);
    expect(result.ok).toBe(false);
  });

  it("rejects an unsupported file type", async () => {
    vi.mocked(getServerContext).mockResolvedValue({ supabase: {} as never, user: { id: "u1" } } as never);
    const fd = new FormData();
    fd.append("file", new File(["x"], "bad.exe", { type: "application/x-msdownload" }));
    const result = await uploadWorkerDocument("w1", "passport_document", fd);
    expect(result.ok).toBe(false);
  });

  it("uploads and writes the url column, succeeding with no prior file", async () => {
    const workerId = "33333333-3333-4333-a333-333333333333";
    const workerRow = { id: workerId, user_id: "u1" };
    const updateEq2 = vi.fn(async () => ({ error: null }));
    const updateEq1 = vi.fn(() => ({ eq: updateEq2 }));
    const workersQuery = {
      select: vi.fn(() => workersQuery),
      eq: vi.fn(() => workersQuery),
      maybeSingle: vi.fn(async () => ({ data: workerRow, error: null })),
      update: vi.fn(() => ({ eq: updateEq1 })),
    };
    const storage = {
      upload: vi.fn(async () => ({ data: { path: "u1/w1/x.pdf" }, error: null })),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: "/storage/v1/object/public/worker-documents/u1/w1/x.pdf" } })),
    };
    const supabase = {
      from: vi.fn(() => workersQuery),
      storage: { from: vi.fn(() => storage) },
    };
    vi.mocked(getServerContext).mockResolvedValue({ supabase: supabase as never, user: { id: "u1" } as never });

    const fd = new FormData();
    fd.append("file", new File(["x"], "passport.pdf", { type: "application/pdf" }));
    const result = await uploadWorkerDocument(workerId, "passport_document", fd);

    expect(result.ok).toBe(true);
    expect(revalidateTag).toHaveBeenCalledWith("workers");
  });

  it("rejects a slot value that is not a declared worker document slot", async () => {
    const workerId = "33333333-3333-4333-a333-333333333333";
    vi.mocked(getServerContext).mockResolvedValue({
      supabase: {} as never,
      user: { id: "u1" } as never,
    });
    const fd = new FormData();
    fd.append("file", new File(["x"], "passport.pdf", { type: "application/pdf" }));
    const result = await uploadWorkerDocument(
      workerId,
      "arbitrary_column" as never,
      fd,
    );
    expect(result.ok).toBe(false);
  });
});

describe("removeWorkerDocument", () => {
  it("rejects an invalid worker id", async () => {
    const result = await removeWorkerDocument("not-a-uuid", "passport_document");
    expect(result.ok).toBe(false);
  });
});

describe("addWorkerDocumentListItem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a category that is not cicpa/additional", async () => {
    const workerId = "33333333-3333-4333-a333-333333333333";
    vi.mocked(getServerContext).mockResolvedValue({
      supabase: {} as never,
      user: { id: "u1" } as never,
    });
    const fd = new FormData();
    fd.append("file", new File(["x"], "doc.pdf", { type: "application/pdf" }));
    const result = await addWorkerDocumentListItem(workerId, "not-a-category" as never, fd);
    expect(result.ok).toBe(false);
  });

  it("rejects when the worker is not owned by the authenticated user", async () => {
    const workerId = "33333333-3333-4333-a333-333333333333";
    const workersQuery = {
      select: vi.fn(() => workersQuery),
      eq: vi.fn(() => workersQuery),
      maybeSingle: vi.fn(async () => ({ data: null, error: null })),
    };
    const supabase = { from: vi.fn(() => workersQuery) };
    vi.mocked(getServerContext).mockResolvedValue({
      supabase: supabase as never,
      user: { id: "u1" } as never,
    });
    const fd = new FormData();
    fd.append("file", new File(["x"], "doc.pdf", { type: "application/pdf" }));
    const result = await addWorkerDocumentListItem(workerId, "cicpa", fd);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toBe("Worker not found.");
  });
});
