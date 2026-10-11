export type CompanionVariant = "auth" | "profile" | "brand" | "client";

export type CompanionValues = {
  fullName?: string;
  companyName?: string;
  country?: string;
  currency?: string;
  primaryColor?: string;
  secondaryColor?: string;
  font?: string;
};

function clean(v?: string): string {
  return (v ?? "").trim();
}

export function variantForStep(step: 1 | 2 | 3): CompanionVariant {
  return step === 1 ? "profile" : step === 2 ? "brand" : "client";
}

const HEADLINES: Record<CompanionVariant, string> = {
  auth: "Your studio, running itself in the background.",
  profile: "This is what your clients will see.",
  brand: "Watch your brand come to life.",
  client: "Your client's view of you.",
};

export function companionHeadline(variant: CompanionVariant): string {
  return HEADLINES[variant];
}

export function displayStudioName(values: CompanionValues): string {
  return clean(values.companyName) || clean(values.fullName) || "Your studio";
}

export function displayInvoiceMeta(values: CompanionValues): {
  name: string;
  sub: string;
  currencyBadge: string;
} {
  const company = clean(values.companyName);
  const name = clean(values.fullName);
  return {
    name: company || name || "Your studio",
    sub: company ? name || "Add your name" : name ? "Sole trader" : "Add your name",
    currencyBadge: clean(values.currency) || "USD",
  };
}
