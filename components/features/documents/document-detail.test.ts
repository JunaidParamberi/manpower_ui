import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * DocumentDetail is a server component. Next cannot send a function to a client component, and
 * neither the build nor the unit tests notice: the page just crashes at runtime
 * ("Functions cannot be passed directly to Client Components"). Props built here must be nodes or data.
 */
export const FUNCTION_PROP = /=\{\s*(async\s*)?\([^)]*\)\s*=>/;

describe("document-detail.tsx", () => {
  it("passes no function props to client components", () => {
    const src = readFileSync(new URL("./document-detail.tsx", import.meta.url), "utf8");
    expect(src).not.toMatch(FUNCTION_PROP);
  });

  it("the guard pattern catches the bug it was written for", () => {
    expect('<Editor actionsEdit={({ leave }) => (<New />)} />').toMatch(FUNCTION_PROP);
    expect('<Editor actionsEdit={() => null} />').toMatch(FUNCTION_PROP);
    expect('<Editor actionsEdit={<Send />} newType="invoice" />').not.toMatch(FUNCTION_PROP);
  });
});
