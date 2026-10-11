/** Client detail UI helpers — no IO. */

/** First line of notes, trimmed; used as optional tagline on detail header. */
export function clientTaglineFromNotes(notes: string | null): string | null {
  if (!notes?.trim()) {
    return null;
  }
  const line = notes.trim().split(/\r?\n/)[0] ?? "";
  if (!line) {
    return null;
  }
  return line.length > 160 ? `${line.slice(0, 157)}…` : line;
}

/** Monogram: first letter of first two words, uppercase. */
export function clientMonogram(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function formatClientSince(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return "";
    }
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return "";
  }
}

/** Full timestamp for “Last updated” footers. */
export function formatLastUpdated(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return "";
    }
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return "";
  }
}

export type HealthPresentation = {
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive";
};

/** Map DB health_score (0–100) to a short label for the badge. */
export function healthPresentation(
  score: number | null,
): HealthPresentation | null {
  if (score === null) {
    return null;
  }
  if (score >= 80) {
    return { label: "Excellent health", variant: "default" };
  }
  if (score >= 55) {
    return { label: "Healthy", variant: "secondary" };
  }
  if (score >= 30) {
    return { label: "Needs attention", variant: "outline" };
  }
  return { label: "At risk", variant: "destructive" };
}

/**
 * Shorter labels for dense tables (list wireframe).
 * Variants stay aligned with {@link healthPresentation}.
 */
export function healthPresentationCompact(
  score: number | null,
): HealthPresentation | null {
  const pr = healthPresentation(score);
  if (!pr) {
    return null;
  }
  const label =
    pr.label === "Excellent health"
      ? "Excellent"
      : pr.label === "Healthy"
        ? "Good"
        : pr.label === "Needs attention"
          ? "Fair"
          : pr.label;
  return { label, variant: pr.variant };
}

/** Bucket key for client-side health filtering on the list. */
export type ClientHealthBucket =
  | "excellent"
  | "good"
  | "fair"
  | "risk"
  | "unset";

export function clientHealthBucket(
  score: number | null,
): ClientHealthBucket | null {
  if (score === null) {
    return null;
  }
  if (score >= 80) {
    return "excellent";
  }
  if (score >= 55) {
    return "good";
  }
  if (score >= 30) {
    return "fair";
  }
  return "risk";
}
