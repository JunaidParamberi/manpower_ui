export const WORKER_DOCUMENT_SLOTS = [
  "passport_document",
  "passport_document_optional",
  "emirates_id_document",
  "emirates_id_document_optional",
  "visa_document",
  "visa_document_optional",
  "photo",
  "workmen_compensation_document",
  "workmen_compensation_document_optional",
  "medical_insurance_card",
  "medical_insurance_card_optional",
  "noc_current_sponsor_document",
  "noc_client_document",
  "trade_license_document",
] as const;

export type WorkerDocumentSlot = (typeof WORKER_DOCUMENT_SLOTS)[number];

export function isWorkerDocumentSlot(value: unknown): value is WorkerDocumentSlot {
  return typeof value === "string" && (WORKER_DOCUMENT_SLOTS as readonly string[]).includes(value);
}

/** `photo` and the card slots don't follow the `<slot>_document_url`/`<slot>_url` split — this maps each slot to its actual column name. */
const SLOT_COLUMN_OVERRIDES: Partial<Record<WorkerDocumentSlot, string>> = {
  photo: "photo_url",
  medical_insurance_card: "medical_insurance_card_url",
  medical_insurance_card_optional: "medical_insurance_card_optional_url",
};

export function columnForSlot(slot: WorkerDocumentSlot): string {
  return SLOT_COLUMN_OVERRIDES[slot] ?? `${slot}_url`;
}

export const WORKER_DOCUMENT_ACCEPT = "image/png,image/jpeg,image/webp,application/pdf" as const;

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export function extFromWorkerDocumentMime(mime: string): string | null {
  return EXT_BY_MIME[mime] ?? null;
}

export const MAX_WORKER_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;

export function validateWorkerDocumentFile(file: File): string | null {
  if (file.size === 0) return `${file.name}: file is empty.`;
  if (file.size > MAX_WORKER_DOCUMENT_SIZE_BYTES) return `${file.name}: file exceeds 10MB.`;
  if (!extFromWorkerDocumentMime(file.type)) return `${file.name}: unsupported file type.`;
  return null;
}
