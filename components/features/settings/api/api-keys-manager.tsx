"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { KeyRound, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyStateCard } from "@/components/shared/empty-state-card";
import { revokeApiKey } from "@/lib/api-keys/api-key-actions";
import { API_KEY_TYPE_LABELS, MCP_TOOL_NAMES, MCP_TOOL_META, type McpToolName } from "@/lib/api-keys/api-key-validations";
import type { ApiKeyRow } from "@/lib/api-keys/api-key-queries";
import { ApiKeyRevealDialog } from "./api-key-reveal-dialog";
import { CreateApiKeyDialog } from "./create-api-key-dialog";
import { cn } from "@/lib/utils";

type RevealState = { name: string; secret: string } | null;

function formatDate(value: string | null): string {
  if (!value) return "—";
  return format(new Date(value), "MMM d, yyyy");
}

function isExpired(row: ApiKeyRow): boolean {
  return Boolean(row.expires_at && new Date(row.expires_at).getTime() <= Date.now());
}

function ScopeBadges({ tools }: { tools: Record<string, boolean> }) {
  return (
    <div className="flex flex-wrap gap-1">
      {MCP_TOOL_NAMES.map((tool) => {
        const meta = MCP_TOOL_META[tool];
        const enabled = tools[tool] !== false;
        return (
          <Badge
            key={tool}
            variant={enabled ? "secondary" : "outline"}
            className={cn(
              "text-[10px] font-medium",
              enabled
                ? meta.mode === "read"
                  ? "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400"
                  : "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                : "text-muted-foreground/50",
            )}
          >
            {meta.label}
          </Badge>
        );
      })}
    </div>
  );
}

type ApiKeysManagerProps = {
  initialKeys: ApiKeyRow[];
};

export function ApiKeysManager({ initialKeys }: ApiKeysManagerProps) {
  const [keys, setKeys] = useState<ApiKeyRow[]>(initialKeys);
  const [createOpen, setCreateOpen] = useState(false);
  const [reveal, setReveal] = useState<RevealState>(null);
  const [pendingRevoke, setPendingRevoke] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function onCreated(apiKey: ApiKeyRow, secret: string) {
    setKeys((prev) => [apiKey, ...prev]);
    setReveal({ name: apiKey.name, secret });
  }

  function onRevoke(id: string) {
    setPendingRevoke(id);
    startTransition(async () => {
      const result = await revokeApiKey(id);
      setPendingRevoke(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setKeys((prev) =>
        prev.map((key) =>
          key.id === id
            ? { ...key, revoked_at: new Date().toISOString() }
            : key,
        ),
      );
      toast.success("API key revoked");
    });
  }

  const hasKeys = keys.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-base font-semibold text-foreground">
            API keys
          </h2>
          <p className="text-[13px] text-muted-foreground">
            Keys authenticate the REST API, custom GPTs, and MCP clients that
            take a key instead of signing in (Cursor, Claude Code). Pro plan.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="w-fit gap-2">
          <Plus className="size-4" />
          Create API key
        </Button>
      </div>

      {hasKeys ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last used</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => {
                const revoked = Boolean(key.revoked_at);
                const expired = isExpired(key);
                return (
                  <TableRow key={key.id}>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-foreground">
                          {key.name}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {API_KEY_TYPE_LABELS[key.type]}
                          {key.description ? ` · ${key.description}` : ""}
                          {key.expires_at ? (
                            <span className="text-muted-foreground/70">
                              · expires {formatDate(key.expires_at)}
                            </span>
                          ) : null}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">
                        {key.key_prefix}…
                      </span>
                    </TableCell>
                    <TableCell>
                      <ScopeBadges tools={key.tools} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(key.created_at)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(key.last_used_at)}
                    </TableCell>
                    <TableCell>
                      {revoked ? (
                        <Badge variant="secondary">Revoked</Badge>
                      ) : expired ? (
                        <Badge variant="outline">Expired</Badge>
                      ) : (
                        <Badge
                          className={cn(
                            "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
                          )}
                        >
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!revoked && !expired ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pendingRevoke === key.id}
                          onClick={() => onRevoke(key.id)}
                        >
                          <RotateCcw className="size-3.5" />
                          Revoke
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyStateCard
          icon={KeyRound}
          title="No API keys yet"
          description="Create a key to connect Claude, Cursor, Zapier, or a custom GPT to your Manpower workspace. The full key is shown exactly once."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Create API key
            </Button>
          }
        />
      )}

      <CreateApiKeyDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={onCreated}
      />

      <ApiKeyRevealDialog
        open={reveal !== null}
        onOpenChange={(open) => {
          if (!open) setReveal(null);
        }}
        name={reveal?.name ?? ""}
        secret={reveal?.secret ?? ""}
      />
    </div>
  );
}