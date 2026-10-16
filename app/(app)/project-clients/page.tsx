import type { Metadata } from "next";
import { ProjectClientsManager } from "@/components/features/project-clients/project-clients-manager";
import { listProjectClients } from "@/lib/project-clients/project-client-queries";

export const metadata: Metadata = { title: "Project clients" };

export default async function ProjectClientsPage() {
  const projectClients = await listProjectClients();
  return <ProjectClientsManager initialProjectClients={projectClients} />;
}
