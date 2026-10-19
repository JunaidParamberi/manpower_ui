import type { ReactNode } from "react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type WorkspaceFormShellProps = {
  children: ReactNode;
  className?: string;
};

type WorkspaceFormAreaProps = {
  children: ReactNode;
  className?: string;
};

type WorkspaceFormSectionProps = {
  title: ReactNode;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
};

type WorkspaceInsightCardProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function WorkspaceFormShell({
  children,
  className,
}: WorkspaceFormShellProps) {
  return (
    <div
      className={cn(
        "grid w-full min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_360px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function WorkspaceFormMain({
  children,
  className,
}: WorkspaceFormAreaProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-5", className)}>
      {children}
    </div>
  );
}

export function WorkspaceFormAside({
  children,
  className,
}: WorkspaceFormAreaProps) {
  return (
    <aside
      className={cn(
        "flex min-w-0 flex-col gap-4 xl:sticky xl:top-6 xl:self-start",
        className,
      )}
    >
      {children}
    </aside>
  );
}

export function WorkspaceFormSection({
  title,
  description,
  action,
  children,
  footer,
  className,
  contentClassName,
}: WorkspaceFormSectionProps) {
  return (
    <Card
      className={cn(
        "border border-border shadow-sm ring-1 ring-border",
        className,
      )}
    >
      <CardHeader className="border-b border-border pb-4">
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent className={cn("pt-0", contentClassName)}>
        {children}
      </CardContent>
      {footer ? (
        <CardFooter className="border-t border-border">{footer}</CardFooter>
      ) : null}
    </Card>
  );
}

export function WorkspaceInsightCard({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: WorkspaceInsightCardProps) {
  return (
    <Card size="sm" className={cn("border border-border shadow-xs", className)}>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent className={cn("pt-0", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
