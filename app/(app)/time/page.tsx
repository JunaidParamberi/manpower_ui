import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { TimePageSkeletonLoader } from "@/components/features/time/time-page-skeleton-loader";

export const metadata: Metadata = {
  title: "Time",
};
import { listProjects } from "@/lib/projects/actions";
import { listTimeEntries } from "@/lib/time/actions";
import { PageHeader } from "@/components/shared/page-header";

/** Separate client chunk avoids intermittent dev Webpack `__webpack_modules__[moduleId] is not a function` when loading the heavy Time UI bundle. */
const TimeTracker = dynamic(
  () =>
    import("@/components/features/time/time-tracker").then((m) => ({
      default: m.TimeTracker,
    })),
  {
    loading: () => <TimePageSkeletonLoader />,
  },
);

export default async function TimePage() {
  const [projectsRes, entriesRes] = await Promise.all([
    listProjects(),
    listTimeEntries(),
  ]);

  if (!projectsRes.ok) {
    return (
      <div className="flex flex-col gap-2">
        <PageHeader title="Time" />
        <p className="text-destructive text-sm">{projectsRes.message}</p>
      </div>
    );
  }

  if (!entriesRes.ok) {
    return (
      <div className="flex flex-col gap-2">
        <PageHeader title="Time" />
        <p className="text-destructive text-sm">{entriesRes.message}</p>
      </div>
    );
  }

  return (
    <TimeTracker
      projects={projectsRes.projects}
      entries={entriesRes.entries}
    />
  );
}
