/**
 * Document data access. Prefer importing mutations from `./document-mutations`
 * inside Client Components so the client bundle does not pull query modules.
 */
export type {
  ListDocumentsResult,
  ListTemplatesResult,
} from "./document-queries";
export {
  getDocumentById,
  getTemplateById,
  listDocumentTemplates,
  listDocuments,
  listDocumentsForClient,
  listDocumentsForProject,
} from "./document-queries";

export type {
  CreateDocumentResult,
  DeleteDocumentResult,
  DeleteTemplateResult,
  SaveAsTemplateResult,
  UpdateDocumentResult,
  VoidDocumentResult,
} from "./document-mutations";
export {
  createDocument,
  deleteDocument,
  deleteTemplate,
  saveAsTemplate,
  updateDocument,
  voidDocument,
} from "./document-mutations";
