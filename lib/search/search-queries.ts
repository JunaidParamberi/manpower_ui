import { getServerContext } from "@/lib/supabase/get-server-context";
import { pickEmbed } from "@/lib/supabase/pick-embed";
import type { DocumentStatus, DocumentType } from "@/types";

import {
  formatClientSearchResult,
  formatDocumentSearchResult,
  formatProjectSearchResult,
  rankSearchResults,
  sanitizeIlikePattern,
} from "./format-result";
import type { GlobalSearchResults } from "./types";

const RESULT_LIMIT = 5;

type ProjectSearchRow = {
  id: string;
  title: string;
  status: string;
  clients: unknown;
};

export async function searchGlobalEntitiesForUser(
  userId: string,
  query: string,
): Promise<GlobalSearchResults> {
  const { supabase } = await getServerContext();
  const pattern = `%${sanitizeIlikePattern(query)}%`;

  const [clientsRes, projectsByTitleRes, matchingClientsRes] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, company, email, contact_name")
      .eq("user_id", userId)
      .or(
        `name.ilike.${pattern},company.ilike.${pattern},email.ilike.${pattern},contact_name.ilike.${pattern}`,
      )
      .order("name", { ascending: true })
      .limit(RESULT_LIMIT),
    supabase
      .from("projects")
      .select("id, title, status, clients:client_id(id, name)")
      .eq("user_id", userId)
      .ilike("title", pattern)
      .order("updated_at", { ascending: false })
      .limit(RESULT_LIMIT),
    supabase
      .from("clients")
      .select("id")
      .eq("user_id", userId)
      .ilike("name", pattern),
  ]);

  if (clientsRes.error) {
    console.error("[search-queries] clients error:", clientsRes.error.message);
  }
  if (projectsByTitleRes.error) {
    console.error("[search-queries] projects error:", projectsByTitleRes.error.message);
  }

  const matchingClientIds = (matchingClientsRes.data ?? []).map((c) => c.id);

  let projectsByClientRows: ProjectSearchRow[] = [];
  if (matchingClientIds.length > 0) {
    const projectsByClientRes = await supabase
      .from("projects")
      .select("id, title, status, clients:client_id(id, name)")
      .eq("user_id", userId)
      .in("client_id", matchingClientIds)
      .order("updated_at", { ascending: false })
      .limit(RESULT_LIMIT);
    if (projectsByClientRes.error) {
      console.error(
        "[search-queries] projects-by-client error:",
        projectsByClientRes.error.message,
      );
    }
    projectsByClientRows = (projectsByClientRes.data ?? []) as ProjectSearchRow[];
  }

  const projectRowMap = new Map<string, ProjectSearchRow>();
  for (const row of [
    ...((projectsByTitleRes.data ?? []) as ProjectSearchRow[]),
    ...projectsByClientRows,
  ]) {
    projectRowMap.set(row.id, row);
  }

  let documentsQuery = supabase
    .from("documents")
    .select(
      "id, type, status, title, invoice_number, quote_number, proposal_number, receipt_number, lpo_number, clients:client_id(id, name)",
    )
    .eq("user_id", userId)
    .is("deleted_at", null);

  const docOrParts = [
    `title.ilike.${pattern}`,
    `invoice_number.ilike.${pattern}`,
    `quote_number.ilike.${pattern}`,
    `proposal_number.ilike.${pattern}`,
    `receipt_number.ilike.${pattern}`,
    `lpo_number.ilike.${pattern}`,
  ];

  if (matchingClientIds.length > 0) {
    docOrParts.push(`client_id.in.(${matchingClientIds.join(",")})`);
  }

  documentsQuery = documentsQuery
    .or(docOrParts.join(","))
    .order("updated_at", { ascending: false })
    .limit(RESULT_LIMIT);

  const { data: documentRows, error: documentsError } = await documentsQuery;

  if (documentsError) {
    console.error("[search-queries] documents error:", documentsError.message);
  }

  const clientResults = (clientsRes.data ?? []).map((row) =>
    formatClientSearchResult(row),
  );

  const projectResults = [...projectRowMap.values()].map((row) =>
    formatProjectSearchResult({
      id: row.id,
      title: row.title,
      status: row.status,
      client: pickEmbed(row.clients, "name"),
    }),
  );

  const documentResults = (documentRows ?? []).map((row) =>
    formatDocumentSearchResult({
      id: row.id,
      type: row.type as DocumentType,
      status: row.status as DocumentStatus,
      title: row.title,
      invoice_number: row.invoice_number,
      quote_number: row.quote_number,
      proposal_number: row.proposal_number,
      receipt_number: row.receipt_number,
      lpo_number: row.lpo_number,
      client: pickEmbed(row.clients, "name"),
    }),
  );

  return {
    clients: rankSearchResults(clientResults, query),
    projects: rankSearchResults(projectResults, query).slice(0, RESULT_LIMIT),
    documents: rankSearchResults(documentResults, query),
  };
}
