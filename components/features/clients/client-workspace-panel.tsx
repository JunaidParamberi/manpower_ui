"use client";

import { AlertCircle, CheckCircle2, Mail, Tags, WalletCards } from "lucide-react";

import type { ClientFormInsights } from "@/lib/clients/client-form-insights";

import { WorkspaceInsightCard } from "@/components/shared/workspace-form-shell";
import { Badge } from "@/components/ui/badge";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";

type ClientWorkspacePanelProps = {
  insights: ClientFormInsights;
  mode: "create" | "edit";
};

export function ClientWorkspacePanel({
  insights,
  mode,
}: ClientWorkspacePanelProps) {
  const hasMissingEssentials = insights.missingEssentials.length > 0;

  return (
    <>
      <WorkspaceInsightCard
        title="Live client preview"
        description="This is how the record will read after saving."
        action={
          <Badge variant={hasMissingEssentials ? "outline" : "accent"}>
            {mode === "create" ? "Draft" : "Editing"}
          </Badge>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="font-heading text-lg font-semibold tracking-tight">
              {insights.displayName}
            </p>
            <p className="text-sm text-muted-foreground">
              {insights.relationshipLabel}
            </p>
          </div>

          <div className="grid gap-3 text-sm">
            <div className="flex items-start gap-2">
              <Mail className="mt-0.5 size-4 text-muted-foreground" strokeWidth={1.6} />
              <div>
                <p className="font-medium">Primary contact</p>
                <p className="text-muted-foreground">{insights.primaryContactLabel}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <WalletCards
                className="mt-0.5 size-4 text-muted-foreground"
                strokeWidth={1.6}
              />
              <div>
                <p className="font-medium">Billing route</p>
                <p className="text-muted-foreground">{insights.billingRouteLabel}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Tags className="mt-0.5 size-4 text-muted-foreground" strokeWidth={1.6} />
              <div>
                <p className="font-medium">Tags</p>
                <p className="text-muted-foreground">
                  {insights.tags.length > 0 ? insights.tags.join(", ") : "No tags yet"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </WorkspaceInsightCard>

      <WorkspaceInsightCard title="Profile readiness">
        <div className="flex flex-col gap-4">
          <Progress value={insights.completionPercent}>
            <ProgressLabel>Essential details</ProgressLabel>
            <ProgressValue>
              {() => `${insights.completedCount}/${insights.totalCount}`}
            </ProgressValue>
          </Progress>

          <div className="flex flex-col gap-2">
            {insights.completionItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                {item.complete ? (
                  <CheckCircle2
                    className="size-4 text-[var(--success)]"
                    strokeWidth={1.6}
                  />
                ) : (
                  <AlertCircle
                    className="size-4 text-muted-foreground"
                    strokeWidth={1.6}
                  />
                )}
                <span className={item.complete ? "text-foreground" : "text-muted-foreground"}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </WorkspaceInsightCard>

      <WorkspaceInsightCard
        title={hasMissingEssentials ? "Before you save" : "Ready for documents"}
      >
        {hasMissingEssentials ? (
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            {insights.missingEssentials.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p>
              Contact and billing basics are ready. New invoices and receipts can use
              this client without extra setup.
            </p>
            <p>Default payment terms: {insights.paymentTermsLabel}.</p>
          </div>
        )}
      </WorkspaceInsightCard>
    </>
  );
}
