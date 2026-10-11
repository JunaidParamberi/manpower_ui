import { describe, expect, it } from "vitest";

import { rehypeFadeWords, splitWords } from "./rehype-fade-words";

describe("splitWords", () => {
  it("wraps words and keeps whitespace as text", () => {
    expect(splitWords("Paid in  full")).toEqual([
      { type: "element", tagName: "span", properties: { className: ["kraft-word"] }, children: [{ type: "text", value: "Paid" }] },
      { type: "text", value: " " },
      { type: "element", tagName: "span", properties: { className: ["kraft-word"] }, children: [{ type: "text", value: "in" }] },
      { type: "text", value: "  " },
      { type: "element", tagName: "span", properties: { className: ["kraft-word"] }, children: [{ type: "text", value: "full" }] },
    ]);
  });
});

describe("rehypeFadeWords", () => {
  it("wraps prose but leaves code untouched", () => {
    const tree = {
      type: "root",
      children: [
        { type: "element", tagName: "p", properties: {}, children: [{ type: "text", value: "Hi there" }] },
        { type: "element", tagName: "code", properties: {}, children: [{ type: "text", value: "a b" }] },
      ],
    };
    rehypeFadeWords()(tree);
    const [p, code] = tree.children;
    expect(p.children).toHaveLength(3);
    expect(code.children).toEqual([{ type: "text", value: "a b" }]);
  });
});
