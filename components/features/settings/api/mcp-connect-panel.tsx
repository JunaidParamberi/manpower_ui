"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

const STEPS = [
  "In Claude, open Settings, then Connectors, and choose Add custom connector.",
  "Paste the connector URL below and add it.",
  "Sign in to Manpower when Claude asks, then choose Allow.",
];

type McpConnectPanelProps = {
  /** Public MCP endpoint, e.g. https://app.manpower.app/api/mcp */
  connectorUrl: string;
};

/** Connector URL + setup steps for linking Claude over MCP. Shown on every plan. */
export function McpConnectPanel({ connectorUrl }: McpConnectPanelProps) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(connectorUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy. Select the URL and copy it manually.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-base font-semibold text-foreground">Connect Claude</h2>
        <p className="text-[13px] text-muted-foreground">
          Let Claude look up and update your clients, projects, documents and tasks. Included on
          every plan.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
        <ol className="flex flex-col gap-2.5">
          {STEPS.map((step, index) => (
            <li key={step} className="flex items-start gap-3 text-sm leading-6 text-foreground">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-xs font-medium text-muted-foreground">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-[var(--bg-subtle)] py-1.5 pr-1.5 pl-3">
          <code className="min-w-0 flex-1 truncate font-mono text-sm text-foreground">
            {connectorUrl}
          </code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCopy}
            className="gap-1.5"
            aria-label="Copy connector URL"
          >
            {copied ? (
              <Check className="size-3.5" strokeWidth={1.6} />
            ) : (
              <Copy className="size-3.5" strokeWidth={1.6} />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>
    </div>
  );
}
