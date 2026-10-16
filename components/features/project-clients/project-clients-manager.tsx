"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useState } from "react";

import { DeleteProjectClientButton } from "@/components/features/project-clients/delete-project-client-button";
import { ProjectClientFormSheet } from "@/components/features/project-clients/project-client-form-sheet";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import type { ProjectClientRow } from "@/types";

export function ProjectClientsManager({ initialProjectClients }: { initialProjectClients: ProjectClientRow[] }) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectClientRow | null>(null);

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Project clients"
        description="Construction companies workers are deployed to."
        actions={
          <Button onClick={() => { setEditing(null); setSheetOpen(true); }}>
            <Plus /> Add project client
          </Button>
        }
      />

      <div className="overflow-hidden rounded-lg border border-border/80">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Client ID</th>
              <th className="px-4 py-3 font-medium">License</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {initialProjectClients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No project clients yet.
                </td>
              </tr>
            )}
            {initialProjectClients.map((projectClient) => (
              <tr key={projectClient.id} className="border-t border-border/60">
                <td className="px-4 py-3 font-medium">{projectClient.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{projectClient.client_code ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{projectClient.license_number ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{projectClient.contact_name ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(projectClient); setSheetOpen(true); }}>
                    Edit
                  </Button>
                  <DeleteProjectClientButton
                    projectClientId={projectClient.id}
                    projectClientName={projectClient.name}
                    onDeleted={() => router.refresh()}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ProjectClientFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        projectClient={editing}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
