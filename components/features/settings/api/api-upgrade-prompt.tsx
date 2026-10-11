import Link from "next/link";
import { ArrowUpRight, KeyRound } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Shown in the API keys section of /settings/api when the plan is below Pro. The Claude connector (MCP) is not gated. */
export function ApiUpgradePrompt() {
  return (
    <Card className="border-dashed bg-[var(--bg-subtle)] shadow-none">
      <CardContent className="flex flex-col items-center gap-4 px-6 py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-card text-muted-foreground shadow-xs">
          <KeyRound className="size-5" />
        </div>
        <div className="flex max-w-md flex-col gap-1.5">
          <p className="text-sm font-medium text-foreground">
            API keys are a Pro feature
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Upgrade to Pro to create API keys and call the Manpower REST API
            from your own tools, scripts and automations. Connecting Claude
            doesn&apos;t need a key — use the steps above.
          </p>
        </div>
        <Link
          href="/settings/billing"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Upgrade to Pro
          <ArrowUpRight className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );
}