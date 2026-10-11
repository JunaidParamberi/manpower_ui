type PillVariant = "default" | "success" | "warn" | "accent";

type DocStatusPillProps = {
  label: string;
  variant?: PillVariant;
  dot?: boolean;
};

const VARIANT_CLASS: Record<PillVariant, string> = {
  default: "pill",
  success: "pill pill--success",
  warn: "pill pill--warn",
  accent: "pill pill--accent",
};

export function DocStatusPill({ label, variant = "default", dot = true }: DocStatusPillProps) {
  const cls = VARIANT_CLASS[variant] + (dot ? " pill--dot" : "");
  return <span className={cls}>{label}</span>;
}
