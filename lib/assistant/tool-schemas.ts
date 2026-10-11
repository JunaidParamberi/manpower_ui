import { z } from "zod";

import { READABLE_ENTITIES, WRITABLE_FIELDS_REFERENCE, riskOf, type EntityRisk } from "./entity-registry.ts";

export type AssistantMode = "ask" | "agent";

export const READ_TOOLS = ["query_data"] as const;

/**
 * Tools offered only in Ask mode. `request_agent_mode` writes nothing: it is
 * how the model reports "the user asked me to DO something and I am read-only"
 * as a structured event instead of a flat prose refusal, so the panel can
 * render a one-click switch to Agent mode.
 */
export const ASK_ONLY_TOOLS = ["request_agent_mode"] as const;

/**
 * Tools the assistant model is allowed to OFFER to the user in Agent mode.
 * `send_email` is intentionally absent: it routes through a Next.js server
 * action that cannot run inside a Deno Edge Function, so any confirm would
 * always fail. The executor's send_email branch still exists so any stale
 * thread row that survived a deploy regressing this list cannot crash the
 * loop — it returns a polite "draft instead" message.
 */
export const WRITE_TOOLS = [
  "create_record",
  "update_record",
  "delete_record",
  "draft_document",
  "draft_email",
  "record_payment",
  "edit_document",
] as const;

/**
 * Every tool the executor can dispatch. Includes `send_email`, which is
 * reachable only via a paused thread row staged before `WRITE_TOOLS` was
 * trimmed; the model itself can no longer reach it (see above).
 */
export type ToolName =
  | (typeof READ_TOOLS)[number]
  | (typeof ASK_ONLY_TOOLS)[number]
  | (typeof WRITE_TOOLS)[number]
  | "send_email";

export type AnthropicToolDefinition = {
  name: string;
  description: string;
  input_schema: { type: "object" } & Record<string, unknown>;
};

const uuid = z.string().uuid();

const queryDataSchema = z.object({
  entity: z.string().min(1),
  filters: z.record(z.string(), z.unknown()).optional(),
  columns: z.array(z.string()).optional(),
  limit: z.number().int().optional(),
  orderBy: z.string().optional(),
  ascending: z.boolean().optional(),
});

const createRecordSchema = z.object({
  entity: z.string().min(1),
  fields: z.record(z.string(), z.unknown()),
});

const updateRecordSchema = z.object({
  entity: z.string().min(1),
  id: uuid,
  fields: z.record(z.string(), z.unknown()),
});

const deleteRecordSchema = z.object({
  entity: z.string().min(1),
  id: uuid,
});

const draftDocumentSchema = z.object({
  prompt: z.string().min(1).max(4000),
  docType: z.enum(["proposal", "quote", "invoice"]).optional(),
  clientId: uuid.optional(),
  projectId: uuid.optional(),
  sourceDocumentId: uuid.optional(),
});

const draftEmailSchema = z
  .object({
    mode: z.enum(["follow_up", "reply"]),
    tone: z.enum(["friendly", "firm", "formal"]),
    documentId: uuid.optional(),
    clientId: uuid.optional(),
    projectId: uuid.optional(),
    incomingMessage: z.string().max(4000).optional(),
    to: z.string().trim().email().optional(),
  })
  .refine(
    (value) =>
      [value.documentId, value.clientId, value.projectId].filter(Boolean)
        .length === 1,
    {
      message:
        "Pass exactly one of documentId, clientId, or projectId.",
      path: ["documentId"],
    },
  );

const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(20000),
  documentId: uuid.optional(),
});

const recordPaymentSchema = z.object({
  documentId: uuid,
  amount: z.number().positive(),
  method: z.string().max(40).optional(),
  paidAt: z.string().optional(),
});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.");

const editLineItemSchema = z.object({
  description: z.string().trim().min(1).max(300),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  taxRate: z.number().min(0).max(100).optional(),
});

const editDocumentSchema = z
  .object({
    documentId: uuid,
    fields: z
      .object({
        client_id: uuid.nullable().optional(),
        project_id: uuid.nullable().optional(),
        title: z.string().trim().min(1).max(200).optional(),
        due_date: isoDate.nullable().optional(),
        currency: z.string().regex(/^[A-Z]{3}$/, "Use a 3-letter currency code.").optional(),
        notes_footer: z.string().max(5000).nullable().optional(),
      })
      .strict()
      .optional(),
    lineItems: z.array(editLineItemSchema).min(1).max(50).optional(),
    copyLineItemsFrom: uuid.optional(),
  })
  .refine(
    (value) =>
      Boolean(value.lineItems || value.copyLineItemsFrom) ||
      Object.keys(value.fields ?? {}).length > 0,
    { message: "Nothing to change — pass fields, lineItems or copyLineItemsFrom.", path: ["fields"] },
  )
  .refine((value) => !(value.lineItems && value.copyLineItemsFrom), {
    message: "Pass lineItems or copyLineItemsFrom, not both.",
    path: ["lineItems"],
  });

