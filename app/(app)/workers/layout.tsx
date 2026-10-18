import type { Metadata } from "next";
import type { ReactNode } from "react";

import { WorkersShell } from "@/components/features/workers/overview/workers-shell";
import { listWorkers } from "@/lib/workers/worker-queries";
import { sectionTitleTemplate } from "@/lib/metadata";

export const metadata: Metadata = {
  title: {
    default: "Workers",
    template: sectionTitleTemplate("Workers"),
  },
};

export default async function WorkersLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const workers = await listWorkers();
  return <WorkersShell workers={workers}>{children}</WorkersShell>;
}
