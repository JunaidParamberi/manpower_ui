import type { Meta, StoryObj } from "@storybook/react";
import { McpConnectPanel } from "./mcp-connect-panel";

const meta: Meta<typeof McpConnectPanel> = {
  title: "Features/Settings/API/McpConnectPanel",
  component: McpConnectPanel,
  parameters: {
    docs: {
      description: {
        component:
          "Setup block at the top of /settings/api for connecting Claude over MCP: three steps and the connector URL with copy. Shown on every plan. Use it only for the Claude connector — REST API keys live in ApiKeysManager (Pro). Pair it with McpConnectionsList so users can see and disconnect what they've approved.",
      },
    },
  },
  args: { connectorUrl: "https://app.manpower.app/api/mcp" },
};
export default meta;
type Story = StoryObj<typeof McpConnectPanel>;

/** Production connector URL. Click Copy to see the confirmation state. */
export const Default: Story = {};

/** Long URL (local tunnel during development) truncates instead of wrapping. */
export const LongUrl: Story = {
  args: { connectorUrl: "https://manpower-dev-layla-moonframe-studio.trycloudflare.com/api/mcp" },
};
