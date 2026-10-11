import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRef, useState } from "react";
import type { ServiceRow } from "@/types";
import { fromRows, type EditorLine } from "@/lib/documents/editor/line-items-keyboard";
import { LineItemsGrid } from "./line-items-grid";

/**
 * Line items you edit on the paper. Enter adds a line, Backspace on an empty line deletes it,
 * ↑↓ step quantity and rate (Shift ×10), and the handle reorders. Typing in "Add an item" searches your services.
 * Use inside the editable invoice, quote, LPO and proposal paper. Not for the read-only sheet: use DocLineItems.
 */
const meta: Meta<typeof LineItemsGrid> = {
  title: "Features/Documents/Workspace/Paper/LineItemsGrid",
  component: LineItemsGrid,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [(Story) => <div className="sheet sheet--edit !w-[760px] !p-8"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof LineItemsGrid>;

const svc = (id: string, name: string, rate: number, unit: ServiceRow["unit"]): ServiceRow => ({
  id, user_id: "u", name, description: null, service_type: "service", unit, sku: null, default_qty: 1, cost_price: null,
  default_rate: rate, default_tax_mode: "none", default_tax_rate: 0, hsn_sac_code: null, archived: false, created_at: "", updated_at: "",
});
const SERVICES = [
  svc("s1", "Brand identity design", 6500, "project"),
  svc("s2", "UI design", 350, "hr"),
  svc("s3", "Frontend development", 300, "hr"),
  svc("s4", "Monthly retainer", 8000, "month"),
];
const ROWS = fromRows([
  { id: "l1", document_id: "d", description: "Brand identity design", notes: "Logo, colour system, type pairing", quantity: 1, unit_price: 6500, tax_rate: 0, sort_order: 0, hsn_sac_code: null, created_at: "", updated_at: "" },
  { id: "l2", document_id: "d", description: "UI design", notes: "Marketing site, 6 screens", quantity: 18, unit_price: 350, tax_rate: 0, sort_order: 1, hsn_sac_code: null, created_at: "", updated_at: "" },
]);

function Demo({ initial, readOnly, showHsn }: { initial: EditorLine[]; readOnly?: boolean; showHsn?: boolean }) {
  const [lines, setLines] = useState(initial);
  const seq = useRef(0);
  return (
    <LineItemsGrid lines={lines} currency="AED" services={SERVICES} readOnly={Boolean(readOnly)} showHsn={Boolean(showHsn)} onChange={(n) => setLines(n)} newKey={() => `new-${++seq.current}`} />
  );
}
export const Editing: Story = { render: () => <Demo initial={ROWS} /> };
export const Empty: Story = { render: () => <Demo initial={[]} /> };
export const ReadOnly: Story = { render: () => <Demo initial={ROWS} readOnly /> };
export const WithHsn: Story = { render: () => <Demo initial={ROWS.map((l) => ({ ...l, hsn_sac_code: "998314" }))} showHsn /> };
