import { describe, expect, it } from "vitest";

import { extractChoices } from "./choices";

describe("extractChoices", () => {
  it("pulls choices out and leaves the question", () => {
    const text = "Which client is INV-0008 for?\n\n[[choice: Nova Retail FZ-LLC]]\n[[choice: Cedar Media LLC]]\n";
    expect(extractChoices(text)).toEqual({
      body: "Which client is INV-0008 for?",
      choices: ["Nova Retail FZ-LLC", "Cedar Media LLC"],
    });
  });

  it("returns the text untouched when there are none", () => {
    expect(extractChoices("Done. INV-0008 is linked to Nova Retail.")).toEqual({
      body: "Done. INV-0008 is linked to Nova Retail.",
      choices: [],
    });
  });

  it("hides a marker that is still streaming in", () => {
    expect(extractChoices("Which one?\n[[choice: Nov").body).toBe("Which one?");
    expect(extractChoices("Which one?\n[[cho").body).toBe("Which one?");
    expect(extractChoices("Which one?\n[").body).toBe("Which one?");
  });

  it("dedupes, trims, ignores case and caps the list", () => {
    const text = "Pick:\n[[Choice:  A ]][[choice: A]][[choice: B]][[choice: C]][[choice: D]][[choice: E]][[choice: F]]";
    expect(extractChoices(text).choices).toEqual(["A", "B", "C", "D", "E"]);
  });

  it("keeps ordinary brackets", () => {
    expect(extractChoices("See [the docs](https://x.y) and [1]").body).toBe("See [the docs](https://x.y) and [1]");
  });
});
