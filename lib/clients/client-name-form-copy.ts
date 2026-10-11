export type ClientNameFormKind = "person" | "organization";

type NameKindSeed = {
  company?: string | null;
  contact_name?: string | null;
};

/** Edit/create: infer organization flow when a second-line or contact field is already set. */
export function initialClientNameFormKind(seed: NameKindSeed): ClientNameFormKind {
  if (seed.company?.trim() || seed.contact_name?.trim()) {
    return "organization";
  }
  return "person";
}

export function clientNameFormCopy(kind: ClientNameFormKind) {
  const isPerson = kind === "person";
  return {
    kindLegend: "This client is mainly",
    kindPersonLabel: "A person or sole contact",
    kindOrgLabel: "A company or team",
    nameLabel: isPerson ? "Contact name" : "Company name",
    nameHelper: isPerson
      ? "This is how the client appears in your workspace, lists, and on client-facing documents you send from Manpower."
      : "Your workspace, lists, and client-facing documents use this company name as the main title.",
    namePlaceholder: isPerson ? "e.g. Jane Doe" : "e.g. Acme Design Ltd",
    nameAutocomplete: isPerson ? "name" : "organization",
    contactNameLabel: "Primary contact (optional)",
    contactNameHelper:
      "The main person you work with—useful when the company name is not a person’s name.",
    contactNamePlaceholder: "e.g. Jane Doe",
    companyLabel: isPerson
      ? "Company they work for (optional)"
      : "Legal or billing name (optional)",
    companyHelper: isPerson
      ? "Their employer or team name, if different from the display name above."
      : "Only if it differs from the company name above (e.g. registered legal name or DBA).",
  };
}
