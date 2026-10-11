"use client";

import Link from "next/link";
import {
  FileCheck2,
  FileText,
  MessageSquareQuote,
  ReceiptText,
  ShoppingBag,
} from "lucide-react";

import { NewDocumentButton } from "@/components/features/documents/workspace/new-document-button";
import { AiIcon } from "@/components/shared/ai-icon";
import { documentTypeLabel } from "@/lib/documents/display";
import type { DocumentType } from "@/types";

const TYPE_ICONS: Partial<Record<DocumentType, React.ElementType>> = {
  invoice: ReceiptText,
  quote: MessageSquareQuote,
  proposal: FileCheck2,
  local_purchase_order: ShoppingBag,
  receipt: ReceiptText,
};

const TYPE_SUBTITLES: Partial<Record<DocumentType, string>> = {
  invoice: "Send invoices, track payments, get paid on time.",
  quote: "Send pricing breakdowns for client approval.",
  proposal: "Win projects with polished, detailed proposals.",
  local_purchase_order: "Record client LPOs and track billing against them.",
  receipt: "Generate payment receipts automatically.",
};

export function DocumentsTypeEmpty({ type }: { type: DocumentType }) {
  const label = documentTypeLabel(type);
  const Icon = TYPE_ICONS[type] ?? FileText;
  const subtitle = TYPE_SUBTITLES[type] ?? "Create your first document.";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16">
      {/* Icon container */}
      <div className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-border/70 bg-card shadow-sm">
        <Icon className="size-6 text-muted-foreground" strokeWidth={1.5} />
      </div>

      {/* Heading */}
      <h3 className="font-heading text-base font-semibold tracking-tight text-foreground">
        No {label.toLowerCase()}s yet
      </h3>
      <p className="mt-1.5 max-w-[260px] text-center text-sm leading-relaxed text-muted-foreground">
        {subtitle}
      </p>

      {/* Actions */}
      <div className="mt-7 flex flex-col items-center gap-2.5">
        {type !== "receipt" ? <NewDocumentButton contextType={type} size="default" /> : null}
        <Link
          href="/documents/new"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <AiIcon size={13} />
          Create with AI
        </Link>
      </div>
    </div>
  );
}
