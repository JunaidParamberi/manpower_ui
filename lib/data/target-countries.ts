/**
 * Launch markets only. Per CLAUDE.md: UAE, UK, US, MENA (KSA, Qatar, Bahrain,
 * Kuwait, Oman, Egypt), India. Sorted by likely user volume.
 */
export type TargetCountry = { code: string; name: string };

export const TARGET_COUNTRIES: TargetCountry[] = [
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "QA", name: "Qatar" },
  { code: "KW", name: "Kuwait" },
  { code: "BH", name: "Bahrain" },
  { code: "OM", name: "Oman" },
  { code: "EG", name: "Egypt" },
  { code: "IN", name: "India" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
];

export function targetCountryLabel(code: string | null | undefined): string | undefined {
  if (!code) return undefined;
  return TARGET_COUNTRIES.find((c) => c.code === code.toUpperCase())?.name;
}
