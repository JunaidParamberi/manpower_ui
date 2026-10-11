import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Wraps text in the module's signature gradient (blue -> violet -> rose),
 * matching the headline treatment from the onboarding-complete loader.
 * Hexes are hardcoded (not imported from palette.ts) because Tailwind's JIT
 * scanner needs literal class strings to generate the gradient utilities.
 */
export function GradientText({
  as: Tag = "span",
  className,
  children,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag
      className={cn(
        "bg-gradient-to-r from-[#3550E0] via-[#7C5CFF] to-[#F2557A] bg-clip-text text-transparent",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
