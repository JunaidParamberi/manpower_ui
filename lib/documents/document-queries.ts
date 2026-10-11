import { z } from "zod";

import {
  normalizeDocumentListRow,
  normalizeDocumentRow,
  normalizeTemplateRow,
} from "@/lib/documents/normalize-document-row";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { unstable_cache } from "next/cache";
import type {
  DocumentListRow,
  DocumentRow,
  DocumentTemplateRow,
  DocumentType,
} from "@/types";

const uuidSchema = z.string().uuid();

export type ListDocumentsResult =
  | { ok: true; documents: DocumentListRow[]; hasMore: boolean }
  | { ok: false; message: string };

export const DOCUMENT_LIST_PAGE_SIZE = 50;

export type ListDocumentsOptions = {
  offset?: number;
  limit?: number;
  type?: DocumentType | null;
  search?: string | null;
};

/**
 * Cap on client-name matches folded into the document filter (R6), to keep the
 * generated PostgREST filter URL bounded. The lookup is deliberately
 * unordered, so which clients fall past the cap is not deterministic — for a
 * term matching more than 100 of one user's clients, results are a stable-
 * enough but arbitrary subset. That is judged acceptable: a freelancer with
 * >100 clients matching one substring is not a realistic workload, and the
 * document-number and title clauses still apply regardless.
 */
const CLIENT_SEARCH_MATCH_LIMIT = 100;

const _cachedDefaultCurrency = unstable_cache(
  async (userId: string): Promise<string> => {
    const supabase = createAdminClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("default_currency")
      .eq("id", userId)
      .maybeSingle();
    return profile?.default_currency?.trim() || "USD";
  },
  ["documents-default-currency"],
  { revalidate: 300, tags: ["profile"] },
);

/**
 * Effective cache key = the keyParts array below plus the serialized argument
 * list, which Next appends verbatim: [userId, offset, limit, type, search].
 * `type` and `search` MUST stay in the argument list — dropping either would
 * let a filtered result populate the entry an unfiltered read then reads back.
 */
const _cachedListDocuments = unstable_cache(
  async (
    userId: string,
    offset: number,
    limit: number,
    type: DocumentType | null,
    search: string | null,
  ): Promise<ListDocumentsResult> => {
    const supabase = createAdminClient();
    const fallbackCurrency = await _cachedDefaultCurrency(userId);

    let query = supabase
      .from("documents")
      .select(
        "*, clients:client_id(id, name, currency), projects:project_id(id, title), line_items(quantity, unit_price, tax_rate)",
      )
      .eq("user_id", userId);

    if (type) {
      query = query.eq("type", type);
    }

    if (search) {
      // The pane's old client-side filter matched document number, title AND
      // client name. Client name lives on a joined row, so a plain `.or()` on
      // `documents` cannot see it — resolve the matching client ids first and
      // fold them into the same disjunction (R6). `search` is already
      // sanitised by normalizeListFilters, so it carries no PostgREST
      // delimiters.
      const { data: matchingClients } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", userId)
        .ilike("name", `%${search}%`)
        .limit(CLIENT_SEARCH_MATCH_LIMIT);

      const clauses = [
        `title.ilike.%${search}%`,
        `invoice_number.ilike.%${search}%`,
        `quote_number.ilike.%${search}%`,
        `proposal_number.ilike.%${search}%`,
        `receipt_number.ilike.%${search}%`,
        `lpo_number.ilike.%${search}%`,
      ];

      const clientIds = (matchingClients ?? []).map((c) => c.id);
      if (clientIds.length > 0) {
        clauses.push(`client_id.in.(${clientIds.join(",")})`);
      }

      query = query.or(clauses.join(","));
    }

    const { data, error } = await query
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return { ok: false, message: error.message };
    }

    let documents = (data ?? []).map((row) =>
      normalizeDocumentListRow(row, fallbackCurrency),
    );

    const missingClientIds = [
      ...new Set(
        documents
          .filter((d) => !d.client && d.client_id)
          .map((d) => d.client_id as string),
      ),
    ];
    const missingProjectIds = [
      ...new Set(
        documents
          .filter((d) => !d.project && d.project_id)
          .map((d) => d.project_id as string),
      ),
    ];

    if (missingClientIds.length > 0 || missingProjectIds.length > 0) {
      const [clientsRes, projectsRes] = await Promise.all([
        missingClientIds.length > 0
          ? supabase
              .from("clients")
              .select("id, name, currency")
              .eq("user_id", userId)
              .in("id", missingClientIds)
          : Promise.resolve({ data: [], error: null }),
        missingProjectIds.length > 0
          ? supabase
              .from("projects")
              .select("id, title")
              .eq("user_id", userId)
              .in("id", missingProjectIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const clientsById = new Map(
        (clientsRes.data ?? []).map((c) => [c.id, c]),
      );
      const projectsById = new Map(
        (projectsRes.data ?? []).map((p) => [p.id, p]),
      );

      documents = documents.map((doc) => {
        let next = doc;
        if (!next.client && doc.client_id) {
          const client = clientsById.get(doc.client_id);
          if (client) {
            next = { ...next, client: { id: client.id, name: client.name, currency: (client as { currency?: string }).currency ?? fallbackCurrency } };
          }
        }
        if (!next.project && doc.project_id) {
          const project = projectsById.get(doc.project_id);
          if (project) {
            next = {
              ...next,
              project: { id: project.id, title: project.title },
            };
          }
        }
        return next;
      });
    }

    return { ok: true, documents, hasMore: (data ?? []).length === limit };
  },
  ["documents-list"],
  { revalidate: 60, tags: ["documents", "clients", "projects"] },
);

export async function listDocuments(
  options: ListDocumentsOptions = {},
): Promise<ListDocumentsResult> {
  const { user } = await getServerContext();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }
  return _cachedListDocuments(
    user.id,
    options.offset ?? 0,
    options.limit ?? DOCUMENT_LIST_PAGE_SIZE,
    options.type ?? null,
    options.search ?? null,
  );
}

const _cachedListDocumentsForClient = unstable_cache(
  async (userId: string, clientId: string): Promise<ListDocumentsResult> => {
    const supabase = createAdminClient();
    const fallbackCurrency = await _cachedDefaultCurrency(userId);

    const { data, error } = await supabase
      .from("documents")
      .select(
        "*, clients:client_id(id, name, currency), projects:project_id(id, title), line_items(quantity, unit_price, tax_rate), payments!payments_document_id_fkey(amount)",
      )
      .eq("user_id", userId)
      .eq("client_id", clientId)
      .order("updated_at", { ascending: false });

    if (error) {
      return { ok: false, message: error.message };
    }

    return {
      ok: true,
      documents: (data ?? []).map((row) =>
        normalizeDocumentListRow(row, fallbackCurrency),
      ),
      hasMore: false,
    };
  },
  ["documents-list-for-client"],
  { revalidate: 60, tags: ["documents", "clients", "projects"] },
);

export async function listDocumentsForClient(
  clientId: string,
): Promise<ListDocumentsResult> {
  const parsedId = uuidSchema.safeParse(clientId);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid client." };
  }

  const { user } = await getServerContext();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  return _cachedListDocumentsForClient(user.id, parsedId.data);
}

