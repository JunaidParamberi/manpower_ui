import type { Metadata } from "next";
import type { ReactNode } from "react";

import { sectionTitleTemplate } from "@/lib/metadata";

export const metadata: Metadata = {
  title: {
    default: "Projects",
    template: sectionTitleTemplate("Projects"),
  },
};

export default function ProjectsLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return children;
}
