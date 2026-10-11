/**
 * Helpers for 12-hour display/editing of `HH:mm` (24h) strings used in forms.
 */

export function clampMinute(raw: string): string {
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) {
    return "00";
  }
  const clamped = Math.min(59, Math.max(0, n));
  return String(clamped).padStart(2, "0");
}

export type Time12Parts = {
  hour12: number;
  minute: string;
  period: "am" | "pm";
};

export function parseHhmmTo12Parts(hhmm: string): Time12Parts | null {
  const t = hhmm.trim();
  if (!t) {
    return null;
  }
  const [a, b] = t.split(":");
  if (a === undefined || b === undefined) {
    return null;
  }
  const h24 = Number.parseInt(a.padStart(2, "0").slice(0, 2), 10);
  if (Number.isNaN(h24)) {
    return null;
  }
  const period: "am" | "pm" = h24 >= 12 ? "pm" : "am";
  let h12 = h24 % 12;
  if (h12 === 0) {
    h12 = 12;
  }
  return {
    hour12: h12,
    minute: clampMinute(b),
    period,
  };
}

export function hhmmFrom12Parts(parts: Time12Parts): string {
  let h = parts.hour12;
  if (Number.isNaN(h) || h < 1 || h > 12) {
    h = 12;
  }
  let h24: number;
  if (parts.period === "am") {
    h24 = h === 12 ? 0 : h;
  } else {
    h24 = h === 12 ? 12 : h + 12;
  }
  return `${String(h24).padStart(2, "0")}:${parts.minute}`;
}

/** e.g. `09:07` → `9:07 AM` */
export function formatHhmmAs12hClock(hhmm: string): string {
  const p = parseHhmmTo12Parts(hhmm);
  if (!p) {
    return "";
  }
  return `${p.hour12}:${p.minute} ${p.period === "am" ? "AM" : "PM"}`;
}
