import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FileText } from "lucide-react";
import Link from "next/link";

import { DOCUMENT_TYPE_NAV } from "@/lib/documents/document-routes";

import { CollapsedNavFlyout } from "./collapsed-nav-flyout";

/**
 * Stand-in for the collapsed sidebar icon link that opens the flyout. Must be a
 * direct element, not a wrapper component — Base UI merges the trigger props
 * onto the element it is given, and a wrapper component would swallow them.
 */
const iconTrigger = (
  <Link
    href="/documents"
    aria-label="Documents"
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 36,
      height: 36,
      borderRadius: 7,
      color: "var(--fg-2)",
      background: "var(--bg-subtle)",
      textDecoration: "none",
    }}
  >
    <FileText size={18} strokeWidth={1.6} />
  </Link>
);

const meta: Meta<typeof CollapsedNavFlyout> = {
  title: "Layout/CollapsedNavFlyout",
  component: CollapsedNavFlyout,
  parameters: {
    layout: "centered",
    nextjs: { appDirectory: true },
    docs: {
      description: {
        component:
          "Hover flyout that exposes a sidebar section's sub-items while the sidebar is collapsed to icons. Used for the Documents section so Invoices/Quotes/Proposals stay reachable at 56px width — without it, collapsing the sidebar hides every document type. The trigger remains a link, so clicking the icon still navigates to the section root while hovering reveals the sub-items. Use for any collapsed nav item that has children; do not use for childless items (those get a plain tooltip instead).",
      },
    },
  },
  decorators: [
    (Story) => (
      <div
        data-theme="dark"
        style={{
          display: "flex",
          justifyContent: "center",
          width: 56,
          padding: "12px 0",
          background: "var(--bg-canvas)",
          borderRight: "1px solid var(--border)",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CollapsedNavFlyout>;

/** Hover the icon to reveal the document types. Nothing is selected yet. */
export const Default: Story = {
  args: {
    label: "Documents",
    items: DOCUMENT_TYPE_NAV,
    activeHref: null,
    trigger: iconTrigger,
  },
};

/** A sub-item is the current route, so it is highlighted inside the flyout. */
export const ActiveChild: Story = {
  args: {
    label: "Documents",
    items: DOCUMENT_TYPE_NAV,
    activeHref: "/documents/invoices",
    trigger: iconTrigger,
  },
};
