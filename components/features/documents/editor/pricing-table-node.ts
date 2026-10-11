import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { PricingTableView } from "./pricing-table-view";
import type { PricingRow, PricingTableAttrs } from "./pricing-table-view";

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function defaultRows(): PricingRow[] {
  return [
    { id: uid(), description: "", qty: 1, rate: 0 },
    { id: uid(), description: "", qty: 1, rate: 0 },
    { id: uid(), description: "", qty: 1, rate: 0 },
  ];
}

export const PricingTableExtension = Node.create({
  name: "pricingTable",
  group: "block",
  atom: true,
  draggable: true,

  addStorage() {
    return {
      tables: {} as Record<string, PricingTableAttrs>,
    };
  },

  addAttributes() {
    return {
      id: { default: "" },
      rows: { default: defaultRows() as PricingRow[] },
      currency: { default: "USD" },
      taxRate: { default: 0 },
      showTax: { default: false },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="pricing-table"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "pricing-table" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PricingTableView);
  },
});

export { defaultRows };
