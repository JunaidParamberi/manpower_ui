/**
 * Kraft's sound preferences, stored per browser in `localStorage`.
 *
 * - `kraft-sound`: `"off"` means muted (anything else, or nothing, is on).
 * - `kraft-sound-volume`: 0–1, defaults to a quiet 0.35.
 *
 * Read and written through `useKraftSoundPrefs()` in `hooks/use-kraft-sound.ts`,
 * which the drawer's speaker toggle uses today and a Settings → Preferences
 * control can reuse later without touching the player.
 */

export const KRAFT_SOUND_KEY = "kraft-sound";
export const KRAFT_VOLUME_KEY = "kraft-sound-volume";

export const KRAFT_DEFAULT_VOLUME = 0.35;

export type KraftSoundPrefs = {
  enabled: boolean;
  /** Master volume, 0–1. Each clip's gain is applied on top. */
  volume: number;
};

export const DEFAULT_KRAFT_SOUND_PREFS: KraftSoundPrefs = {
  enabled: true,
  volume: KRAFT_DEFAULT_VOLUME,
};

export function parseSoundEnabled(raw: string | null): boolean {
  return raw !== "off";
}

export function serializeSoundEnabled(enabled: boolean): string {
  return enabled ? "on" : "off";
}

export function clampVolume(value: number): number {
  if (!Number.isFinite(value)) {
    return KRAFT_DEFAULT_VOLUME;
  }
  return Math.min(1, Math.max(0, value));
}

export function parseVolume(raw: string | null): number {
  if (raw === null || raw.trim() === "") {
    return KRAFT_DEFAULT_VOLUME;
  }
  return clampVolume(Number(raw));
}

/** Final playback volume for one clip. */
export function clipVolume(prefs: KraftSoundPrefs, gain: number): number {
  return prefs.enabled ? clampVolume(prefs.volume * gain) : 0;
}
