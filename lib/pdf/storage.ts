import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "documents";

/**
 * Upload a PDF buffer to storage and persist the public URL on the document
 * row. Overwrites any previous PDF for the same document ID.
 *
 * In this frontend-only build the bytes land in `mock-storage/documents/` and
 * are served by `app/storage/v1/object/public/...`.
 *
 * Returns the public URL on success, null on failure (non-fatal — the PDF
 * download still works even if storage upload fails).
 */
export async function uploadDocumentPdf(
  userId: string,
  documentId: string,
  pdfBuffer: Buffer,
): Promise<string | null> {
  try {
    const supabase = createAdminClient();
    const path = `${userId}/${documentId}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("[pdf/storage] upload error:", uploadError.message);
      return null;
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    // Persist url on the document row (best-effort).
    await supabase
      .from("documents")
      .update({ pdf_url: publicUrl })
      .eq("id", documentId)
      .eq("user_id", userId);

    return publicUrl;
  } catch (err) {
    console.error("[pdf/storage] unexpected error:", err);
    return null;
  }
}
