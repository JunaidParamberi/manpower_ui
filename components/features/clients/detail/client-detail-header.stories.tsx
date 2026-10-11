import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { ClientRow } from "@/types";

import { ClientDetailHeader } from "./client-detail-header";

const baseClient: ClientRow = {
  id: "c1",
  user_id: "u1",
  name: "Al Noor Interiors",
  contact_name: "Mariam Al Suwaidi",
  website: "https://alnoor.ae",
  email: "mariam@alnoor.ae",
  billing_email: "accounts@alnoor.ae",
  phone: "+971 50 412 7788",
  company: null,
  address: "Al Wasl Rd, Dubai",
  currency: "AED",
  tax_id: "100422310003",
  payment_terms_days: 7,
  relationship_status: "active",
  lead_source: "Referral",
  preferred_contact_method: "whatsapp",
  timezone: "Asia/Dubai",
  tags: ["interiors"],
  notes: null,
  health_score: 48,
  portal_token: null,
  created_at: "2025-03-04T10:00:00Z",
  updated_at: "2026-10-01T14:30:00Z",
};

/**
 * Header of the client detail: who the client is (contact, copyable email and phone, place, client since),
 * their status and health band, and the main actions (Kraft, Email, New invoice, more menu with Edit/Delete).
 * Use only at the top of the client detail. Not for list rows or pickers.
 */
const meta: Meta<typeof ClientDetailHeader> = {
  title: "Features/Clients/ClientDetailHeader",
  component: ClientDetailHeader,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
  decorators: [(Story) => <div className="max-w-[960px] bg-[var(--panel)]"><Story /></div>],
  args: { linkedProjectsCount: 3, linkedDocumentsCount: 7 },
};

export default meta;
type Story = StoryObj<typeof ClientDetailHeader>;

export const NeedsAttention: Story = { args: { client: baseClient } };

export const Excellent: Story = { args: { client: { ...baseClient, name: "Northwind Studio", contact_name: "Priya Nair", health_score: 91 } } };

export const AtRisk: Story = { args: { client: { ...baseClient, health_score: 22 } } };

export const NotScored: Story = { args: { client: { ...baseClient, health_score: null, relationship_status: "lead" } } };

export const NoEmailOrPhone: Story = { args: { client: { ...baseClient, email: null, phone: null } } };

export const LongName: Story = {
  args: { client: { ...baseClient, name: "Qasr Al Hosn Hospitality Group LLC", contact_name: "Abdulrahman Al Mansoori" } },
};
