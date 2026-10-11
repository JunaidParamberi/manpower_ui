/** What has happened to a sent document: sent, viewed, paid. */
export function SentStrip({ parts, onActivity }: { parts: string[]; onActivity?: () => void }) {
  if (parts.length === 0) return null;
  return (
    <div className="mx-4 flex w-[calc(100%-2rem)] max-w-[800px] items-center gap-2.5 rounded-[var(--surface-radius)] border border-border bg-[var(--bg-surface)] px-3 py-2.5 text-[12px] text-[var(--fg-2)] sm:mx-0 sm:w-full">
      <span className="min-w-0 flex-1">{parts.join(" · ")}</span>
      {onActivity ? (
        <button type="button" onClick={onActivity} className="text-[var(--fg-3)] hover:text-[var(--fg)]">Activity</button>
      ) : null}
    </div>
  );
}