const requestAgentModeSchema = z.object({
  action: z.string().min(1).max(200),
});

const SCHEMAS = {
  query_data: queryDataSchema,
  request_agent_mode: requestAgentModeSchema,
  create_record: createRecordSchema,
  update_record: updateRecordSchema,
  delete_record: deleteRecordSchema,
  draft_document: draftDocumentSchema,
  draft_email: draftEmailSchema,
  send_email: sendEmailSchema,
  record_payment: recordPaymentSchema,
  edit_document: editDocumentSchema,
} as const;

/**
 * A validated tool call. `name` and `input` are correlated, so narrowing on
 * `name` narrows `input` — callers switch on the name and get the right
 * input shape without casting.
 */
export type ToolCall =
  | { name: "query_data"; input: z.infer<typeof queryDataSchema> }
  | { name: "request_agent_mode"; input: z.infer<typeof requestAgentModeSchema> }
  | { name: "create_record"; input: z.infer<typeof createRecordSchema> }
  | { name: "update_record"; input: z.infer<typeof updateRecordSchema> }
  | { name: "delete_record"; input: z.infer<typeof deleteRecordSchema> }
  | { name: "draft_document"; input: z.infer<typeof draftDocumentSchema> }
  | { name: "draft_email"; input: z.infer<typeof draftEmailSchema> }
  | { name: "send_email"; input: z.infer<typeof sendEmailSchema> }
  | { name: "record_payment"; input: z.infer<typeof recordPaymentSchema> }
  | { name: "edit_document"; input: z.infer<typeof editDocumentSchema> };

/** Kept as the union of every tool's input shape, for callers that don't care which tool. */
export type ToolInput = ToolCall["input"];

function isToolName(value: string): value is ToolName {
  return Object.prototype.hasOwnProperty.call(SCHEMAS, value);
}

export function parseToolInput(
  name: string,
  input: unknown,
): ({ ok: true } & ToolCall) | { ok: false; error: string } {
  if (!isToolName(name)) {
    return { ok: false, error: `Unknown tool "${name}".` };
  }
  const result = SCHEMAS[name].safeParse(input);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path.join(".") ?? "input";
    return { ok: false, error: `${name}: invalid ${path} — ${issue?.message ?? "rejected"}` };
  }
  return { ok: true, name, input: result.data } as { ok: true } & ToolCall;
}

export function toolRisk(name: ToolName, entity?: string): EntityRisk {
  switch (name) {
    case "query_data":
    case "request_agent_mode":
    case "draft_document":
    case "draft_email":
      return "safe";
    case "delete_record":
    case "send_email":
    case "record_payment":
    case "edit_document":
      return "risky";
    case "create_record":
    case "update_record":
      return entity ? riskOf(entity) : "risky";
  }
}

const ENTITY_ENUM = [...READABLE_ENTITIES];

