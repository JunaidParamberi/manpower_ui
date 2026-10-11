import { describe, expect, it } from "vitest";

import { KRAFT_EMOTIONS } from "./emotions";
import {
  KRAFT_DEFAULT_VOLUME,
  clampVolume,
  clipVolume,
  parseSoundEnabled,
  parseVolume,
  serializeSoundEnabled,
} from "./sound-prefs";
import { KRAFT_SOUNDS, KRAFT_SOUND_GAIN, kraftSoundSrc, shouldThrottle, soundForTransition } from "./sounds";

const open = { drawerOpen: true };
const closed = { drawerOpen: false };

describe("soundForTransition", () => {
  it("plays the emotion's clip on a change", () => {
    expect(soundForTransition("idle", "thinking", closed)).toBe("thinking");
    expect(soundForTransition("thinking", "working", closed)).toBe("working");
    expect(soundForTransition("working", "surprised", closed)).toBe("surprised");
    expect(soundForTransition("working", "confirm", closed)).toBe("confirm");
    expect(soundForTransition("working", "success", closed)).toBe("success");
    expect(soundForTransition("success", "proud", closed)).toBe("proud");
    expect(soundForTransition("thinking", "error", closed)).toBe("error");
    expect(soundForTransition("idle", "greet", open)).toBe("greet");
  });

  it("never plays for idle or listening", () => {
    for (const prev of KRAFT_EMOTIONS) {
      expect(soundForTransition(prev, "idle", open)).toBeNull();
      expect(soundForTransition(prev, "listening", open)).toBeNull();
    }
  });

  it("stays silent without a change", () => {
    expect(soundForTransition("success", "success", open)).toBeNull();
    expect(soundForTransition("working", "working", open)).toBeNull();
  });

  it("replays working for each new tool start", () => {
    expect(soundForTransition("working", "working", { ...closed, prevToolStarts: 1, nextToolStarts: 2 })).toBe("working");
    expect(soundForTransition("working", "working", { ...closed, prevToolStarts: 2, nextToolStarts: 2 })).toBeNull();
  });

  it("keeps dozing off and waking up silent while the drawer is closed", () => {
    expect(soundForTransition("idle", "sleepy", closed)).toBeNull();
    expect(soundForTransition("sleepy", "surprised", closed)).toBeNull();
    expect(soundForTransition("idle", "sleepy", open)).toBe("sleepy");
    expect(soundForTransition("sleepy", "surprised", open)).toBe("surprised");
  });

  it("still plays a mid-run surprise with the drawer closed", () => {
    expect(soundForTransition("working", "surprised", closed)).toBe("surprised");
  });
});

describe("shouldThrottle", () => {
  it("blocks the same clip within its window", () => {
    expect(shouldThrottle("success", 1000, 1100)).toBe(true);
    expect(shouldThrottle("success", 1000, 1120)).toBe(false);
    expect(shouldThrottle("success", undefined, 0)).toBe(false);
  });

  it("spaces out repeated tool ticks", () => {
    expect(shouldThrottle("working", 1000, 1800)).toBe(true);
    expect(shouldThrottle("working", 1000, 2300)).toBe(false);
  });
});

describe("clips", () => {
  it("maps every sound to a file under /sounds/kraft", () => {
    for (const sound of KRAFT_SOUNDS) {
      expect(kraftSoundSrc(sound)).toBe(`/sounds/kraft/${sound}.mp3`);
    }
  });

  it("keeps every clip at or below 80% of the master volume", () => {
    for (const sound of KRAFT_SOUNDS) {
      expect(KRAFT_SOUND_GAIN[sound]).toBeGreaterThan(0);
      expect(KRAFT_SOUND_GAIN[sound]).toBeLessThanOrEqual(0.8);
    }
  });
});

describe("sound prefs", () => {
  it("is on unless explicitly muted", () => {
    expect(parseSoundEnabled(null)).toBe(true);
    expect(parseSoundEnabled("on")).toBe(true);
    expect(parseSoundEnabled("off")).toBe(false);
    expect(serializeSoundEnabled(false)).toBe("off");
    expect(serializeSoundEnabled(true)).toBe("on");
  });

  it("parses and clamps the stored volume", () => {
    expect(parseVolume(null)).toBe(KRAFT_DEFAULT_VOLUME);
    expect(parseVolume("")).toBe(KRAFT_DEFAULT_VOLUME);
    expect(parseVolume("0.6")).toBe(0.6);
    expect(parseVolume("4")).toBe(1);
    expect(parseVolume("-1")).toBe(0);
    expect(parseVolume("loud")).toBe(KRAFT_DEFAULT_VOLUME);
    expect(clampVolume(Number.NaN)).toBe(KRAFT_DEFAULT_VOLUME);
  });

  it("is quiet by default", () => {
    expect(KRAFT_DEFAULT_VOLUME).toBeLessThanOrEqual(0.4);
    expect(clipVolume({ enabled: true, volume: KRAFT_DEFAULT_VOLUME }, 0.8)).toBeLessThan(0.3);
  });

  it("mutes every clip when sound is off", () => {
    expect(clipVolume({ enabled: false, volume: 1 }, 0.8)).toBe(0);
  });
});
