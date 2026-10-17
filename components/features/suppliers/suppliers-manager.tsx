"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useState } from "react";

import { DeleteSupplierButton } from "@/components/features/suppliers/delete-supplier-button";
import { SupplierFormSheet } from "@/components/features/suppliers/supplier-form-sheet";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import type { SupplierRow } from "@/types";

export function SuppliersManager({ initialSuppliers }: { initialSuppliers: SupplierRow[] }) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierRow | null>(null);

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Suppliers"
        description="Labor-supply companies that provide workers."
        actions={
          <Button onClick={() => { setEditing(null); setSheetOpen(true); }}>
            <Plus /> Add supplier
          </Button>
        }
      />

      <div className="overflow-hidden rounded-lg border border-border/80">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Supplier ID</th>
              <th className="px-4 py-3 font-medium">License</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {initialSuppliers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No suppliers yet.
                </td>
              </tr>
            )}
            {initialSuppliers.map((supplier) => (
              <tr key={supplier.id} className="border-t border-border/60">
                <td className="px-4 py-3 font-medium">{supplier.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{supplier.supplier_code ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{supplier.license_number ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{supplier.contact_name ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(supplier); setSheetOpen(true); }}>
                    Edit
                  </Button>
                  <DeleteSupplierButton
                    supplierId={supplier.id}
                    supplierName={supplier.name}
                    onDeleted={() => router.refresh()}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SupplierFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        supplier={editing}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
