import { avatarPalette } from "@/lib/layout/account";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, " ").trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase() || "?";
}

/** Client name with a small initials tile; same client, same colour everywhere. */
export function ClientTile({ name, className }: { name: string | null; className?: string }) {
  const label = name ?? "No client";
  const mark = initials(label);
  const [from] = avatarPalette(mark);
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5 text-meta text-[var(--fg-2)]", className)}>
      <span
        aria-hidden
        className="grid size-3.5 shrink-0 place-items-center rounded-[4px] text-[7.5px] leading-none font-semibold text-white"
        // Colour is derived per client.
        style={{ background: from }}
      >
        {mark}
      </span>
      <span className="truncate">{label}</span>
    </span>
  );
}
