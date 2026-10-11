import { ProjectsPortfolioSkeleton } from "@/components/features/projects/skeletons";
import { getProjectsListLayoutFromCookies } from "@/lib/projects/list-layout-preference.server";

export default async function Loading() {
  // Same view the page will open in, so the skeleton is its exact shape.
  return <ProjectsPortfolioSkeleton view={await getProjectsListLayoutFromCookies()} />;
}
