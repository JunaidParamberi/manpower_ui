"use client";

import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
  variant?: "default" | "danger";
};

export function AccountSection({
  title,
  description,
  children,
  className,
  variant = "default",
}: Props) {
  return (
    <Card
      className={cn(
        variant === "danger" && "border-destructive/40 bg-destructive/5",
        className,
      )}
    >
      <CardHeader>
        <CardTitle
          className={cn(variant === "danger" && "text-destructive")}
        >
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
