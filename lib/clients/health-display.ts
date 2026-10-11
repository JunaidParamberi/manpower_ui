import type { HealthBand, HealthSeverity, HealthSignalKind } from "./health-facts";

const SIGNAL_KIND_LABEL: Record<HealthSignalKind, string> = {
  overdue_invoices: "Overdue invoices",
  slow_payer: "Slow payer",
  gone_quiet: "Gone quiet",
  revenue_decline: "Revenue declining",
  stalled_pipeline: "Pipeline stalled",
  no_active_work: "No active work",
};

export function signalKindLabel(kind: HealthSignalKind): string {
  return SIGNAL_KIND_LABEL[kind];
}

const SEVERITY_TONE: Record<HealthSeverity, "default" | "secondary" | "outline" | "destructive"> = {
  info: "outline",
  warning: "secondary",
  critical: "destructive",
};

export function severityTone(
  severity: HealthSeverity,
): "default" | "secondary" | "outline" | "destructive" {
  return SEVERITY_TONE[severity];
}

/** Mirrors healthPresentation() labels in lib/clients/display.ts — keep in sync. */
const BAND_LABEL: Record<HealthBand, string> = {
  excellent: "Excellent health",
  healthy: "Healthy",
  needs_attention: "Needs attention",
  at_risk: "At risk",
};

export function bandLabel(band: HealthBand): string {
  return BAND_LABEL[band];
}
