"use client";

import { toast } from "sonner";
import { Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CommunicationDraftResult } from "@/lib/ai/communication-draft-result";

type AiEmailDraftCardProps = {
  draft: CommunicationDraftResult;
  onOpenComposer: () => void;
};

const EMAIL_COMPONENTS = {
  a: ({ href, children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
    </a>
  ),
  code: ({ className, children, ...rest }: React.HTMLAttributes<HTMLElement>) => {
    const isBlock = className?.startsWith("language-");
    if (isBlock) {
      return (
        <pre className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3 text-sm overflow-x-auto">
          <code className={className} {...rest}>
            {children}
          </code>
        </pre>
      );
    }
    return (
      <code className="rounded bg-[var(--bg-surface)] px-1 py-0.5 font-mono text-[13px]" {...rest}>
        {children}
      </code>
    );
  },
};

const MODE_LABEL: Record<CommunicationDraftResult["mode"], string> = {
  follow_up: "Follow-up",
  reply: "Reply",
};

const TONE_LABEL: Record<CommunicationDraftResult["tone"], string> = {
  friendly: "Friendly",
  firm: "Firm",
  formal: "Formal",
};

async function copyBody(body: string) {
  try {
    await navigator.clipboard.writeText(body);
    toast.success("Email copied to clipboard");
  } catch {
    toast.error("Couldn't copy the email — try selecting the text instead");
  }
}

/**
 * Result card for the Communication Drafter Agent: shows the drafted email
 * (tone, mode, subject, body) with actions to open it in the full composer
 * or copy the body directly. Purely presentational — no sending logic here.
 */
export function AiEmailDraftCard({ draft, onOpenComposer }: AiEmailDraftCardProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{MODE_LABEL[draft.mode]}</Badge>
        <Badge variant="outline">{TONE_LABEL[draft.tone]}</Badge>
      </div>

      <p className="text-xs text-[var(--fg-3)]">{draft.targetSummary}</p>

      {draft.subject ? (
        <p className="text-sm font-semibold text-foreground">{draft.subject}</p>
      ) : null}

      <div className="ai-prose max-w-none rounded-lg border border-[var(--border)] bg-[var(--bg-canvas)] p-3 text-sm text-foreground">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={EMAIL_COMPONENTS}>
          {draft.body}
        </ReactMarkdown>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button size="sm" variant="outline" onClick={() => copyBody(draft.body)}>
          <Copy data-icon="inline-start" />
          Copy
        </Button>
        <Button size="sm" onClick={onOpenComposer}>
          Open in composer
        </Button>
      </div>
    </div>
  );
}
