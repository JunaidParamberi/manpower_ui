import { z } from "zod";

import { API_KEY_LENGTH, API_KEY_PREFIX, isApiKeyFormat } from "./key-format";

export const API_KEY_TYPES = ["app", "mcp", "cli"] as const;
export type ApiKeyTypeValue = (typeof API_KEY_TYPES)[number];

export const API_KEY_TYPE_LABELS: Record<ApiKeyTypeValue, string> = {
  app: "App / integration",
  mcp: "MCP (Claude, Cursor, …)",
  cli: "CLI / scripts",
};

/** Available tool scopes for API keys. */
export const API_KEY_SCOPES = ["read", "write"] as const;
export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

export const API_KEY_SCOPE_LABELS: Record<ApiKeyScope, string> = {
  read: "Read data (query, list entities)",
  write: "Write data (create, update records)",
};

// ---------------------------------------------------------------------------
//  Granular per-tool permissions
// ---------------------------------------------------------------------------

export const MCP_TOOL_NAMES = [
  "list_entities",
  "query_data",
  "create_record",
  "update_record",
] as const;
export type McpToolName = (typeof MCP_TOOL_NAMES)[number];

export type McpToolPermissions = Record<McpToolName, boolean>;

export const MCP_TOOL_META: Record<
  McpToolName,
  { label: string; description: string; mode: "read" | "write" }
> = {
  list_entities: {
    label: "List entities",
    description: "Discover available tables, fields, and which are writable",
    mode: "read",
  },
  query_data: {
    label: "Query data",
    description: "Read rows from any business table (clients, tasks, …)",
    mode: "read",
  },
  create_record: {
    label: "Create records",
    description: "Create new rows in safe, directly-owned tables",
    mode: "write",
  },
  update_record: {
    label: "Update records",
    description: "Modify existing rows in safe, directly-owned tables",
    mode: "write",
  },
};

export const DEFAULT_MCP_TOOLS: McpToolPermissions = {
  list_entities: true,
  query_data: true,
  create_record: true,
  update_record: true,
};

/**
 * A new API key request from the settings UI. `expiresAt` is optional — an
 * absent value means the key never expires. `scopes` and `tools` default to
 * full access.
 */
export const createApiKeySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  description: z.string().trim().max(300).default(""),
  type: z.enum(API_KEY_TYPES).default("app"),
  scopes: z
    .array(z.enum(API_KEY_SCOPES))
    .min(1, "Select at least one permission")
    .default(["read", "write"]),
  tools: z
    .record(z.enum(MCP_TOOL_NAMES), z.boolean())
    .default(DEFAULT_MCP_TOOLS),
  expiresAt: z
    .preprocess(
      (v) => (v === "" || v === null || v === undefined ? null : v),
      z
        .string()
        .nullish()
        .refine(
          (v) => v === null || v === undefined || !Number.isNaN(new Date(v).getTime()),
          { message: "Expiry must be a valid date." },
        ),
    )
    .nullable()
    .optional(),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;

export const revokeApiKeySchema = z.object({
  id: z.string().uuid("Invalid key id"),
});

export type RevokeApiKeyInput = z.infer<typeof revokeApiKeySchema>;

/**
 * The raw secret a client presents in `Authorization: Bearer` or `X-Api-Key`.
 * Verified inline so authentication short-circuits before hashing garbage.
 */
export const bearerSecretSchema = z
  .string()
  .refine(isApiKeyFormat, {
    message: `Invalid API key — expected ${API_KEY_LENGTH} chars starting with "${API_KEY_PREFIX}".`,
  });