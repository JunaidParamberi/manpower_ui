import { Skeleton } from "@/components/shared/skeletons";

export default function WorkerDetailLoading() {
  return (
    <div className="flex flex-col gap-6 p-6 lg:flex-row lg:gap-10">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <Skeleton w={240} h={28} r={6} />
          <Skeleton w={210} h={13} r={4} />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex gap-1 rounded-lg bg-muted p-[3px]">
            <Skeleton w={70} h={30} r={6} />
            <Skeleton w={95} h={30} r={6} />
            <Skeleton w={125} h={30} r={6} />
            <Skeleton w={100} h={30} r={6} />
          </div>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <Skeleton w={90} h={12} r={4} />
                <Skeleton w={150} h={16} r={4} />
              </div>
            ))}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Skeleton w={55} h={12} r={4} />
              <div className="flex gap-2 pt-1">
                <Skeleton w={120} h={30} r={9999} />
                <Skeleton w={100} h={30} r={9999} />
              </div>
            </div>
          </dl>
        </div>
      </div>
      <div className="flex w-full shrink-0 flex-col gap-2 lg:w-64">
        <Skeleton w={50} h={13} r={4} />
        <Skeleton w="100%" h={44} r={6} />
      </div>
    </div>
  );
}
