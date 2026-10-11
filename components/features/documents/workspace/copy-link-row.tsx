"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

/** A link with a copy button, used for the pay link and approval link in the rail. */
export function CopyLinkRow({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy. Select the link and copy it by hand.");
    }
  }
  return (
    <div className="flex min-h-9 items-center justify-between gap-2.5 py-1 pr-1.5 pl-2 text-[13px]">
      <span className="shrink-0 text-[var(--fg-2)]">{label}</span>
      <button
        type="button"
        onClick={() => void copy()}
        title={url}
        className="flex min-w-0 items-center gap-1.5 rounded-[var(--item-radius)] px-1.5 py-1 font-medium hover:bg-[var(--bg-subtle)]"
      >
        <span className="truncate font-mono text-[11px] text-[var(--fg-2)]">{url.replace(/^https?:\/\//, "")}</span>
        {copied ? <Check className="size-3.5 shrink-0 text-[var(--success)]" /> : <Copy className="size-3.5 shrink-0 text-[var(--fg-3)]" />}
      </button>
    </div>
  );
}