const DEFINITIONS: Record<ToolName, AnthropicToolDefinition> = {
  query_data: {
    name: "query_data",
    description:
      "Read rows from one of the user's business tables. Use this for any question about their clients, invoices, quotes, projects, tasks, time, expenses, or content. Returns at most 20 rows. Call it more than once rather than guessing when a question spans two tables.",
    input_schema: {
      type: "object",
      properties: {
        entity: { type: "string", enum: ENTITY_ENUM, description: "Table to read." },
        filters: {
          type: "object",
          description:
            'Column filters. A bare value means equals: {"status": "sent"}. An object applies an operator: {"due_date": {"lt": "2026-01-31"}}, {"status": {"in": ["sent", "viewed"]}}. Operators: eq, neq, gt, gte, lt, lte, like, in, is_null. Enum columns only accept the values listed in your instructions.',
          additionalProperties: true,
        },
        columns: {
          type: "array",
          items: { type: "string" },
          description: "Columns to return. Omit for all readable columns.",
        },
        limit: { type: "integer", description: "Max rows, capped at 20." },
        orderBy: { type: "string", description: "Column to sort by." },
        ascending: { type: "boolean", description: "Sort ascending. Defaults to false." },
      },
      required: ["entity"],
      additionalProperties: false,
    },
  },
  request_agent_mode: {
    name: "request_agent_mode",
    description:
      "Ask-mode only. Call this the moment the user asks you to create, change, delete, send, or record something — anything that would alter their data. It changes nothing itself; it tells the app to offer the user a switch to Agent mode. Describe the action you would take, then explain it in one sentence in your reply.",
    input_schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description:
            'The action you would take, phrased for the user. e.g. "Create an invoice for Acme for AED 4,000".',
        },
      },
      required: ["action"],
      additionalProperties: false,
    },
  },
  create_record: {
    name: "create_record",
    description:
      "Create a row. Use for adding a client, project, task, time entry, expense, milestone, or content post. Ownership is set by the server — never pass a user id. " +
      `\`fields\` may ONLY use the exact column names listed below for the chosen entity — never invent or guess a name (e.g. clients has no "address" or "status"; its payment-terms column is "payment_terms_days", not "payment_terms"). If a field the user wants set is not listed, it cannot be set through this tool — say so instead of trying a different guess.\n\n${WRITABLE_FIELDS_REFERENCE}`,
    input_schema: {
      type: "object",
      properties: {
        entity: { type: "string", enum: ENTITY_ENUM },
        fields: { type: "object", additionalProperties: true },
      },
      required: ["entity", "fields"],
      additionalProperties: false,
    },
  },
  update_record: {
    name: "update_record",
    description:
      "Update an existing row by id. Look the id up with query_data first — never invent one. " +
      `\`fields\` may ONLY use the exact column names listed below for the chosen entity — never invent or guess a name. If a field the user wants set is not listed, it cannot be set through this tool — say so instead of trying a different guess.\n\n${WRITABLE_FIELDS_REFERENCE}`,
    input_schema: {
      type: "object",
      properties: {
        entity: { type: "string", enum: ENTITY_ENUM },
        id: { type: "string", description: "UUID of the row." },
        fields: { type: "object", additionalProperties: true },
      },
      required: ["entity", "id", "fields"],
      additionalProperties: false,
    },
  },
  delete_record: {
    name: "delete_record",
    description: "Delete a row by id. Always requires the user to confirm.",
    input_schema: {
      type: "object",
      properties: {
        entity: { type: "string", enum: ENTITY_ENUM },
        id: { type: "string" },
      },
      required: ["entity", "id"],
      additionalProperties: false,
    },
  },
  draft_document: {
    name: "draft_document",
    description:
      "Draft a proposal, quote, or invoice. Returns a draft card in the panel for the user to review — nothing is saved to their documents until they click Create draft on that card. Never tell the user the document exists, is saved, or is open in the editor. Say you have drafted it and that they can create it from the card. " +
      "To invoice an existing quote or proposal, pass its id as sourceDocumentId: line items, prices, tax, currency, client and project are copied exactly (an approved quote becomes its invoice). Otherwise pass clientId (and projectId when relevant) from query_data so the draft is linked, and put every price and quantity the user gave in the prompt.",
    input_schema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "What to draft: the work, prices and quantities, terms. Prices must be stated here unless sourceDocumentId is given.",
        },
        docType: {
          type: "string",
          enum: ["proposal", "quote", "invoice"],
          description: "The kind of document to draft.",
        },
        clientId: { type: "string", description: "The client's id from query_data. Links the draft to the client." },
        projectId: { type: "string", description: "The project's id from query_data, if the document is for a project." },
        sourceDocumentId: {
          type: "string",
          description: "Id of an existing quote or proposal to copy line items, prices, tax, client and project from — e.g. to turn an approved quote into an invoice.",
        },
      },
      required: ["prompt"],
      additionalProperties: false,
    },
  },
  draft_email: {
    name: "draft_email",
    description:
      "Draft a follow-up email or a reply. Returns a draft card in the panel — nothing is sent until the user opens the composer from that card and clicks Send. The composer fills in the client's email (or `to`) and, for a document target, attaches its PDF. Use this when the user asks to send or email a document: draft it with the documentId, pass `to` if they named an address, then tell them to open the card and press Send. Pass exactly one target id. Never tell the user the email was sent.",
    input_schema: {
      type: "object",
      properties: {
        mode: { type: "string", enum: ["follow_up", "reply"] },
        tone: { type: "string", enum: ["friendly", "firm", "formal"] },
        documentId: { type: "string" },
        clientId: { type: "string" },
        projectId: { type: "string" },
        incomingMessage: {
          type: "string",
          description: "For reply mode: the message being replied to.",
        },
        to: {
          type: "string",
          description: "Recipient address the user named. Omit to use the client's saved email.",
        },
      },
      required: ["mode", "tone"],
      additionalProperties: false,
    },
  },
  send_email: {
    name: "send_email",
    description:
      "Send an email to a client. Always requires the user to confirm before it goes out. Draft with draft_email first unless the user supplied the wording.",
    input_schema: {
      type: "object",
      properties: {
        to: { type: "string" },
        subject: { type: "string" },
        body: { type: "string" },
        documentId: { type: "string", description: "Invoice or quote to attach." },
      },
      required: ["to", "subject", "body"],
      additionalProperties: false,
    },
  },
  record_payment: {
    name: "record_payment",
    description:
      "Record a payment received against an invoice. This changes the user's books, so it always requires confirmation.",
    input_schema: {
      type: "object",
      properties: {
        documentId: { type: "string" },
        amount: { type: "number" },
        method: { type: "string", description: "e.g. bank transfer, cash." },
        paidAt: { type: "string", description: "ISO date. Defaults to today." },
      },
      required: ["documentId", "amount"],
      additionalProperties: false,
    },
  },
  edit_document: {
    name: "edit_document",
    description:
      "Fix or fill in a DRAFT invoice, quote or proposal the way a person would in the editor: set its client, project, title, due date, currency or notes, and/or replace all of its line items in one go. " +
      "Use this when the user asks to fix, complete, re-price or correct a document (\"add the prices\", \"link it to Hassan Studio\", \"use the quote's items\"). " +
      "To reuse an existing quote's items and prices exactly, pass its id as copyLineItemsFrom instead of re-typing them. lineItems replaces every existing line. " +
      "Only drafts can be edited — for a sent or paid document, explain that and offer a new draft or credit note. Always asks the user to confirm; tell them in one line what you are about to change.",
    input_schema: {
      type: "object",
      properties: {
        documentId: { type: "string", description: "The document's id (the on-screen record, or from query_data)." },
        fields: {
          type: "object",
          description: "Document details to change. Omit what stays the same.",
          properties: {
            client_id: { type: ["string", "null"], description: "Client id from query_data; null to clear." },
            project_id: { type: ["string", "null"], description: "Project id from query_data; null to clear." },
            title: { type: "string" },
            due_date: { type: ["string", "null"], description: "YYYY-MM-DD." },
            currency: { type: "string", description: "3-letter code, e.g. AED." },
            notes_footer: { type: ["string", "null"], description: "Payment terms / bank details / thank-you note shown at the bottom." },
          },
          additionalProperties: false,
        },
        lineItems: {
          type: "array",
          description: "The full new set of line items (replaces all existing ones).",
          items: {
            type: "object",
            properties: {
              description: { type: "string" },
              quantity: { type: "number" },
              unitPrice: { type: "number", description: "Price per unit, before tax." },
              taxRate: { type: "number", description: "Tax % for this line, e.g. 5." },
            },
            required: ["description", "quantity", "unitPrice"],
            additionalProperties: false,
          },
        },
        copyLineItemsFrom: {
          type: "string",
          description: "Id of another document (e.g. the approved quote) whose line items, prices and tax should be copied exactly.",
        },
      },
      required: ["documentId"],
      additionalProperties: false,
    },
  },
};

/**
 * The table a tool call touches, for the step trail, cache invalidation and
 * the action card's link. Generic tools name it in `entity`; the dedicated
 * ones are fixed.
 */
export function toolEntity(name: ToolName, input: unknown): string | null {
  if (input && typeof input === "object" && "entity" in input) {
    const entity = (input as { entity?: unknown }).entity;
    if (typeof entity === "string") {
      return entity;
    }
  }
  if (name === "record_payment") {
    return "payments";
  }
  if (name === "edit_document") {
    return "documents";
  }
  return null;
}

/**
 * Tool list for the request. Order is fixed so the cached prompt prefix
 * stays byte-identical between turns — do not sort or filter dynamically
 * beyond the mode split.
 */
export function toolsForMode(mode: AssistantMode): AnthropicToolDefinition[] {
  const names: readonly ToolName[] =
    mode === "ask"
      ? [...READ_TOOLS, ...ASK_ONLY_TOOLS]
      : [...READ_TOOLS, ...WRITE_TOOLS];
  return names.map((name) => DEFINITIONS[name]);
}
