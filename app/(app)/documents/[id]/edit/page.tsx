import { redirect } from "next/navigation";

/** One page per document: editing happens on /documents/[id]. Kept so old links and emails still work. */
export default async function EditDocumentRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/documents/${id}?edit=1`);
}
