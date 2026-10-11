"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getServerContext } from "@/lib/supabase/get-server-context";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TDS_CERT_BUCKET = "tds-certificates";
const TDS_CERT_ALLOWED_MIME = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
] as const;
const TDS_CERT_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

type TdsCertMime = (typeof TDS_CERT_ALLOWED_MIME)[number];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extFromMime(mime: string): string {
  const map: Record<TdsCertMime, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "application/pdf": "pdf",
  };
  const ext = map[mime as TdsCertMime];
  if (!ext) throw new Error(`Unsupported MIME type: ${mime}`);
  return ext;
}

function validateCertFile(file: File): string | null {
  if (!(TDS_CERT_ALLOWED_MIME as readonly string[]).includes(file.type)) {
    return `Unsupported file type: ${file.type}. Allowed: PNG, JPEG, WEBP, PDF.`;
  }
  if (file.size > TDS_CERT_MAX_BYTES) {
    return `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum 5 MB.`;
  }
  return null;
}

function bustDocumentCaches(documentId: string): void {
  revalidateTag("documents");
  revalidateTag("finance");
  revalidatePath(`/documents/${documentId}`);
}

// ---------------------------------------------------------------------------
// uploadTdsCertificate
// ---------------------------------------------------------------------------

/**
 * Upload a TDS certificate (Form 16A PDF or image) for a document.
 *
 * Accepts a FormData with the file under key "certificate".
 * Stores the storage object **path** (not a public URL) in
 * `documents.tds_certificate_url` — the bucket is private and files
 * are served via short-lived signed URLs only.
 *
 * Returns `{ path }` on success, throws on error.
 */
export async function uploadTdsCertificate(
  documentId: string,
  formData: FormData,
): Promise<{ path: string }> {
  const { supabase, user } = await getServerContext();

  if (!user) {
    throw new Error("Not authenticated.");
  }

  // Validate document belongs to this user
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("id, tds_certificate_url")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (docError || !doc) {
    throw new Error("Document not found.");
  }

  const file = formData.get("certificate");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No certificate file provided.");
  }

  const validationError = validateCertFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const ext = extFromMime(file.type);
  const oldPath = doc.tds_certificate_url ?? null;

  const path = `${user.id}/${documentId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(TDS_CERT_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // Store the path (not a URL) — bucket is private, served via signed URLs
  const { error: updateError } = await supabase
    .from("documents")
    .update({ tds_certificate_url: path })
    .eq("id", documentId)
    .eq("user_id", user.id);

  if (updateError) {
    // Rollback: remove the newly uploaded file to avoid orphan
    await supabase.storage.from(TDS_CERT_BUCKET).remove([path]);
    throw new Error(`Could not save certificate path: ${updateError.message}`);
  }

  // DB now points to new file — safe to remove old file (ignore removal errors)
  if (oldPath) {
    await supabase.storage.from(TDS_CERT_BUCKET).remove([oldPath]);
  }

  bustDocumentCaches(documentId);

  return { path };
}

// ---------------------------------------------------------------------------
// removeTdsCertificate
// ---------------------------------------------------------------------------

/**
 * Remove the TDS certificate from storage and clear
 * `documents.tds_certificate_url`.
 */
export async function removeTdsCertificate(
  documentId: string,
): Promise<void> {
  const { supabase, user } = await getServerContext();

  if (!user) {
    throw new Error("Not authenticated.");
  }

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("id, tds_certificate_url")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (docError || !doc) {
    throw new Error("Document not found.");
  }

  if (doc.tds_certificate_url) {
    const { error: removeError } = await supabase.storage
      .from(TDS_CERT_BUCKET)
      .remove([doc.tds_certificate_url]);

    if (removeError) {
      throw new Error(
        `Could not remove certificate from storage: ${removeError.message}`,
      );
    }
  }

  const { error: updateError } = await supabase
    .from("documents")
    .update({ tds_certificate_url: null })
    .eq("id", documentId)
    .eq("user_id", user.id);

  if (updateError) {
    throw new Error(
      `Could not clear certificate path: ${updateError.message}`,
    );
  }

  bustDocumentCaches(documentId);
}

// ---------------------------------------------------------------------------
// getTdsCertificateSignedUrl
// ---------------------------------------------------------------------------

/**
 * Return a 1-hour signed URL for the stored TDS certificate, or null if
 * no certificate is on record. Uses signed URLs because the bucket is private.
 */
export async function getTdsCertificateSignedUrl(
  documentId: string,
): Promise<string | null> {
  const { supabase, user } = await getServerContext();

  if (!user) {
    throw new Error("Not authenticated.");
  }

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("tds_certificate_url")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (docError || !doc) {
    throw new Error("Document not found.");
  }

  if (!doc.tds_certificate_url) {
    return null;
  }

  const { data, error: signError } = await supabase.storage
    .from(TDS_CERT_BUCKET)
    .createSignedUrl(doc.tds_certificate_url, 3600); // 1 hour

  if (signError || !data?.signedUrl) {
    throw new Error(
      `Could not generate signed URL: ${signError?.message ?? "unknown error"}`,
    );
  }

  return data.signedUrl;
}
