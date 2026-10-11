import type { Metadata } from "next";

import { ProjectDetail } from "@/components/features/projects/project-detail";
import { getProjectById } from "@/lib/projects/actions";
import { pageTitle } from "@/lib/metadata";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const project = await getProjectById(id);
  return { title: project ? pageTitle(project.title) : "Project" };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <ProjectDetail id={id} />;
}
