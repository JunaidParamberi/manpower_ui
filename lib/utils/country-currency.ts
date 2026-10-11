const COUNTRY_TO_CURRENCY: Record<string, string> = {
  AE: "AED", SA: "SAR", QA: "QAR", BH: "BHD", KW: "KWD", OM: "OMR",
  US: "USD", GB: "GBP", CA: "CAD", AU: "AUD", NZ: "NZD",
  EU: "EUR", DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR",
  BE: "EUR", AT: "EUR", PT: "EUR", IE: "EUR", FI: "EUR", GR: "EUR",
  IN: "INR", PK: "PKR", BD: "BDT", LK: "LKR",
  JP: "JPY", CN: "CNY", KR: "KRW", SG: "SGD", HK: "HKD", MY: "MYR",
  PH: "PHP", TH: "THB", ID: "IDR", VN: "VND",
  ZA: "ZAR", NG: "NGN", KE: "KES", EG: "EGP", GH: "GHS",
  BR: "BRL", MX: "MXN", AR: "ARS", CL: "CLP", CO: "COP",
  TR: "TRY", IL: "ILS", JO: "JOD", LB: "LBP",
  SE: "SEK", NO: "NOK", DK: "DKK", CH: "CHF", PL: "PLN", CZ: "CZK",
  RO: "RON", HU: "HUF", RU: "RUB", UA: "UAH",
};

export function currencyForCountry(countryCode: string | null | undefined): string | null {
  if (!countryCode) return null;
  return COUNTRY_TO_CURRENCY[countryCode.toUpperCase().trim()] ?? null;
}
