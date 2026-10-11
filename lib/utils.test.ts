import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn — refined type scale", () => {
  it("keeps a refined size next to a colour class", () => {
    expect(cn("text-meta", "text-[var(--fg-3)]")).toBe("text-meta text-[var(--fg-3)]");
    expect(cn("text-body text-muted-foreground")).toBe("text-body text-muted-foreground");
    expect(cn("text-label", "text-foreground")).toBe("text-label text-foreground");
    expect(cn("text-card-title", "text-foreground")).toBe("text-card-title text-foreground");
  });

  it("treats refined sizes as font sizes when they conflict with another size", () => {
    expect(cn("text-sm", "text-meta")).toBe("text-meta");
    expect(cn("text-body", "text-xs")).toBe("text-xs");
  });
});