const _cachedListDocumentsForProject = unstable_cache(
  async (userId: string, projectId: string): Promise<ListDocumentsResult> => {
    const supabase = createAdminClient();
    const fallbackCurrency = await _cachedDefaultCurrency(userId);

    const { data, error } = await supabase
      .from("documents")
      .select(
        "*, clients:client_id(id, name, currency), projects:project_id(id, title)",
      )
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false });

    if (error) {
      return { ok: false, message: error.message };
    }

    return {
      ok: true,
      documents: (data ?? []).map((row) =>
        normalizeDocumentListRow(row, fallbackCurrency),
      ),
      hasMore: false,
    };
  },
  ["documents-for-project"],
  { revalidate: 60, tags: ["documents", "projects", "clients"] },
);

export async function listDocumentsForProject(
  projectId: string,
): Promise<ListDocumentsResult> {
  const parsedId = uuidSchema.safeParse(projectId);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid project." };
  }

  const { user } = await getServerContext();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  return _cachedListDocumentsForProject(user.id, parsedId.data);
}

const _cachedGetDocumentById = unstable_cache(
  async (userId: string, id: string): Promise<DocumentRow | null> => {
    const supabase = createAdminClient();
    const fallbackCurrency = await _cachedDefaultCurrency(userId);

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return null;
    return normalizeDocumentRow(data, fallbackCurrency);
  },
  ["documents-by-id"],
  { revalidate: 60, tags: ["documents"] },
);

export async function getDocumentById(
  id: string,
): Promise<DocumentRow | null> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) {
    return null;
  }

  const { user } = await getServerContext();
  if (!user) {
    return null;
  }

  return _cachedGetDocumentById(user.id, parsedId.data);
}

export type ListTemplatesResult =
  | { ok: true; templates: DocumentTemplateRow[] }
  | { ok: false; message: string };

const _cachedListDocumentTemplates = unstable_cache(
  async (userId: string): Promise<ListTemplatesResult> => {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("document_templates")
      .select("*")
      .or(`user_id.eq.${userId},is_system.eq.true`)
      .order("is_system", { ascending: false })
      .order("type", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      return { ok: false, message: error.message };
    }

    return {
      ok: true,
      templates: (data ?? []).map((row) => normalizeTemplateRow(row)),
    };
  },
  ["documents-templates"],
  { revalidate: 60, tags: ["documents"] },
);

export async function listDocumentTemplates(): Promise<ListTemplatesResult> {
  const { user } = await getServerContext();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }
  // userId is interpolated into a PostgREST .or() filter string inside the
  // worker; guard its shape here so a malformed value can never reach it.
  const parsedUserId = uuidSchema.safeParse(user.id);
  if (!parsedUserId.success) {
    return { ok: false, message: "Not authenticated." };
  }

  return _cachedListDocumentTemplates(parsedUserId.data);
}

const _cachedGetTemplateById = unstable_cache(
  async (userId: string, id: string): Promise<DocumentTemplateRow | null> => {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("document_templates")
      .select("*")
      .eq("id", id)
      .or(`user_id.eq.${userId},is_system.eq.true`)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return normalizeTemplateRow(data);
  },
  ["documents-template-by-id"],
  { revalidate: 60, tags: ["documents"] },
);

export async function getTemplateById(
  id: string,
): Promise<DocumentTemplateRow | null> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) {
    return null;
  }

  const { user } = await getServerContext();
  if (!user) {
    return null;
  }
  // userId is interpolated into a PostgREST .or() filter string inside the
  // worker; guard its shape here so a malformed value can never reach it.
  const parsedUserId = uuidSchema.safeParse(user.id);
  if (!parsedUserId.success) {
    return null;
  }

  return _cachedGetTemplateById(parsedUserId.data, parsedId.data);
}
