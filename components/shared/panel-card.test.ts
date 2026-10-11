import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PanelCardList, PanelCardRow } from "./panel-card";

describe("PanelCardRow", () => {
  it("keeps a linked row announced as a link inside a list item", () => {
    const html = renderToStaticMarkup(
      createElement(PanelCardList, null, createElement(PanelCardRow, { href: "/clients/c1" }, "Acme")),
    );
    expect(html).not.toMatch(/<a[^>]*role=/);
    expect(html).toMatch(/<li[^>]*><a[^>]*href="\/clients\/c1"/);
    expect(html).toMatch(/^<ul/);
  });

  it("renders a plain row as a list item", () => {
    const html = renderToStaticMarkup(createElement(PanelCardRow, null, "Acme"));
    expect(html).toMatch(/^<li/);
  });
});
