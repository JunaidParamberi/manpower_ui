import type { Metadata } from "next";
import { SuppliersManager } from "@/components/features/suppliers/suppliers-manager";
import { listSuppliers } from "@/lib/suppliers/supplier-queries";

export const metadata: Metadata = { title: "Suppliers" };

export default async function SuppliersPage() {
  const suppliers = await listSuppliers();
  return <SuppliersManager initialSuppliers={suppliers} />;
}
