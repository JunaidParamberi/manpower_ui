import { cn } from "@/lib/utils";

/** One line above the paper: what's missing before sending, or that it's ready. */
export function ReadinessLine({ message, action }: { message: string | null; action?: { label: string; onClick: () => void } }) {
  const ready = message === null;
  return (
    <div className="flex w-full max-w-[800px] items-center gap-2.5 px-4 text-[12px] text-[var(--fg-2)] sm:px-0">
      <span aria-hidden className={cn("size-[7px] shrink-0 rounded-full", ready ? "bg-[var(--success)]" : "bg-[var(--warning)]")} />
      <span>
        {ready ? "Ready to send. Your client sees exactly this page." : message}{" "}
        {!ready && action ? (
          <button type="button" onClick={action.onClick} className="font-medium text-[var(--accent)]">{action.label}</button>
        ) : null}
      </span>
    </div>
  );
}
