/**
 * Normalize PostgREST / Supabase embedded relation payloads (object or one-element array).
 */
export function pickEmbed<TKey extends string>(
  raw: unknown,
  labelKey: TKey,
): ({ id: string } & Record<TKey, string>) | null {
  if (raw == null) {
    return null;
  }
  const node = Array.isArray(raw) ? raw[0] : raw;
  if (
    node &&
    typeof node === "object" &&
    "id" in node &&
    labelKey in node &&
    (node as Record<string, unknown>)[labelKey] != null
  ) {
    return {
      id: String((node as Record<string, unknown>).id),
      [labelKey]: String((node as Record<string, unknown>)[labelKey]),
    } as { id: string } & Record<TKey, string>;
  }
  return null;
}
