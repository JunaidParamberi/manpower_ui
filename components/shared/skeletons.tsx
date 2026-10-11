import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Base skeleton block — drives all derived components
// ---------------------------------------------------------------------------

type SkeletonProps = {
  w?: string | number;
  h?: number;
  r?: number;
  variant?: "text" | "textLg" | "circle" | "block";
  pulse?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export function Skeleton({
  w,
  h,
  r,
  variant,
  pulse = false,
  className,
  style,
}: SkeletonProps) {
  const heights: Record<string, number> = { text: 12, textLg: 18, block: 56 };
  const radii: Record<string, number> = { text: 4, textLg: 5, circle: 9999, block: 6 };

  const resolvedH = h ?? (variant ? heights[variant] ?? 12 : 12);
  const resolvedR = r ?? (variant ? radii[variant] ?? 4 : 4);

  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(pulse && "skeleton--pulse", className)}
      style={{
        width: variant === "circle" ? w ?? resolvedH : (w ?? "100%"),
        height: resolvedH,
        borderRadius: resolvedR,
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// SkeletonText — paragraph placeholder
// ---------------------------------------------------------------------------

type SkeletonTextProps = {
  lines?: number;
  lastWidth?: string;
  className?: string;
};

export function SkeletonText({ lines = 3, lastWidth = "62%", className }: SkeletonTextProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} w={i === lines - 1 ? lastWidth : "100%"} h={12} r={4} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SkeletonAvatar
// ---------------------------------------------------------------------------

export function SkeletonAvatar({ size = 28 }: { size?: number }) {
  return <Skeleton variant="circle" w={size} h={size} />;
}

// ---------------------------------------------------------------------------
// SkeletonKPI — mirrors KpiCard exactly
// ---------------------------------------------------------------------------

export function SkeletonKPI({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-xl border border-border bg-card px-4 py-4 flex flex-col",
        className
      )}
    >
      {/* label + delta badge row */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <Skeleton w="40%" h={10} r={3} />
        <Skeleton w={36} h={18} r={4} />
      </div>
      {/* big number */}
      <Skeleton w="55%" h={26} r={4} />
      {/* sub line */}
      <Skeleton w="45%" h={10} r={3} style={{ marginTop: 8 }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// SkeletonChart — SVG silhouette (pulse, not shimmer)
// ---------------------------------------------------------------------------

type SkeletonChartProps = {
  height?: number;
  className?: string;
};

export function SkeletonChart({ height = 210, className }: SkeletonChartProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("w-full rounded-lg overflow-hidden", className)}
      style={{ height }}
    >
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 600 ${height}`}
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* dashed grid lines */}
        {[0.25, 0.5, 0.75].map((pct) => (
          <line
            key={pct}
            x1={0}
            y1={height * pct}
            x2={600}
            y2={height * pct}
            stroke="var(--border)"
            strokeDasharray="4 4"
            strokeOpacity={0.6}
          />
        ))}
        {/* calm area silhouette */}
        <path
          d={`M0,${height * 0.65} C80,${height * 0.55} 160,${height * 0.45} 240,${height * 0.5} S380,${height * 0.35} 480,${height * 0.3} S560,${height * 0.4} 600,${height * 0.38} L600,${height} L0,${height} Z`}
          fill="var(--bg-subtle)"
          opacity={0.7}
        />
        <path
          d={`M0,${height * 0.65} C80,${height * 0.55} 160,${height * 0.45} 240,${height * 0.5} S380,${height * 0.35} 480,${height * 0.3} S560,${height * 0.4} 600,${height * 0.38}`}
          fill="none"
          stroke="var(--border)"
          strokeWidth={1.5}
        />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SkeletonListRow / SkeletonList
// ---------------------------------------------------------------------------

type SkeletonListRowProps = {
  withAvatar?: boolean;
  withMeta?: boolean;
};

export function SkeletonListRow({ withAvatar = true, withMeta = true }: SkeletonListRowProps) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      {withAvatar && <SkeletonAvatar size={32} />}
      <div className="flex flex-1 flex-col gap-1.5 min-w-0">
        <Skeleton w="65%" h={12} r={3} />
        {withMeta && <Skeleton w="40%" h={10} r={3} />}
      </div>
      <Skeleton w={48} h={10} r={3} />
    </div>
  );
}

type SkeletonListProps = {
  count?: number;
  withAvatar?: boolean;
  className?: string;
};

export function SkeletonList({ count = 5, withAvatar = false, className }: SkeletonListProps) {
  return (
    <div className={cn("flex flex-col divide-y divide-border/50", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonListRow key={i} withAvatar={withAvatar} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SkeletonTableRow / SkeletonTable
// ---------------------------------------------------------------------------

type SkeletonTableRowProps = {
  cols?: number;
};

export function SkeletonTableRow({ cols = 5 }: SkeletonTableRowProps) {
  const widths = ["28%", "20%", "15%", "12%", "10%", "8%", "8%"];
  return (
    <tr aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3 border-b border-border/40">
          <Skeleton w={widths[i] ?? "12%"} h={12} r={3} />
        </td>
      ))}
    </tr>
  );
}

type SkeletonTableProps = {
  rows?: number;
  cols?: number;
  headers?: string[];
};

export function SkeletonTable({ rows = 5, cols = 5, headers }: SkeletonTableProps) {
  return (
    <table className="w-full border-collapse" aria-hidden="true">
      {headers && (
        <thead>
          <tr className="border-b border-border">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2.5 text-left">
                <Skeleton w={`${Math.max(30, 100 - i * 10)}%`} h={10} r={3} />
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonTableRow key={i} cols={cols} />
        ))}
      </tbody>
    </table>
  );
}

// ---------------------------------------------------------------------------
// SkeletonCard
// ---------------------------------------------------------------------------

type SkeletonCardProps = {
  title?: boolean;
  body?: boolean;
  lines?: number;
  height?: number;
  className?: string;
};

export function SkeletonCard({
  title = true,
  body = true,
  lines = 3,
  height,
  className,
}: SkeletonCardProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("rounded-xl border border-border bg-card p-4 flex flex-col gap-3", className)}
      style={height ? { height } : undefined}
    >
      {title && <Skeleton w="40%" h={14} r={4} />}
      {body && <SkeletonText lines={lines} />}
    </div>
  );
}
