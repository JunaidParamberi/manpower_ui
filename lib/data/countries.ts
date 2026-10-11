import enLocale from "i18n-iso-countries/langs/en.json";
import { getNames, registerLocale } from "i18n-iso-countries";

import type { LocaleData } from "i18n-iso-countries";

registerLocale(enLocale as LocaleData);

export type CountryOption = {
  code: string;
  name: string;
};

/**
 * ISO 3166-1 alpha-2 codes with English official names, sorted A–Z by name.
 */
export const COUNTRIES: CountryOption[] = Object.entries(
  getNames("en", { select: "official" }),
)
  .map(([code, name]) => ({
    code,
    name: typeof name === "string" ? name : String(name),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function countryLabel(code: string | null | undefined): string | undefined {
  if (!code || code.length !== 2) return undefined;
  const upper = code.toUpperCase();
  return COUNTRIES.find((c) => c.code === upper)?.name;
}
