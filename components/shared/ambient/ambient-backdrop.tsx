import { cn } from "@/lib/utils";

import { Aurora } from "./aurora";
import { GridNoise } from "./grid-noise";
import { Sparkles } from "./sparkles";

type AmbientDensity = "soft" | "default";

/**
 * Composed Aurora + GridNoise + Sparkles wash. Default className positions it
 * as a full-bleed absolute layer; pass `className` to override (e.g. `fixed`
 * for a layer that should stay put while the page scrolls).
 */
export function AmbientBackdrop({
  reduced,
  density = "default",
  className,
}: {
  reduced: boolean;
  density?: AmbientDensity;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 z-0", className)}
    >
      <Aurora reduced={reduced} density={density} />
      <GridNoise />
      <Sparkles reduced={reduced} density={density} />
    </div>
  );
}
