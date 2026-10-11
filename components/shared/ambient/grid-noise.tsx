import { cn } from "@/lib/utils";

/** Faint radial-dot grid, masked to fade at the edges. Ported from the loader. */
export function GridNoise({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 opacity-[0.4] [background-image:radial-gradient(var(--accent-soft-2)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]",
        className,
      )}
    />
  );
}
