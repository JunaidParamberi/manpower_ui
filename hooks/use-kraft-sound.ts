"use client";

import { useCallback, useMemo, useRef, useSyncExternalStore } from "react";
import useSound from "use-sound";

import {
  DEFAULT_KRAFT_SOUND_PREFS,
  KRAFT_SOUND_KEY,
  KRAFT_VOLUME_KEY,
  clampVolume,
  clipVolume,
  parseSoundEnabled,
  parseVolume,
  serializeSoundEnabled,
  type KraftSoundPrefs,
} from "@/lib/kraft/sound-prefs";
import { KRAFT_SOUND_GAIN, kraftSoundSrc, shouldThrottle, type KraftSound } from "@/lib/kraft/sounds";

const PREFS_EVENT = "kraft-sound-prefs";

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage: the preference just won't persist.
  }
  window.dispatchEvent(new Event(PREFS_EVENT));
}

let cachedRaw: string | null = null;
let cachedPrefs: KraftSoundPrefs = DEFAULT_KRAFT_SOUND_PREFS;

function getSnapshot(): KraftSoundPrefs {
  const enabledRaw = readStorage(KRAFT_SOUND_KEY);
  const volumeRaw = readStorage(KRAFT_VOLUME_KEY);
  const raw = `${enabledRaw}|${volumeRaw}`;
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedPrefs = { enabled: parseSoundEnabled(enabledRaw), volume: parseVolume(volumeRaw) };
  }
  return cachedPrefs;
}

function getServerSnapshot(): KraftSoundPrefs {
  return DEFAULT_KRAFT_SOUND_PREFS;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(PREFS_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(PREFS_EVENT, onChange);
  };
}

/**
 * Kraft's sound preferences (on/off + master volume), persisted in
 * `localStorage` and shared live across every component and tab. The drawer
 * header's speaker button uses `setEnabled`; a future Settings → Preferences
 * control can use `setVolume` with no player changes.
 */
export function useKraftSoundPrefs() {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setEnabled = useCallback((enabled: boolean) => {
    writeStorage(KRAFT_SOUND_KEY, serializeSoundEnabled(enabled));
  }, []);

  const setVolume = useCallback((volume: number) => {
    writeStorage(KRAFT_VOLUME_KEY, String(clampVolume(volume)));
  }, []);

  return { ...prefs, setEnabled, setVolume };
}

type PlayFunction = () => void;

function useClip(sound: KraftSound, prefs: KraftSoundPrefs): PlayFunction {
  const [play] = useSound(kraftSoundSrc(sound), {
    volume: clipVolume(prefs, KRAFT_SOUND_GAIN[sound]),
    soundEnabled: prefs.enabled,
    interrupt: true,
  });
  return play;
}

/**
 * Plays Kraft's clips. Mount once (the launcher owns it) so each event
 * sounds once, not once per face. Quiet by design: low master volume,
 * per-clip trims, per-clip throttling, and nothing while the tab is hidden.
 * Browsers block audio until the first user gesture; Howler unlocks it then
 * and earlier calls are simply dropped.
 */
export function useKraftSound(): { play: (sound: KraftSound) => void } {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const players: Record<KraftSound, PlayFunction> = {
    greet: useClip("greet", prefs),
    open: useClip("open", prefs),
    close: useClip("close", prefs),
    thinking: useClip("thinking", prefs),
    working: useClip("working", prefs),
    surprised: useClip("surprised", prefs),
    confirm: useClip("confirm", prefs),
    success: useClip("success", prefs),
    proud: useClip("proud", prefs),
    error: useClip("error", prefs),
    sleepy: useClip("sleepy", prefs),
  };

  const playersRef = useRef(players);
  playersRef.current = players;
  const enabledRef = useRef(prefs.enabled);
  enabledRef.current = prefs.enabled;
  const lastPlayedAt = useRef<Partial<Record<KraftSound, number>>>({});

  const play = useCallback((sound: KraftSound) => {
    if (!enabledRef.current || document.hidden) {
      return;
    }
    const now = performance.now();
    if (shouldThrottle(sound, lastPlayedAt.current[sound], now)) {
      return;
    }
    lastPlayedAt.current[sound] = now;
    try {
      playersRef.current[sound]();
    } catch {
      // Audio is a nicety; never let it break the panel.
    }
  }, []);

  return useMemo(() => ({ play }), [play]);
}
