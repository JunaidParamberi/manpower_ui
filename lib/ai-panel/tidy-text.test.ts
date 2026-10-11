import { describe, expect, it } from "vitest";

import { tidyAssistantText } from "./tidy-text";

describe("tidyAssistantText", () => {
  it("turns a spaced em dash into a comma", () => {
    expect(tidyAssistantText("It's already invoiced — it's INV-0006.")).toBe("It's already invoiced, it's INV-0006.");
  });

  it("turns a spaced en dash into a comma", () => {
    expect(tidyAssistantText("Paid – in full")).toBe("Paid, in full");
  });

  it("turns an unspaced em dash into a comma", () => {
    expect(tidyAssistantText("clarify—I haven't")).toBe("clarify, I haven't");
  });

  it("drops a dash that sits before punctuation or the end", () => {
    expect(tidyAssistantText("Done —.")).toBe("Done.");
    expect(tidyAssistantText("Done —")).toBe("Done");
  });

  it("splits two sentences that were glued together", () => {
    expect(tidyAssistantText("details for you.Confirmed: correct")).toBe("details for you. Confirmed: correct");
  });

  it("leaves record numbers, ranges, decimals and file names alone", () => {
    const text = "INV-0006 covers 10-12 May, AED 1.5k, see report.pdf and e.g.";
    expect(tidyAssistantText(text)).toBe(text);
  });

  it("does not touch code", () => {
    const text = "Run `a — b` then:\n```\nx — y\nfoo.Bar\n```\nok — done";
    expect(tidyAssistantText(text)).toBe("Run `a — b` then:\n```\nx — y\nfoo.Bar\n```\nok, done");
  });

  it("keeps an unclosed code fence untouched while it streams", () => {
    expect(tidyAssistantText("See:\n```\na — b")).toBe("See:\n```\na — b");
  });
});
