import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, userEvent, within } from "storybook/test";

import { EmailComposerModal } from "./email-composer-modal";
import { STORYBOOK_SIMULATE_PENDING_SUBJECT } from "../../../.storybook/mocks/send-composed-email";

// `sendComposedEmail` is a "use server" action that calls Resend and reads
// the authenticated Supabase session — neither exists in Storybook. It is
// aliased in `.storybook/main.ts` to `.storybook/mocks/send-composed-email.ts`,
// which resolves ok:true by default and recognizes magic subject sentinels to
// simulate a pending send for the "Sending" story below. See that mock file
// for the full contract.
const meta: Meta<typeof EmailComposerModal> = {
  title: "Features/Communication/EmailComposerModal",
  component: EmailComposerModal,
  parameters: {
    docs: {
      description: {
        component:
          "Minimal email composer opened from the AI panel's email-draft card (\"Open in composer\"). Prefills to/subject/body from an AI draft, lets the user edit before sending, and calls the `sendComposedEmail` server action on submit. When the draft is about a record (invoice, quote, client, project), a `link` shows which one, prefills the client's email, and for documents offers to attach the PDF. Sending a draft document's PDF marks it sent. Use it whenever a user needs to review and send a one-off, AI-drafted email; don't use it for transactional emails triggered by app events (those use `emails/_components` templates directly).",
      },
    },
  },
  args: {
    onOpenChange: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof EmailComposerModal>;

export const Prefilled: Story = {
  name: "Prefilled (reminder email)",
  args: {
    open: true,
    initialTo: "hello@acmedesign.co",
    initialSubject: "Friendly reminder: Invoice INV-0042 is due soon",
    initialBody:
      "Hi Acme Design Co.,\n\nJust a quick reminder that Invoice INV-0042 (AED 9,975.00) is due on 15 June 2026. Let me know if you have any questions or need another copy of the invoice.\n\nThanks,\nJohn",
  },
};

export const Empty: Story = {
  args: {
    open: true,
    initialTo: "",
    initialSubject: "",
    initialBody: "",
  },
};

export const Sending: Story = {
  name: "Sending (disabled)",
  args: {
    open: true,
    initialTo: "hello@acmedesign.co",
    // Magic sentinel recognized by the mocked server action — it never
    // resolves, so the composer stays frozen in its pending state.
    initialSubject: STORYBOOK_SIMULATE_PENDING_SUBJECT,
    initialBody: "Sending this message to demonstrate the pending submit state.",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body);
    const sendButton = await canvas.findByRole("button", { name: /send email/i });
    await userEvent.click(sendButton);
  },
};

export const LinkedInvoice: Story = {
  name: "Linked invoice (PDF attached)",
  args: {
    open: true,
    initialTo: "",
    initialSubject: "Invoice INV-0008 ready for your review",
    initialBody:
      "Hi Nova team,\n\nInvoice INV-0008 is ready for your review. The total comes to AED 10,500.\n\nBest regards,\nHassan Studio",
    link: {
      kind: "document",
      id: "97bd5735-dc0f-4385-8f75-862520d3e3b9",
      label: "Invoice INV-0008",
      clientId: "5f1c2d3e-4b5a-4c6d-8e7f-9a0b1c2d3e4f",
      recipientEmail: "accounts@novaretail.ae",
    },
  },
};

export const LinkedClientNoEmail: Story = {
  name: "Linked client, no saved email",
  args: {
    open: true,
    initialTo: "",
    initialSubject: "Checking in",
    initialBody: "Hi Bright Apps,\n\nJust checking in on how things are going.\n\nThanks,\nHassan",
    link: {
      kind: "client",
      id: "5f1c2d3e-4b5a-4c6d-8e7f-9a0b1c2d3e4f",
      label: "Bright Apps Ltd",
      clientId: "5f1c2d3e-4b5a-4c6d-8e7f-9a0b1c2d3e4f",
      recipientEmail: null,
    },
  },
};
