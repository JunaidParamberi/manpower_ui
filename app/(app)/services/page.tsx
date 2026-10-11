import type { Metadata } from "next";
import { ServicesManager } from "@/components/features/settings/services/services-manager";
import { listServices } from "@/lib/services/service-queries";

export const metadata: Metadata = { title: "Catalog — Services & Products" };

export default async function ServicesPage() {
  const services = await listServices();
  return <ServicesManager initialServices={services} />;
}
