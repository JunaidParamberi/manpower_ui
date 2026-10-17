import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { WorkerListRow } from "@/types";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

export function WorkerDetailsTab({ worker }: { worker: WorkerListRow }) {
  return (
    <div className="flex flex-col gap-6">
      <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted-foreground">Employee ID</dt>
          <dd className="font-medium">{worker.employee_id}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Nationality</dt>
          <dd className="font-medium">{worker.nationality ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Trade category</dt>
          <dd className="font-medium">{worker.trade_category ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Supplier</dt>
          <dd className="font-medium">{worker.supplier?.name ?? "Internal worker"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-sm text-muted-foreground">Clients</dt>
          <dd className="flex flex-wrap gap-2 pt-1">
            {worker.clients.length === 0 && <span className="text-muted-foreground">No clients linked</span>}
            {worker.clients.map((c) => (
              <span key={c.id} className="rounded-full border border-border/80 px-3 py-1 text-sm">{c.name}</span>
            ))}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Passport Number</dt>
          <dd className="font-medium">{worker.passport_number ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Passport Expiry</dt>
          <dd className="font-medium">{formatDate(worker.passport_expiry)}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Emirates ID</dt>
          <dd className="font-medium">{worker.emirates_id ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Emirates ID Expiry</dt>
          <dd className="font-medium">{formatDate(worker.emirates_id_expiry)}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Visa Number</dt>
          <dd className="font-medium">{worker.visa_number ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Visa Expiry</dt>
          <dd className="font-medium">{formatDate(worker.visa_expiry)}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Medical Fit</dt>
          <dd className="font-medium">{worker.medical_fit ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Medical Expiry</dt>
          <dd className="font-medium">{formatDate(worker.medical_expiry)}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Has Insurance</dt>
          <dd className="font-medium">{worker.has_insurance ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Insurance Expiry</dt>
          <dd className="font-medium">{formatDate(worker.insurance_expiry)}</dd>
        </div>
        {worker.notes && (
          <div className="sm:col-span-2">
            <dt className="text-sm text-muted-foreground">Notes</dt>
            <dd className="whitespace-pre-wrap">{worker.notes}</dd>
          </div>
        )}
      </dl>
      <Button variant="outline" nativeButton={false} render={<Link href={`/workers/${worker.id}/edit`} />} className="w-fit">
        Edit details
      </Button>
    </div>
  );
}
