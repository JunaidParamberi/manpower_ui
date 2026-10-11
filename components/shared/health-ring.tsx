import { cn } from "@/lib/utils";

type HealthRingProps = {
  score: number | null;
  size?: number;
  strokeWidth?: number;
  className?: string;
};

function tintByBand(score: number): string {
  if (score >= 80) return "var(--success)";
  if (score >= 60) return "var(--warning)";
  return "var(--danger)";
}

export function HealthRing({
  score,
  size = 32,
  strokeWidth = 3,
  className,
}: HealthRingProps) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const normalizedScore = score ?? 0;
  const pct = Math.max(0, Math.min(100, normalizedScore)) / 100;
  const dash = pct * circ;
  const color = score === null ? "var(--fg-3)" : tintByBand(score);
  const label = score === null ? "-" : String(score);
  const labelClass = size >= 48 ? "text-sm" : "text-[10px]";

  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center",
        className,
      )}
      aria-label={score === null ? "Health score not set" : `Health score: ${score}`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        className="col-start-1 row-start-1 -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--bg-subtle)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          className="transition-[stroke-dasharray] duration-500 ease-out"
        />
      </svg>
      <span
        className={cn(
          "col-start-1 row-start-1 font-semibold tabular-nums text-foreground",
          labelClass,
        )}
        aria-hidden="true"
      >
        {label}
      </span>
    </span>
  );
}
