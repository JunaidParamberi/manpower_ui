import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { CLIENTS, PROJECTS } from "./story-fixtures";
import { ClientRailField, CurrencyRailField, ProjectRailField } from "./shared-fields";

/**
 * The Client, Project and Currency rows shared by every document rail. Each opens a searchable picker.
 * Use in document rails. Not for forms outside documents: use the form selects.
 */
const meta: Meta = {
  title: "Features/Documents/Workspace/SharedFields",
  tags: ["autodocs"],
  decorators: [(Story) => <div className="w-[300px] bg-[var(--panel)] p-3"><Story /></div>],
};
export default meta;
type Story = StoryObj;

function Demo({ locked }: { locked?: boolean }) {
  const [clientId, setClientId] = useState<string | null>("c1");
  const [projectId, setProjectId] = useState<string | null>("p1");
  const [currency, setCurrency] = useState("AED");
  return (
    <>
      <ClientRailField clients={CLIENTS} clientId={clientId} disabled={Boolean(locked)} side="bottom" onPick={(v) => { setClientId(v); setProjectId(null); }} onNew={() => {}} />
      <ProjectRailField projects={PROJECTS} projectId={projectId} clientId={clientId} disabled={Boolean(locked)} side="bottom" onPick={setProjectId} />
      <CurrencyRailField value={currency} clientCurrency="AED" disabled={Boolean(locked)} side="bottom" onPick={setCurrency} />
    </>
  );
}
export const Editable: Story = { render: () => <Demo /> };
export const Locked: Story = { render: () => <Demo locked /> };
