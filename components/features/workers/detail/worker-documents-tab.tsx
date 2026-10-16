"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  listWorkerDocuments,
  removeWorkerDocument,
  uploadWorkerDocument,
} from "@/lib/workers/worker-document-mutations";
import { WORKER_DOCUMENT_ACCEPT, type WorkerDocumentSlot } from "@/lib/workers/worker-document-slots";
import { DocumentUploadField } from "@/components/shared/document-upload-field";
import { DocumentListSection } from "@/components/features/workers/detail/document-list-section";
import type { WorkerDocumentRow, WorkerListRow } from "@/types";

type SlotGroup = { title: string; slot: WorkerDocumentSlot; url: string | null; label: string };

function groupsFor(worker: WorkerListRow): { heading: string; fields: SlotGroup[] }[] {
  return [
    {
      heading: "Passport",
      fields: [
        { title: "Passport Copy", slot: "passport_document", url: worker.passport_document_url, label: "Passport" },
        { title: "Passport Copy (optional)", slot: "passport_document_optional", url: worker.passport_document_optional_url, label: "Passport (optional)" },
      ],
    },
    {
      heading: "Emirates ID (EID)",
      fields: [
        { title: "EID Copy", slot: "emirates_id_document", url: worker.emirates_id_document_url, label: "Emirates ID" },
        { title: "EID Copy (optional)", slot: "emirates_id_document_optional", url: worker.emirates_id_document_optional_url, label: "Emirates ID (optional)" },
      ],
    },
    {
      heading: "Visa",
      fields: [
        { title: "Visa Copy", slot: "visa_document", url: worker.visa_document_url, label: "Visa" },
        { title: "Visa Copy (optional)", slot: "visa_document_optional", url: worker.visa_document_optional_url, label: "Visa (optional)" },
      ],
    },
    {
      heading: "Photo & Insurance",
      fields: [
        { title: "Photo", slot: "photo", url: worker.photo_url, label: "Photo" },
        { title: "Workmen Compensation", slot: "workmen_compensation_document", url: worker.workmen_compensation_document_url, label: "Workmen Compensation" },
        { title: "Workmen Compensation (optional)", slot: "workmen_compensation_document_optional", url: worker.workmen_compensation_document_optional_url, label: "Workmen Compensation (optional)" },
        { title: "Medical Insurance Card", slot: "medical_insurance_card", url: worker.medical_insurance_card_url, label: "Medical Insurance Card" },
        { title: "Medical Insurance Card (optional)", slot: "medical_insurance_card_optional", url: worker.medical_insurance_card_optional_url, label: "Medical Insurance Card (optional)" },
      ],
    },
    {
      heading: "Sponsor & Trade License",
      fields: [
        { title: "NOC — Current Sponsor", slot: "noc_current_sponsor_document", url: worker.noc_current_sponsor_document_url, label: "NOC — Current Sponsor" },
        { title: "NOC — Client", slot: "noc_client_document", url: worker.noc_client_document_url, label: "NOC — Client" },
        { title: "Trade License", slot: "trade_license_document", url: worker.trade_license_document_url, label: "Trade License" },
      ],
    },
  ];
}

export function WorkerDocumentsTab({ worker }: { worker: WorkerListRow }) {
  const [isPending, startTransition] = useTransition();
  const [documents, setDocuments] = useState<WorkerDocumentRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  async function refreshDocuments() {
    const docs = await listWorkerDocuments(worker.id);
    setDocuments(docs);
  }

  useEffect(() => {
    refreshDocuments().then(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worker.id]);

  function handleUpload(slot: WorkerDocumentSlot, file: File) {
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("file", file);
        const result = await uploadWorkerDocument(worker.id, slot, fd);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success("Document uploaded");
        window.location.reload();
      } catch {
        toast.error("Upload failed. Try a smaller file.");
      }
    });
  }

  function handleRemove(slot: WorkerDocumentSlot) {
    startTransition(async () => {
      const result = await removeWorkerDocument(worker.id, slot);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Document removed");
      window.location.reload();
    });
  }

  if (!loaded) {
    return <div className="text-muted-foreground">Loading documents…</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {groupsFor(worker).map((group) => (
        <div key={group.heading} className="flex flex-col gap-4 rounded-lg border border-border/80 p-4">
          <h3 className="font-medium">{group.heading}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {group.fields.map((field) => (
              <DocumentUploadField
                key={field.slot}
                label={field.title}
                accept={WORKER_DOCUMENT_ACCEPT}
                existingUrl={field.url}
                existingLabel={field.label}
                disabled={isPending}
                onFileSelected={(file) => handleUpload(field.slot, file)}
                onRemoveExisting={() => handleRemove(field.slot)}
              />
            ))}
          </div>
        </div>
      ))}

      <DocumentListSection
        workerId={worker.id}
        category="cicpa"
        title="CICPA Documents"
        documents={documents.filter((d) => d.category === "cicpa")}
        onChanged={refreshDocuments}
      />
      <DocumentListSection
        workerId={worker.id}
        category="additional"
        title="Additional Documents"
        description="Any other documents required by the client."
        documents={documents.filter((d) => d.category === "additional")}
        onChanged={refreshDocuments}
      />
    </div>
  );
}
