import { documentTypeLabel } from "@/lib/documents/display";
import { projectStatusLabel } from "@/lib/projects/display";
import type { DocumentListRow, ProjectListRow } from "@/types";

export type ClientActivityItem = {
  id: string;
  kind: "client" | "project" | "document";
  title: string;
  description: string;
  occurredAt: string;
  href: string | null;
};

type ClientActivityClient = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

type ClientActivityProject = Pick<
  ProjectListRow,
  "id" | "title" | "status" | "updated_at"
>;

type ClientActivityDocument = Pick<
  DocumentListRow,
  "id" | "title" | "type" | "status" | "updated_at"
>;

export function buildClientActivityTimeline({
  client,
  projects,
  documents,
}: {
  client: ClientActivityClient;
  projects: ClientActivityProject[];
  documents: ClientActivityDocument[];
}): ClientActivityItem[] {
  const items: ClientActivityItem[] = [
    {
      id: `client-created-${client.id}`,
      kind: "client",
      title: "Client added",
      description: client.name,
      occurredAt: client.created_at,
      href: null,
    },
  ];

  if (client.updated_at !== client.created_at) {
    items.push({
      id: `client-updated-${client.id}`,
      kind: "client",
      title: "Client details updated",
      description: client.name,
      occurredAt: client.updated_at,
      href: null,
    });
  }

  projects.forEach((project) => {
    items.push({
      id: `project-${project.id}`,
      kind: "project",
      title: project.title,
      description: `Project ${projectStatusLabel(project.status).toLowerCase()}`,
      occurredAt: project.updated_at,
      href: `/projects/${project.id}`,
    });
  });

  documents.forEach((document) => {
    items.push({
      id: `document-${document.id}`,
      kind: "document",
      title: document.title,
      description: `${documentTypeLabel(document.type)} ${document.status.replaceAll("_", " ")}`,
      occurredAt: document.updated_at,
      href: `/documents/${document.id}`,
    });
  });

  return items.sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
}
