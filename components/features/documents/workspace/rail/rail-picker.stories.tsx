import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState, type CSSProperties } from "react";
import { tokenColor } from "@/lib/documents/editor/token-color";
import { RailField } from "./rail-field";
import { RailPicker, type PickerOption } from "./rail-picker";

/**
 * A searchable list in a popover, in the command-palette style. Use in the document rail
 * for client, project and currency. Not for long server-searched lists: use the Cmd+K palette.
 */
const meta: Meta<typeof RailPicker> = {
  title: "Features/Documents/Workspace/Rail/RailPicker",
  component: RailPicker,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [(Story) => <div className="w-[300px] bg-[var(--panel)] p-3"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof RailPicker>;

const Tile = ({ id, label }: { id: string; label: string }) => (
  <span
    className="grid size-5 shrink-0 place-items-center rounded-md bg-[var(--dot)] text-[9.5px] font-bold text-white"
    style={{ "--dot": tokenColor(id) } as CSSProperties}
  >
    {label.split(" ").map((w) => w[0]).slice(0, 2).join("")}
  </span>
);
const Code = ({ children }: { children: string }) => (
  <code className="rounded-[5px] border border-border bg-[var(--bg-subtle)] px-1.5 font-mono text-[11px]">{children}</code>
);

const CLIENTS: PickerOption[] = [
  { value: "c1", label: "Acme Studio", secondary: "Sara Haddad", leading: <Tile id="c1" label="Acme Studio" />, trailing: <Code>AED</Code> },
  { value: "c2", label: "Northwind Labs", secondary: "Tom Ellis", leading: <Tile id="c2" label="Northwind Labs" />, trailing: <Code>GBP</Code> },
  { value: "c3", label: "Lumen Health", secondary: "Priya Nair", leading: <Tile id="c3" label="Lumen Health" />, trailing: <Code>USD</Code> },
];

function Demo({ options, initial, footer }: { options: PickerOption[]; initial: string | null; footer?: boolean }) {
  const [value, setValue] = useState<string | null>(initial);
  const current = options.find((o) => o.value === value);
  return (
    <RailPicker
      side="bottom"
      placeholder="Search"
      options={options}
      value={value}
      onPick={setValue}
      emptyText={() => "No projects for this client yet"}
      footerAction={footer ? { label: (q) => (q ? `New client "${q}"` : "New client"), onSelect: () => {} } : undefined}
      trigger={<RailField label="Client">{current ? <span className="truncate">{current.label}</span> : <span className="font-normal text-[var(--fg-3)]">Choose</span>}</RailField>}
    />
  );
}

export const Clients: Story = { render: () => <Demo options={CLIENTS} initial="c1" footer /> };
export const NothingChosen: Story = { render: () => <Demo options={CLIENTS} initial={null} footer /> };
export const EmptyProjects: Story = { render: () => <Demo options={[]} initial={null} /> };
