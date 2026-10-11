import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { GlobalSearchDocumentResult } from "@/lib/search/types";

import { CommandPalette } from "./command-palette";

const meta: Meta<typeof CommandPalette> = {
  title: "Layout/CommandPalette",
  component: CommandPalette,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Global search and quick navigation (⌘K). Search mode queries clients, projects, and documents. Browse mode shows Recent, Pinned, and shortcuts.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CommandPalette>;

const mockRecent = [
  {
    id: "c1",
    label: "Acme Corp",
    subtitle: "Client",
    href: "/clients/c1",
    kind: "client" as const,
  },
  {
    id: "d1",
    label: "INV-0042",
    subtitle: "Invoice · Sent",
    href: "/documents/d1",
    kind: "document" as const,
  },
];

const mockPinned = [
  {
    id: "pin-1",
    item_type: "project" as const,
    item_id: "p1",
    item_label: "Website redesign",
    item_href: "/projects?project=p1",
    position: 0,
  },
  {
    id: "pin-2",
    item_type: "client" as const,
    item_id: "c2",
    item_label: "Northwind Studio",
    item_href: "/clients/c2",
    position: 1,
  },
];

const mockSearchResults = {
  clients: [
    {
      kind: "client" as const,
      id: "c1",
      label: "Acme Corp",
      subtitle: "Acme LLC",
      href: "/clients/c1",
    },
  ],
  projects: [
    {
      kind: "project" as const,
      id: "p1",
      label: "Website redesign",
      subtitle: "Acme Corp · In progress",
      href: "/projects?project=p1",
      status: "In progress",
    },
  ],
  documents: [
    {
      kind: "document" as const,
      id: "d1",
      label: "INV-0042",
      subtitle: "Invoice · Acme Corp",
      href: "/documents/d1",
      documentType: "invoice" as const,
      typeBadge: "INV",
      status: "sent" as const,
      statusLabel: "Sent",
    } satisfies GlobalSearchDocumentResult,
  ],
};

export const Open: Story = {
  args: { open: true, onOpenChange: () => {} },
};

export const BrowseMode: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    pinnedItems: mockPinned,
    preview: {
      recentItems: mockRecent,
      pinnedItems: mockPinned,
    },
  },
};

export const SearchResults: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    preview: {
      query: "acme",
      results: mockSearchResults,
      loading: false,
    },
  },
};

export const SearchLoading: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    preview: {
      query: "acme",
      loading: true,
      results: { clients: [], projects: [], documents: [] },
    },
  },
};

export const SearchEmpty: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    preview: {
      query: "zzzz-not-found",
      loading: false,
      results: { clients: [], projects: [], documents: [] },
    },
  },
};

export const Toggleable: Story = {
  render: () => {
    const Wrap = () => {
      const [open, setOpen] = useState(false);
      return (
        <div style={{ padding: 24 }}>
          <Button onClick={() => setOpen(true)}>Open command palette (⌘K)</Button>
          <CommandPalette open={open} onOpenChange={setOpen} pinnedItems={mockPinned} />
        </div>
      );
    };
    return <Wrap />;
  },
};
