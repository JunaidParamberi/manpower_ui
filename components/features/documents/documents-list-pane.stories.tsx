import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { DocumentListRow } from "@/types";

import { DocumentsDataProvider } from "./documents-data-context";
import { DocumentsListPane } from "./documents-list-pane";

const sample: DocumentListRow[] = [
  {
    id: "1",
    type: "invoice",
    title: "INV-000005",
    invoice_number: "INV-000005",
    quote_number: null,
    proposal_number: null,
    receipt_number: null,
    lpo_number: null,
    status: "sent",
    total_amount: 1960,
    currency: "AED",
    due_date: new Date(Date.now() + 3 * 86400000).toISOString(),
    issued_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    client: { id: "client-1", name: "KAT Group", currency: "AED" },
  } as unknown as DocumentListRow,
  {
    id: "2",
    type: "quote",
    title: "QT-000006",
    invoice_number: null,
    quote_number: "QT-000006",
    proposal_number: null,
    receipt_number: null,
    lpo_number: null,
    status: "draft",
    total_amount: 990,
    currency: "AED",
    due_date: null,
    client_id: "client-2",
    valid_until: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    issued_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    client: { id: "client-2", name: "Sol Media", currency: "AED" },
  } as unknown as DocumentListRow,
  {
    id: "3",
    type: "invoice",
    title: "INV-000004",
    invoice_number: "INV-000004",
    quote_number: null,
    proposal_number: null,
    receipt_number: null,
    lpo_number: null,
    status: "overdue",
    total_amount: 4100,
    currency: "AED",
    due_date: new Date(Date.now() - 5 * 86400000).toISOString(),
    issued_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    client: { id: "client-1", name: "KAT Group", currency: "AED" },
  } as unknown as DocumentListRow,
];

const meta: Meta<typeof DocumentsListPane> = {
  title: "Features/Documents/DocumentsListPane",
  component: DocumentsListPane,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
    docs: {
      description: {
        component:
          "Left pane of the documents master–detail layout. Lists documents and highlights the active row. The type filter is driven by the route (e.g. /documents/invoices). On mobile (`lg:hidden`), the pane header shows a type switcher dropdown (All / Invoices / Quotes / …) so users can change type without the desktop sidebar. On desktop the sidebar owns type nav and the header shows a static title. Use inside the documents shell; row click swaps the right detail pane via RSC. Not for standalone pages — it expects to live beside a detail pane.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320, height: 600, borderRight: "1px solid var(--border)" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DocumentsListPane>;

const NO_FILTERS = { type: null, search: null, recurringOnly: false } as const;

/**
 * The pane reads its rows from DocumentsDataProvider, which the @list route
 * slot supplies in the app. Stories stand that provider up with fixtures so
 * the pane renders without touching Supabase.
 */
function paneStory(documents: DocumentListRow[], hasMore = false): Story {
  return {
    render: () => (
      <DocumentsDataProvider
        documents={documents}
        recurringSourceDocumentIds={[]}
        hasMore={hasMore}
        filters={NO_FILTERS}
      >
        <DocumentsListPane />
      </DocumentsDataProvider>
    ),
  };
}

export const Default: Story = paneStory(sample);

export const Empty: Story = paneStory([]);

export const SingleOverdue: Story = paneStory([sample[2]]);

/** Load more stays available even while a search term is active. */
export const WithMorePages: Story = paneStory(sample, true);

/** A draft with no client or priced line shows "Incomplete" instead of an amount. */
export const WithIncompleteDraft: Story = paneStory([
  ...sample,
  {
    id: "4",
    type: "quote",
    title: "QUO-0003",
    invoice_number: null,
    quote_number: "QUO-0003",
    proposal_number: null,
    receipt_number: null,
    lpo_number: null,
    status: "draft",
    total_amount: null,
    currency: "AED",
    due_date: null,
    client_id: null,
    valid_until: null,
    issued_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    client: null,
  } as unknown as DocumentListRow,
]);
