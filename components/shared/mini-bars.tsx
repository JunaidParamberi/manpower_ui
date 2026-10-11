type MiniBarsProps = {
  values: number[];
  color?: string;
  height?: number;
  barWidth?: number;
  gap?: number;
  className?: string;
};

export function MiniBars({
  values,
  color = "var(--border-focus)",
  height = 28,
  barWidth = 4,
  gap = 2,
  className,
}: MiniBarsProps) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "flex-end",
        gap,
        height,
      }}
    >
      {values.map((v, i) => (
        <div
          key={i}
          style={{
            width: barWidth,
            height: Math.max(2, (v / max) * height),
            borderRadius: 2,
            background: color,
            opacity: 0.7 + (v / max) * 0.3,
            transition: "height 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}
