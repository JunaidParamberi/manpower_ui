/**
 * Derives two-letter initials for avatar fallback from profile name or email.
 */
export function getUserInitials(
  fullName: string | null,
  email: string | null,
): string {
  const trimmed = fullName?.trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const a = parts[0]?.[0];
      const b = parts[parts.length - 1]?.[0];
      if (a && b) return `${a}${b}`.toUpperCase();
    }
    return trimmed.slice(0, 2).toUpperCase();
  }
  if (email && email.length >= 2) return email.slice(0, 2).toUpperCase();
  return "?";
}
