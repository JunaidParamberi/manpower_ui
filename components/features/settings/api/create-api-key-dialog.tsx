"use client";

import { useEffect, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AlertTriangle, Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createApiKey,
  type CreateApiKeyResult,
} from "@/lib/api-keys/api-key-actions";
import {
  API_KEY_TYPE_LABELS,
  API_KEY_TYPES,
  MCP_TOOL_NAMES,
  MCP_TOOL_META,
  type ApiKeyTypeValue,
  type McpToolName,
  type McpToolPermissions,
} from "@/lib/api-keys/api-key-validations";
import type { ApiKeyRow } from "@/lib/api-keys/api-key-queries";
import {
  API_KEY_EXPIRY_PRESETS,
  expiryValueFor,
} from "@/lib/api-keys/expiry-presets";
import { FormDatePicker } from "@/components/shared/form-date-picker";

type CreateApiKeyFormValues = {
  name: string;
  type: ApiKeyTypeValue;
  description: string;
  tools: McpToolPermissions;
  expiresAt: string;
};

const EMPTY_DEFAULTS: CreateApiKeyFormValues = {
  name: "",
  type: "app",
  description: "",
  tools: {
    list_entities: true,
    query_data: true,
    create_record: true,
    update_record: true,
  },
  expiresAt: "",
};

/**
 * Client-side shape for the create form. The server action re-validates the
 * payload against `createApiKeySchema` — this schema is just for form UX
 * (required name, length caps, closed type enum).
 */
const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  type: z.enum(API_KEY_TYPES),
  description: z.string().max(300),
  tools: z.record(z.enum(MCP_TOOL_NAMES), z.boolean()),
  expiresAt: z.string(),
});

type CreateApiKeyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (apiKey: ApiKeyRow, secret: string) => void;
};

/** Form for creating an API key. The raw secret is only returned once. */
export function CreateApiKeyDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateApiKeyDialogProps) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateApiKeyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY_DEFAULTS,
  });

  useEffect(() => {
    if (open) reset(EMPTY_DEFAULTS);
  }, [open, reset]);

  const selectedType = watch("type");
  const selectedTools = watch("tools");
  const isMcpType = selectedType === "mcp";

  /** Check if any write tool is enabled. */
  const hasWriteTool =
    selectedTools.create_record || selectedTools.update_record;

  function toggleTool(tool: McpToolName) {
    const current = { ...watch("tools") };
    current[tool] = !current[tool];
    setValue("tools", current, { shouldValidate: true });
  }

  /** Read-only tools are grouped under "read"; write tools under "write". */
  const readTools = MCP_TOOL_NAMES.filter(
    (t) => MCP_TOOL_META[t].mode === "read",
  );
  const writeTools = MCP_TOOL_NAMES.filter(
    (t) => MCP_TOOL_META[t].mode === "write",
  );

  function onSubmit(values: CreateApiKeyFormValues) {
    // Derive scopes from enabled tools.
    const scopes: string[] = [];
    if (values.tools.list_entities || values.tools.query_data) {
      scopes.push("read");
    }
    if (values.tools.create_record || values.tools.update_record) {
      scopes.push("write");
    }

    startTransition(async () => {
      const result: CreateApiKeyResult = await createApiKey({
        name: values.name,
        type: values.type,
        description: values.description,
        scopes,
        tools: values.tools,
        expiresAt: values.expiresAt || null,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("API key created");
      onCreated(result.apiKey, result.secret);
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create API key</DialogTitle>
          <DialogDescription>
            Your Manpower key unlocks the REST API and the MCP server for
            Claude, Cursor, and other tools. Show it once — it won&apos;t be
            stored in plaintext.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="api-key-name">Name</Label>
            <Input
              id="api-key-name"
              placeholder="e.g. Claude Desktop, Zapier, CI script"
              {...register("name")}
            />
            {errors.name ? (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Type</Label>
            <Select
              value={watch("type")}
              onValueChange={(value) =>
                setValue("type", value as ApiKeyTypeValue, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {API_KEY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {API_KEY_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ── Tool selection ──────────────────────────────── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Label>Tools</Label>
              <span className="text-xs text-muted-foreground">
                — select what this key can access
              </span>
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
              <div className="bg-muted/40 px-4 py-2 border-b border-border">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Read
                </span>
              </div>
              <div className="divide-y divide-border">
                {readTools.map((tool) => {
                  const meta = MCP_TOOL_META[tool];
                  return (
                    <label
                      key={tool}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                    >
                      <Checkbox
                        checked={selectedTools[tool]}
                        onCheckedChange={() => toggleTool(tool)}
                      />
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-medium text-foreground leading-none">
                          {meta.label}
                        </span>
                        <span className="text-xs text-muted-foreground leading-snug">
                          {meta.description}
                        </span>
                      </div>
                      <Eye className="size-3.5 text-blue-500/60 ml-auto shrink-0" />
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
              <div className="bg-muted/40 px-4 py-2 border-b border-border">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Write
                </span>
              </div>
              <div className="divide-y divide-border">
                {writeTools.map((tool) => {
                  const meta = MCP_TOOL_META[tool];
                  return (
                    <label
                      key={tool}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                    >
                      <Checkbox
                        checked={selectedTools[tool]}
                        onCheckedChange={() => toggleTool(tool)}
                      />
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-medium text-foreground leading-none">
                          {meta.label}
                        </span>
                        <span className="text-xs text-muted-foreground leading-snug">
                          {meta.description}
                        </span>
                      </div>
                      <Pencil className="size-3.5 text-amber-500/60 ml-auto shrink-0" />
                    </label>
                  );
                })}
              </div>
            </div>

            {errors.tools ? (
              <p className="text-xs text-destructive">
                {errors.tools.message}
              </p>
            ) : null}
          </div>

          {/* ── MCP write warning ───────────────────────────── */}
          {isMcpType && hasWriteTool && (
            <div className="flex gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <div>
                <strong>Write tools enabled on MCP key.</strong> AI tools
                (Claude, Cursor, etc.) will be able to create and modify your
                business data. Only enable this if you trust the connected tool.
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="api-key-description">Description (optional)</Label>
            <Textarea
              id="api-key-description"
              placeholder="What is this key for?"
              rows={2}
              {...register("description")}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="api-key-expiry">Expires (optional)</Label>
            <div
              className="flex flex-wrap gap-1.5"
              role="group"
              aria-label="Expiry presets"
            >
              {API_KEY_EXPIRY_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  size="sm"
                  variant={
                    watch("expiresAt") ===
                    expiryValueFor(preset, watch("expiresAt"))
                      ? "secondary"
                      : "outline"
                  }
                  onClick={() =>
                    setValue(
                      "expiresAt",
                      expiryValueFor(preset, watch("expiresAt")),
                      { shouldValidate: true },
                    )
                  }
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <FormDatePicker
              id="api-key-expiry"
              value={watch("expiresAt")}
              onChange={(v) =>
                setValue("expiresAt", v, { shouldValidate: true })
              }
              placeholder="Pick expiry date"
            />
            <p className="text-xs text-muted-foreground">
              Pick a preset above, or choose a custom date. Leave empty for a
              key that never expires.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating…" : "Create key"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
