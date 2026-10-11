import type { ReactNode } from "react";

type SkeletonRepeatProps = {
  count: number;
  render: (index: number) => ReactNode;
};

/** Renders `count` skeleton children; renders nothing when count is 0. */
export function SkeletonRepeat({ count, render }: SkeletonRepeatProps) {
  if (count <= 0) {
    return null;
  }
  return (
    <>
      {Array.from({ length: count }, (_, i) => render(i))}
    </>
  );
}
