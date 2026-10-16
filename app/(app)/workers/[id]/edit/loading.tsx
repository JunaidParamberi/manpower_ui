import { FormPageShell } from "@/components/shared/form-page-shell";
import { Skeleton } from "@/components/shared/skeletons";

/** Label + input pair, shaped like the worker form's Field. */
function FieldSkeleton({ labelWidth }: { labelWidth: number }) {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton w={labelWidth} h={12} r={4} />
      <Skeleton h={44} r={6} />
    </div>
  );
}

export default function EditWorkerLoading() {
  return (
    <FormPageShell maxWidth="3xl">
      <div className="flex flex-col gap-8" aria-busy="true" aria-label="Loading worker form">
        {/* PageHeader: back link, title, description */}
        <div className="flex flex-col gap-2">
          <Skeleton w={92} h={12} r={4} />
          <Skeleton w={224} h={28} r={6} />
          <Skeleton w={340} h={14} r={4} />
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-7">
            <FieldSkeleton labelWidth={84} />
            <FieldSkeleton labelWidth={44} />
            <FieldSkeleton labelWidth={74} />
            <FieldSkeleton labelWidth={110} />
            <FieldSkeleton labelWidth={54} />
            {/* Clients: label + chip row */}
            <div className="flex flex-col gap-2">
              <Skeleton w={44} h={12} r={4} />
              <div className="flex flex-wrap gap-2">
                <Skeleton w={96} h={30} r={15} />
                <Skeleton w={124} h={30} r={15} />
                <Skeleton w={84} h={30} r={15} />
              </div>
            </div>
            <FieldSkeleton labelWidth={44} />
            {/* Notes: label + textarea */}
            <div className="flex flex-col gap-2">
              <Skeleton w={40} h={12} r={4} />
              <Skeleton h={80} r={6} />
            </div>
          </div>
          {/* Submit + cancel buttons */}
          <div className="flex items-center gap-3">
            <Skeleton w={128} h={40} r={6} />
            <Skeleton w={76} h={40} r={6} />
          </div>
        </div>
      </div>
    </FormPageShell>
  );
}
