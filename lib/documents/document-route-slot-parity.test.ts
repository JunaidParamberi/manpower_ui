import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The documents list pane is served by a parallel route slot (`@list`), and
 * slot trees resolve INDEPENDENTLY of the children tree. Nothing in TypeScript,
 * ESLint, `next build` or Storybook notices when a children route has no slot
 * page beside it — this task shipped exactly that once, and every one of those
 * checks stayed green while type filtering was completely inert, because the
 * unmatched slot fell through to a page that rendered a plausible unfiltered
 * list.
 *
 * So the parity is asserted here instead, at the filesystem level. Adding a
 * route under app/(app)/documents/ now fails this test until its slot page
 * exists, or until it is consciously declared full-bleed below.
 */

const DOCUMENTS_DIR = path.join(
  process.cwd(),
  "app",
  "(app)",
  "documents",
);
const SLOT_DIR = path.join(DOCUMENTS_DIR, "@list");

/**
 * Routes that render full-bleed: `DocumentsShell` returns early on these and
 * never renders the aside, so a slot page would be dead code. Adding to this
 * set is a deliberate statement that the route has no list pane — do not add
 * to it to silence a failure.
 */
const FULL_BLEED_SEGMENTS = new Set(["new"]);

function childDirectoriesWithPages(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith("@"))
    .filter((name) =>
      fs.existsSync(path.join(dir, name, "page.tsx")),
    );
}

describe("documents @list slot parity", () => {
  it("has a slot page for the /documents index", () => {
    expect(fs.existsSync(path.join(DOCUMENTS_DIR, "page.tsx"))).toBe(true);
    expect(fs.existsSync(path.join(SLOT_DIR, "page.tsx"))).toBe(true);
  });

  it("has a slot page beside every children route that renders the pane", () => {
    const children = childDirectoriesWithPages(DOCUMENTS_DIR);

    // Guard against the test silently passing because the glob broke.
    expect(children).toContain("invoices");
    expect(children.length).toBeGreaterThan(3);

    const missing = children
      .filter((segment) => !FULL_BLEED_SEGMENTS.has(segment))
      .filter(
        (segment) =>
          !fs.existsSync(path.join(SLOT_DIR, segment, "page.tsx")),
      );

    expect(
      missing,
      `Missing @list slot pages for: ${missing.join(", ")}. Without one, the ` +
        `route falls through to another slot page and can render the wrong ` +
        `list. Add app/(app)/documents/@list/<segment>/page.tsx, or add the ` +
        `segment to FULL_BLEED_SEGMENTS if it has no list pane.`,
    ).toEqual([]);
  });

  it("hard-codes each type slot page's own slug", () => {
    // A slot page that forgot its literal slug would render the unfiltered
    // list — the original defect. Assert the slug is actually there.
    for (const segment of [
      "invoices",
      "quotes",
      "proposals",
      "purchase-orders",
      "receipts",
    ]) {
      const source = fs.readFileSync(
        path.join(SLOT_DIR, segment, "page.tsx"),
        "utf8",
      );
      expect(source, `${segment} slot page`).toContain(`slug="${segment}"`);
    }
  });

  it("guards the dynamic slot page against non-id segments", () => {
    // @list/[id] swallows any unmatched single segment, so it must refuse to
    // render the list for anything that is not a document id.
    const source = fs.readFileSync(
      path.join(SLOT_DIR, "[id]", "page.tsx"),
      "utf8",
    );
    expect(source).toMatch(/UUID_RE\.test\(id\)/);
  });

  it("never lets the slot default render a document list", () => {
    const source = fs.readFileSync(path.join(SLOT_DIR, "default.tsx"), "utf8");
    // No import of the slot body, no JSX rendering it, and no re-export of a
    // sibling page (which is how the unfiltered list got in here originally).
    expect(source).not.toMatch(/^import .*documents-list-slot/m);
    expect(source).not.toContain("<DocumentsListSlot");
    expect(source).not.toMatch(/export \{ default \} from/);
  });
});
