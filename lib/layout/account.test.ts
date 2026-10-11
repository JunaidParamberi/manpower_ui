import { describe, expect, it } from "vitest";

import { AVATAR_PALETTES, avatarPalette, canUpgrade, planUsageRows } from "./account";

describe("avatarPalette", () => {
  it("is stable for the same initials", () => {
    expect(avatarPalette("LH")).toEqual(avatarPalette("LH"));
  });

  it("always returns one of the palettes", () => {
    for (const initials of ["", "A", "LH", "ZZZZ"]) {
      expect(AVATAR_PALETTES).toContainEqual(avatarPalette(initials));
    }
  });
});

describe("canUpgrade", () => {
  it("is true below Pro and false from Pro up", () => {
    expect(canUpgrade("free")).toBe(true);
    expect(canUpgrade("starter")).toBe(true);
    expect(canUpgrade("pro")).toBe(false);
    expect(canUpgrade("agency")).toBe(false);
  });
});

describe("planUsageRows", () => {
  it("reports clients and documents against the plan's limits", () => {
    const rows = planUsageRows({ planTier: "free", clientCount: 3, docCountThisMonth: 1 });
    expect(rows.map((r) => r.key)).toEqual(["clients", "docsPerMonth"]);
    expect(rows[0]).toMatchObject({ label: "Clients", used: 3 });
    expect(rows[0].limit).toBeGreaterThan(0);
    expect(rows[1]).toMatchObject({ label: "Documents this month", used: 1 });
  });

  it("marks a row as danger near its limit", () => {
    const [clients] = planUsageRows({ planTier: "free", clientCount: 1000, docCountThisMonth: 0 });
    expect(clients.level).toBe("danger");
    expect(clients.ratio).toBe(1);
  });

  it("drops unlimited rows", () => {
    const rows = planUsageRows({ planTier: "agency", clientCount: 40, docCountThisMonth: 90 });
    expect(rows.every((r) => Number.isFinite(r.limit))).toBe(true);
  });
});
