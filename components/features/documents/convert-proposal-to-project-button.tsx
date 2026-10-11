"use client";

import Link from "next/link";
import { ArrowRight, Briefcase } from "lucide-react";

import { Button } from "@/components/ui/button";

type ConvertProposalToProjectButtonProps = {
  documentId: string;
  clientId: string;
  className?: string;
  size?: "sm" | "default";
};

export function ConvertProposalToProjectButton({
  documentId,
  clientId,
  className,
  size = "sm",
}: ConvertProposalToProjectButtonProps) {
  const href = `/projects/new?client=${encodeURIComponent(clientId)}&proposal=${encodeURIComponent(documentId)}`;

  return (
    <Button
      size={size}
      variant="outline"
      nativeButton={false}
      render={<Link href={href} />}
      className={className}
    >
      <Briefcase className="size-4" />
      Convert to project
      <ArrowRight className="size-3" />
    </Button>
  );
}
