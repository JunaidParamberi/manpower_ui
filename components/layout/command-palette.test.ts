import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("CommandPalette mobile escape route", () => {
  const source = readFileSync(
    path.join(process.cwd(), "components/layout/command-palette.tsx"),
    "utf8",
  );

  it("renders an esc hint for closing the palette", () => {
    expect(source).toMatch(/<KbdHint[\s\S]*?>esc<\/KbdHint>/);
  });

  it("hides desktop keyboard hints on mobile", () => {
    expect(source).toMatch(/hidden sm:inline/);
  });

  it("renders browse and search section headings", () => {
    expect(source).toMatch(/heading="Recent"/);
    expect(source).toMatch(/heading="Pinned"/);
    expect(source).toMatch(/heading="Clients"/);
  });

  it("uses search-only copy without AI branding", () => {
    expect(source).toMatch(/Search clients, projects, documents/);
    expect(source).not.toMatch(/Ask Manpower/);
    expect(source).not.toMatch(/Router · Haiku/);
  });
});
