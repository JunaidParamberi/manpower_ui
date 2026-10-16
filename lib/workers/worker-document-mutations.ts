"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { getServerContext } from "@/lib/supabase/get-server-context";
import {
  columnForSlot,
  extFromWorkerDocumentMime,
  isWorkerDocumentSlot,
  validateWorkerDocumentFile,
  type WorkerDocumentSlot,
} from "@/lib/workers/worker-document-slots";
import type { WorkerDocumentRow } from "@/types";

const BUCKET = "worker-documents";
const uuidSchema = z.string().uuid();

type DocMutationResult = { ok: true; url: string } | { ok: false; error: string };
type OkResult = { ok: true } | { ok: false; error: string };

function revalidate() {
  revalidateTag("workers");
  revalidatePath("/workers");
}

export async function uploadWorkerDocument(
  workerId: string,
  slot: WorkerDocumentSlot,
  formData: FormData,
): Promise<DocMutationResult> {
  const parsedId = uuidSchema.safeParse(workerId);
  if (!parsedId.success) return { ok: false, error: "Invalid worker." };

  if (!isWorkerDocumentSlot(slot)) return { ok: false, error: "Invalid document slot." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a file to upload." };
  }

  const validationError = validateWorkerDocumentFile(file);
  if (validationError) return { ok: false, error: validationError };

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Not authenticated." };

  const existing = await supabase
    .from("workers")
    .select("*")
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing.error || !existing.data) return { ok: false, error: "Worker not found." };

  const ext = extFromWorkerDocumentMime(file.type)!;
  const path = `${user.id}/${parsedId.data}/${slot}-${crypto.randomUUID()}.${ext}`;

  const uploaded = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploaded.error) return { ok: false, error: uploaded.error.message };

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const url = publicUrlData.publicUrl;

  const column = columnForSlot(slot);
  const updated = await supabase
    .from("workers")
    .update({ [column]: url })
    .eq("id", parsedId.data)
    .eq("user_id", user.id);
  if (updated.error) return { ok: false, error: updated.error.message };

  revalidate();
  return { ok: true, url };
}

export async function removeWorkerDocument(
  workerId: string,
  slot: WorkerDocumentSlot,
): Promise<OkResult> {
  const parsedId = uuidSchema.safeParse(workerId);
  if (!parsedId.success) return { ok: false, error: "Invalid worker." };

  if (!isWorkerDocumentSlot(slot)) return { ok: false, error: "Invalid document slot." };

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Not authenticated." };

  const column = columnForSlot(slot);
  const { error } = await supabase
    .from("workers")
    .update({ [column]: null })
    .eq("id", parsedId.data)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function listWorkerDocuments(workerId: string): Promise<WorkerDocumentRow[]> {
  const { supabase, user } = await getServerContext();
  if (!user) return [];
  const { data, error } = await supabase
    .from("worker_documents")
    .select("*")
    .eq("worker_id", workerId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as WorkerDocumentRow[];
}

export async function addWorkerDocumentListItem(
  workerId: string,
  category: "cicpa" | "additional",
  formData: FormData,
): Promise<DocMutationResult> {
  const parsedId = uuidSchema.safeParse(workerId);
  if (!parsedId.success) return { ok: false, error: "Invalid worker." };

  if (category !== "cicpa" && category !== "additional") {
    return { ok: false, error: "Invalid document category." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a file to upload." };
  }
  const validationError = validateWorkerDocumentFile(file);
  if (validationError) return { ok: false, error: validationError };

  const label = String(formData.get("label") ?? file.name).trim() || file.name;

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Not authenticated." };

  const existing = await supabase
    .from("workers")
    .select("*")
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing.error || !existing.data) return { ok: false, error: "Worker not found." };

  const ext = extFromWorkerDocumentMime(file.type)!;
  const path = `${user.id}/${parsedId.data}/${category}-${crypto.randomUUID()}.${ext}`;
  const uploaded = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploaded.error) return { ok: false, error: uploaded.error.message };

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const url = publicUrlData.publicUrl;

  const inserted = await supabase
    .from("worker_documents")
    .insert({ user_id: user.id, worker_id: parsedId.data, category, label, file_url: url });
  if (inserted.error) return { ok: false, error: inserted.error.message };

  revalidate();
  return { ok: true, url };
}

export async function removeWorkerDocumentListItem(id: string): Promise<OkResult> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid document." };

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("worker_documents")
    .delete()
    .eq("id", parsedId.data)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}
