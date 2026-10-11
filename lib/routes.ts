/**
 * Central mapping from entity table name (matches `entity-registry.ts`) to
 * the app route that lets a user view the record. Returns `null` when no
 * link should render — e.g. unknown entities, null id, never-exposed tables.
 *
 * The frontend owns routing — the Edge Function never constructs URLs.
 */

export const ENTITY_LABELS: Record<string, string> = {
  clients: "Client",
  projects: "Project",
  tasks: "Task",
  documents: "Invoice",
  payments: "Payment",
  time_entries: "Time entry",
  services: "Service",
  expenses: "Expense",
  content_posts: "Post",
  content_campaigns: "Campaign",
  project_milestones: "Milestone",
};

const PATH_BY_ENTITY: Record<string, (id: string) => string> = {
  clients: (id) => `/clients/${id}`,
  projects: (id) => `/projects/${id}`,
  tasks: (id) => `/tasks?task=${id}`,
  documents: (id) => `/documents/${id}`,
  payments: (docId) => `/documents/${docId}`,
  services: (id) => `/settings/services#${id}`,
  expenses: (id) => `/expenses#${id}`,
  content_posts: (id) => `/marketing/post/${id}`,
  content_campaigns: (id) => `/marketing/campaign/${id}`,
  project_milestones: (id) => `/projects?tab=timeline#${id}`,
  time_entries: () => `/time`,
};

export function entityPath(entity: string, id: string | null): string | null {
  if (!id) {
    return null;
  }
  const builder = PATH_BY_ENTITY[entity];
  if (!builder) {
    return null;
  }
  return builder(id);
}
