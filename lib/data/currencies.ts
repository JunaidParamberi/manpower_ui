export type SupportedCurrencyCode =
  | "USD"
  | "EUR"
  | "GBP"
  | "AED"
  | "SAR"
  | "QAR"
  | "KWD"
  | "BHD"
  | "OMR"
  | "EGP"
  | "CAD"
  | "AUD"
  | "INR";

export type SupportedCurrency = {
  code: SupportedCurrencyCode;
  name: string;
};

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = [
  { code: "USD", name: "US dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British pound" },
  { code: "AED", name: "UAE dirham" },
  { code: "SAR", name: "Saudi riyal" },
  { code: "QAR", name: "Qatari riyal" },
  { code: "KWD", name: "Kuwaiti dinar" },
  { code: "BHD", name: "Bahraini dinar" },
  { code: "OMR", name: "Omani rial" },
  { code: "EGP", name: "Egyptian pound" },
  { code: "CAD", name: "Canadian dollar" },
  { code: "AUD", name: "Australian dollar" },
  { code: "INR", name: "Indian rupee" },
];

const currencyByCode = new Map(
  SUPPORTED_CURRENCIES.map((currency) => [currency.code, currency]),
);

export function normalizeCurrencyCode(value: string): string {
  return value.trim().toUpperCase();
}

export function isSupportedCurrencyCode(value: string): value is SupportedCurrencyCode {
  return currencyByCode.has(normalizeCurrencyCode(value) as SupportedCurrencyCode);
}

export function formatCurrencySelectLabel(value: string): string {
  const code = normalizeCurrencyCode(value);
  const currency = currencyByCode.get(code as SupportedCurrencyCode);
  return currency ? `${currency.code} - ${currency.name}` : code;
}

/** Narrow symbol for UI toggles (e.g. flat discount button). Falls back to code. */
export function getCurrencySymbol(currency: string): string {
  const code = normalizeCurrencyCode(currency);
  try {
    const parts = new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? code;
  } catch {
    return code;
  }
}
