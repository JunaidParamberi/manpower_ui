import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { ClientRow } from "@/types";
import { ClientAbout } from "./client-about";

const full: ClientRow = {
  id: "c1",
  user_id: "u1",
  name: "Al Noor Interiors",
  contact_name: "Mariam Al Suwaidi",
  website: "https://alnoor.ae",
  email: "mariam@alnoor.ae",
  billing_email: "accounts@alnoor.ae",
  phone: "+971 50 412 7788",
  company: "Al Noor Interiors LLC",
  address: "Al Wasl Rd, Jumeirah 1, Dubai, UAE",
  currency: "AED",
  tax_id: "100422310003",
  payment_terms_days: 7,
  relationship_status: "active",
  lead_source: "Referral",
  preferred_contact_method: "whatsapp",
  timezone: "Asia/Dubai",
  tags: ["interiors", "retainer"],
  notes: "Prefers WhatsApp for quick questions.\nInvoices go to accounts@alnoor.ae, cc Mariam.",
  health_score: 48,
  portal_token: "pt_abc123def456",
  created_at: "2025-03-04T10:00:00Z",
  updated_at: "2026-10-01T14:30:00Z",
};

/** The About tab of the client detail: contact and billing details, the portal link and the pinned note. Two columns from the shell's 3xl width. Not a client edit form. */
const meta: Meta<typeof ClientAbout> = {
  title: "Features/Clients/ClientAbout",
  component: ClientAbout,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
  decorators: [(Story) => <div className="@container/shell max-w-[900px] bg-[var(--panel)] pb-6"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ClientAbout>;

export const Full: Story = { args: { client: full } };
export const Sparse: Story = {
  args: {
    client: {
      ...full,
      contact_name: null, website: null, billing_email: null, phone: null, company: null, address: null,
      tax_id: null, payment_terms_days: null, lead_source: null, timezone: null, tags: [], notes: null, portal_token: null,
    },
  },
};
