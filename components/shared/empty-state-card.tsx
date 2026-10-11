import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type EmptyStateCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyStateCard({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateCardProps) {
  return (
    <Card className="border-dashed bg-[var(--bg-subtle)] shadow-none">
      <CardContent className="flex flex-col items-center gap-4 px-6 py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-card text-muted-foreground shadow-xs">
          <Icon className="size-5" />
        </div>
        <div className="flex max-w-md flex-col gap-1.5">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
        {action ? <div className="flex justify-center">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
