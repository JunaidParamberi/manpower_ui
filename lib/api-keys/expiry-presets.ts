/**
 * Expiry presets for the API-key create dialog.
 *
 * Each preset resolves to the `yyyy-MM-dd` string the native `type="date"`
 * input produces, or `""` for "never". `expiryValueFor` is a pure resolver —
 * the dialog uses it both to highlight the active chip (`watch("expiresAt") ===
 * expiryValueFor(preset, watch("expiresAt"))`) and to stamp the value on click.
 * `now` is injectable so tests are deterministic; a real call passes
 * `new Date()`.
 */

export type ApiKeyExpiryPreset = {
  label: string;
  /** Short descriptor shown next to the preset (optional). */
  hint?: string;
  /** Days to offset from today, or `null` for "never". */
  calculateDays: number | null;
};

export const API_KEY_EXPIRY_PRESETS: readonly ApiKeyExpiryPreset[] = [
  { label: "30 days", calculateDays: 30 },
  { label: "90 days", calculateDays: 90 },
  { label: "1 year", calculateDays: 365 },
  { label: "Never", calculateDays: null, hint: "never expires" },
];

/**
 * Resolve a preset to a local-timezone `yyyy-MM-dd` string this many days out,
 * or `""` for "never" (`calculateDays === null`).
 *
 * Deliberately local-timezone math (getFullYear/getMonth/getDate — not
 * `toISOString`, which runs in UTC and can shift a given local day) so a preset
 * always lands on the same calendar day the user sees. `current` is accepted
 * for contract parity and future toggling (re-click to clear) but not used in
 * the resolution — the resolver stays deterministic.
 */
export function expiryValueFor(
  preset: ApiKeyExpiryPreset,
  _current: string,
  now: Date = new Date(),
): string {
  if (preset.calculateDays === null || preset.calculateDays === 0) return "";

  const d = new Date(now);
  d.setDate(d.getDate() + preset.calculateDays);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}
