"use client";

import { cn } from "@/lib/utils";

type AiChoiceButtonsProps = {
  choices: string[];
  onPick: (choice: string) => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Kraft's suggested answers to its own question ("Which client is this
 * for?"), parsed from `[[choice: …]]` markers by `extractChoices`. One
 * click sends the choice back as the user's reply. Only shown on the latest
 * finished turn, so old questions can't be answered twice.
 */
export function AiChoiceButtons({ choices, onPick, disabled = false, className }: AiChoiceButtonsProps) {
  if (choices.length === 0) {
    return null;
  }
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)} role="group" aria-label="Suggested answers">
      {choices.map((choice) => (
        <button
          key={choice}
          type="button"
          disabled={disabled}
          onClick={() => onPick(choice)}
          className="max-w-full truncate rounded-full border border-[var(--border-focus)]/40 bg-[var(--accent-soft)] px-3 py-1 text-[13px] font-medium text-[var(--border-focus)] transition-colors hover:bg-[var(--accent-soft-2)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent-ring)] disabled:pointer-events-none disabled:opacity-50"
        >
          {choice}
        </button>
      ))}
    </div>
  );
}
