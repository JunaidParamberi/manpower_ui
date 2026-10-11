import type { Meta, StoryObj } from "@storybook/react";
import { ApiKeysManager } from "./api-keys-manager";
import type { ApiKeyRow } from "@/lib/api-keys/api-key-queries";

const meta: Meta<typeof ApiKeysManager> = {
  title: "Features/Settings/API/ApiKeysManager",
  component: ApiKeysManager,
  parameters: {
    docs: {
      description: {
        component:
          "API key manager for the /settings/api route (Pro tier). Lists keys with prefix, created/last-used dates, and revoke. Creating a key opens the reveal-window dialog where the raw secret is shown exactly once. Pass server-fetched keys as `initialKeys`.",
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof ApiKeysManager>;

const mockKeys: ApiKeyRow[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Claude Desktop",
    type: "mcp",
    description: "Local Claude Desktop connector",
    key_prefix: "ca_1a2b3c4d",
    scopes: ["read"],
    tools: { list_entities: true, query_data: true, create_record: false, update_record: false },
    last_used_at: "2026-09-14T09:12:00.000Z",
    expires_at: null,
    revoked_at: null,
    created_at: "2026-09-10T08:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "Zapier integration",
    type: "app",
    description: "",
    key_prefix: "ca_5e6f7a8b",
    scopes: ["read", "write"],
    tools: { list_entities: true, query_data: true, create_record: true, update_record: true },
    last_used_at: "2026-09-02T14:40:00.000Z",
    expires_at: "2026-12-31T00:00:00.000Z",
    revoked_at: null,
    created_at: "2026-08-20T11:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    name: "Old CI script",
    type: "cli",
    description: "Leaked — replaced",
    key_prefix: "ca_9d8e7f60",
    scopes: ["read", "write"],
    tools: { list_entities: true, query_data: true, create_record: true, update_record: true },
    last_used_at: "2026-07-15T06:30:00.000Z",
    expires_at: null,
    revoked_at: "2026-07-18T10:00:00.000Z",
    created_at: "2026-07-01T09:00:00.000Z",
  },
];

export const WithKeys: Story = {
  args: { initialKeys: mockKeys },
};

export const Empty: Story = {
  args: { initialKeys: [] },
};