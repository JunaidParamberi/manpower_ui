// Storybook stand-in for lib/documents/document-mutations (server actions).
// Every write succeeds instantly so editors can be tried without a backend.
const ok = async () => ({ ok: true as const });
const doc = { id: "doc-story", title: "Story document", status: "draft", type: "invoice" };

export const createDocument = async () => ({ ok: true as const, document: doc });
export const createDraftDocument = async () => ({ ok: true as const, document: doc });
export const discardUntouchedDraft = async () => ({ ok: true as const, discarded: false });
export const updateDocument = async () => ({ ok: true as const, document: doc });
export const updateDocumentProperties = async () => ({ ok: true as const, document: doc });
export const updateInvoiceManualStatus = ok;
export const deleteDocument = ok;
export const voidDocument = ok;
export const saveAsTemplate = async () => ({ ok: true as const });
export const deleteTemplate = ok;
export const updateDocumentLinks = ok;
export const renameDocument = ok;
export const updateDocumentContent = ok;
