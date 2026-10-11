export const CLIENT_TABS = ["overview", "projects", "documents", "activity", "about"] as const;
export type ClientTab = (typeof CLIENT_TABS)[number];

export function parseClientTab(value: string | string[] | null | undefined): ClientTab {
  const raw = Array.isArray(value) ? value[0] : value;
  return (CLIENT_TABS as readonly string[]).includes(raw ?? "") ? (raw as ClientTab) : "overview";
}
