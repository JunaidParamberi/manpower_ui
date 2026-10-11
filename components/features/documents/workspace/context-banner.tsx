import { X } from "lucide-react";
import type { CSSProperties } from "react";
import { naturalList } from "@/lib/documents/editor/natural-list";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Shown right after New from a client or project: what was filled in for you. */
export function ContextBanner({
  clientName, clientColor, filled, onDismiss,
}: { clientName: string; clientColor: string; filled: string[]; onDismiss: () => void }) {
  const initials = clientName.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="mx-4 flex w-[calc(100%-2rem)] max-w-[800px] items-center gap-2.5 rounded-[var(--surface-radius)] border border-border bg-[var(--bg-surface)] px-3 py-2.5 text-[12px] text-[var(--fg-2)] sm:mx-0 sm:w-full">
      <span
        className="grid size-[22px] shrink-0 place-items-center rounded-md bg-[var(--dot)] text-[10px] font-bold text-white"
        style={{ "--dot": clientColor } as CSSProperties}
      >
        {initials}
      </span>
      <span className="min-w-0 flex-1">
        Started from <b className="font-semibold text-[var(--fg)]">{clientName}</b>. {capitalize(naturalList(filled))} are filled in from their profile.
      </span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss" className="grid size-6 place-items-center rounded-[var(--item-radius)] text-[var(--fg-3)] hover:bg-[var(--bg-subtle)]">
        <X className="size-3.5" />
      </button>
    </div>
  );
}
