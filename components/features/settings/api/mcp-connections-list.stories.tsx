import type { Meta, StoryObj } from "@storybook/react";
import { McpConnectionsList } from "./mcp-connections-list";

const meta: Meta<typeof McpConnectionsList> = {
  title: "Features/Settings/API/McpConnectionsList",
  component: McpConnectionsList,
  parameters: {
    docs: {
      description: {
        component:
          "Live Claude connections the user approved on the /mcp/authorize consent screen, with Disconnect. Disconnecting takes effect on Claude's next request — it must be reconnected to work again. Pass server-fetched rows as `initialConnections`. Not for API keys; those have their own table in ApiKeysManager.",
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof McpConnectionsList>;

/** Two approvals: claude.ai web and Claude Desktop (never used yet). Disconnect shows the pending state, then removes the row. */
export const WithConnections: Story = {
  args: {
    initialConnections: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        client_name: "Claude",
        created_at: "2026-09-20T09:00:00.000Z",
        last_used_at: "2026-09-26T08:10:00.000Z",
      },
      {
        id: "22222222-2222-4222-8222-222222222222",
        client_name: "Claude Desktop",
        created_at: "2026-09-12T15:30:00.000Z",
        last_used_at: null,
      },
    ],
  },
};

/** Nothing connected yet. */
export const Empty: Story = { args: { initialConnections: [] } };
