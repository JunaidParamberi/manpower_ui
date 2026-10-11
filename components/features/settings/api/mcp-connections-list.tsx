"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { PlugZap, Unplug } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyStateCard } from "@/components/shared/empty-state-card";
import { revokeMcpConnection } from "@/lib/mcp/connection-actions";
import type { McpConnectionRow } from "@/lib/mcp/connection-queries";

function formatDate(value: string | null): string {
  if (!value) return "Not yet";
  return format(new Date(value), "MMM d, yyyy");
}

type McpConnectionsListProps = {
  initialConnections: McpConnectionRow[];
};

/** Live Claude/MCP connections with Disconnect. Server-fetched rows come in as `initialConnections`. */
export function McpConnectionsList({ initialConnections }: McpConnectionsListProps) {
  const [connections, setConnections] = useState(initialConnections);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function onDisconnect(id: string) {
    setPendingId(id);
    startTransition(async () => {
      const result = await revokeMcpConnection(id);
      setPendingId(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setConnections((rows) => rows.filter((row) => row.id !== id));
      toast.success("Disconnected");
    });
  }

  if (connections.length === 0) {
    return (
      <EmptyStateCard
        icon={PlugZap}
        title="No apps connected"
        description="Once you add the connector in Claude and choose Allow, it shows up here so you can disconnect it later."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>App</TableHead>
            <TableHead>Connected</TableHead>
            <TableHead>Last used</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {connections.map((connection) => (
            <TableRow key={connection.id}>
              <TableCell className="text-sm font-medium text-foreground">
                {connection.client_name}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(connection.created_at)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(connection.last_used_at)}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pendingId === connection.id}
                  onClick={() => onDisconnect(connection.id)}
                >
                  <Unplug className="size-3.5" strokeWidth={1.6} />
                  {pendingId === connection.id ? "Disconnecting…" : "Disconnect"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
