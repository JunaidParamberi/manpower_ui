/** Module palette shared by the onboarding-complete loader, auth, and onboarding. */
export const AMBIENT_COLORS = {
  blue: "#3550E0",
  violet: "#7C5CFF",
  teal: "#12B5A6",
  amber: "#F5A524",
  rose: "#F2557A",
} as const;

export const AMBIENT_PALETTE: readonly string[] = [
  AMBIENT_COLORS.blue,
  AMBIENT_COLORS.violet,
  AMBIENT_COLORS.teal,
  AMBIENT_COLORS.amber,
  AMBIENT_COLORS.rose,
];

export const GRADIENT_STOPS: readonly [string, string, string] = [
  AMBIENT_COLORS.blue,
  AMBIENT_COLORS.violet,
  AMBIENT_COLORS.rose,
];
