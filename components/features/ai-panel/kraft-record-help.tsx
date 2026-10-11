"use client";

import { useState } from "react";
import { ArrowLeft, ArrowUp, MessageSquare } from "lucide-react";

import { AiChoiceButtons } from "@/components/features/ai-panel/ai-choice-buttons";
import { AiConfirmCard } from "@/components/features/ai-panel/ai-confirm-card";
import { AiStepTrail } from "@/components/features/ai-panel/ai-step-trail";
import { AiTextResponse } from "@/components/features/ai-panel/ai-text-response";
import { KraftFace } from "@/components/shared/kraft/kraft-face";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAiPanel } from "@/lib/ai-panel/context";
import { useKraftMascot } from "@/lib/ai-panel/kraft-mascot-context";
import type { AiTurn } from "@/lib/ai-panel/types";
import { issueCount, type RecordHelp, type RecordHelpItem } from "@/lib/kraft/record-help";
import { extractChoices } from "@/lib/ai-panel/choices";
import { useResolveConfirm } from "@/hooks/use-resolve-confirm";

const linkButtonClass =
  "inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-[var(--fg-2)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent-ring)]";

/** One suggestion row: amber "!" for a problem Kraft found, a sparkle for an idea. */
export function KraftHelpItem({
  item,
  disabled,
  onPick,
}: {
  item: RecordHelpItem;
  disabled?: boolean;
  onPick: (item: RecordHelpItem) => void;
}) {
  const issue = item.tone === "issue";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onPick(item)}
      className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[var(--bg-subtle)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent-ring)] disabled:pointer-events-none disabled:opacity-50"
    >
      <span
        aria-hidden
        className={cn(
          "mt-px grid size-[22px] shrink-0 place-items-center rounded-md text-[11px] font-bold",
          issue ? "bg-[var(--warning-soft)] text-[var(--warning)]" : "bg-[var(--bg-subtle)] text-[var(--fg-2)]",
        )}
      >
        {issue ? "!" : "✦"}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-foreground">{item.title}</span>
        <span className="block text-xs text-[var(--fg-3)]">{item.detail}</span>
      </span>
    </button>
  );
}

/**
 * Kraft's answer to a suggestion, shown inside the popover: the folded step
 * trail, the confirm card when Kraft wants to change something (with the
 * before → after it lists), then the streamed reply. The turn itself runs
 * in the chat thread; this only renders it.
 */
export function KraftRecordAnswer({
  turn,
  onResolved,
  onReply,
}: {
  turn: AiTurn;
  onResolved: (approved: boolean, write: { entity: string; entityId: string | null } | null) => void;
  /** Answer Kraft's question: a clicked choice or typed text. Omit for a read-only view. */
  onReply?: (text: string) => void;
}) {
  const hasDraft = Boolean(turn.draft || turn.emailDraft);
  const done = turn.status === "done";
  const { choices } = extractChoices(turn.text);
  return (
    <div className="flex flex-col gap-2.5 px-1 pt-1">
      <p className="rounded-lg bg-[var(--bg-subtle)] px-2.5 py-1.5 text-xs text-[var(--fg-2)]">{turn.prompt}</p>
      <AiStepTrail steps={turn.steps} actions={turn.actions} waitingOnConfirm={turn.pendingConfirm !== null} />
      {turn.pendingConfirm ? <AiConfirmCard confirm={turn.pendingConfirm} onResolved={onResolved} /> : null}
      {turn.status === "error" ? (
        <p className="text-sm text-[var(--danger)]">{turn.error}</p>
      ) : (
        <div className="max-h-64 overflow-y-auto text-[13.5px]">
          <AiTextResponse text={turn.text} streaming={turn.status === "streaming"} />
        </div>
      )}
      {hasDraft && done ? <p className="text-xs text-[var(--fg-3)]">The draft is ready in the chat.</p> : null}
      {onReply && done ? (
        <>
          <AiChoiceButtons choices={choices} onPick={onReply} />
          <KraftReplyBox onSend={onReply} placeholder={choices.length > 0 ? "Or type something else…" : "Reply to Kraft…"} />
        </>
      ) : null}
    </div>
  );
}

/** A one-line reply box inside the popover, so a question can be answered without opening the chat. */
function KraftReplyBox({ onSend, placeholder }: { onSend: (text: string) => void; placeholder: string }) {
  const [value, setValue] = useState("");
  const text = value.trim();
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (text) {
          onSend(text);
          setValue("");
        }
      }}
      className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-canvas)] py-1 pr-1 pl-2.5 transition-[border-color,box-shadow] focus-within:border-[var(--border-focus)] focus-within:ring-3 focus-within:ring-[var(--accent-ring)]"
    >
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label="Reply to Kraft"
        className="min-w-0 flex-1 bg-transparent py-1 text-[13px] text-foreground outline-none placeholder:text-[var(--fg-3)]"
      />
      <button
        type="submit"
        disabled={!text}
        aria-label="Send reply"
        className="grid size-7 shrink-0 place-items-center rounded-lg bg-[var(--border-focus)] text-[var(--fg-on-accent)] transition-opacity disabled:opacity-40"
      >
        <ArrowUp className="size-3.5" strokeWidth={2.2} aria-hidden />
      </button>
    </form>
  );
}

type KraftRecordHelpProps = {
  help: RecordHelp;
  className?: string;
};

/**
 * Kraft's button on a record page (invoice, quote, client, project). The
 * count is the number of problems Kraft spotted on this record. The popover
 * lists them first, then a few useful next steps; picking one asks the
 * assistant (which knows the record on screen) and shows the answer right
 * here. Writes still pause on the usual confirm card. "Continue in chat"
 * opens the island on the same conversation.
 */
export function KraftRecordHelp({ help, className }: KraftRecordHelpProps) {
  const { turns, mode, setMode, submitPrompt, open: openChat, setInlineTurnId } = useAiPanel();
  const { emotion } = useKraftMascot();
  const resolveConfirm = useResolveConfirm();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [turnId, setTurnId] = useState<string | null>(null);

  const count = issueCount(help);
  const turn = turnId ? (turns.find((t) => t.id === turnId) ?? null) : null;
  const busy = turns.some((t) => t.status === "streaming" && t.id !== turnId);

  function pick(item: RecordHelpItem) {
    if (item.mode !== mode) {
      setMode(item.mode);
    }
    // Runs in the thread without opening the chat; the popover shows it.
    const id = submitPrompt(item.prompt, item.mode, { openPanel: false });
    setTurnId(id);
    setInlineTurnId(id);
  }

  function reply(text: string) {
    if (!turn) {
      return;
    }
    const id = submitPrompt(text, turn.mode, { openPanel: false });
    setTurnId(id);
    setInlineTurnId(id);
  }

  function back() {
    setTurnId(null);
    setInlineTurnId(null);
  }

  function continueInChat() {
    setPopoverOpen(false);
    setInlineTurnId(null);
    openChat();
  }

  return (
    <Popover
      open={popoverOpen}
      onOpenChange={(next) => {
        setPopoverOpen(next);
        if (!next) {
          // A pending confirm goes back to the bar's peek card once this closes.
          setInlineTurnId(null);
        } else if (turnId) {
          setInlineTurnId(turnId);
        }
      }}
    >
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={count > 0 ? `Kraft found ${count} thing${count === 1 ? "" : "s"} to fix` : "Ask Kraft about this"}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full bg-[var(--accent-soft)] py-1 pr-3 pl-1 text-[13px] font-medium text-[var(--border-focus)] transition-colors hover:bg-[var(--accent-soft-2)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent-ring)]",
              className,
            )}
          />
        }
      >
        <KraftFace emotion={count > 0 ? "confirm" : "idle"} size={24} live={false} />
        Kraft
        {count > 0 ? (
          <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[var(--border-focus)] px-1 text-[11px] font-semibold text-[var(--fg-on-accent)] tabular-nums">
            {count}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(380px,calc(100vw-32px))] gap-1 rounded-2xl p-2">
        <div className="flex items-center gap-2 px-1.5 pt-0.5 pb-1.5">
          <KraftFace emotion={turn ? emotion : "idle"} size={22} live={Boolean(turn)} />
          <p className="min-w-0 flex-1 truncate text-xs text-[var(--fg-3)]">
            <span className="font-semibold text-foreground">Kraft</span> · {help.label}
          </p>
        </div>

        {turn ? (
          <>
            <KraftRecordAnswer
              turn={turn}
              onResolved={(approved, write) => resolveConfirm(turn, approved, write)}
              onReply={busy ? undefined : reply}
            />
            <div className="mt-1 flex items-center justify-between border-t border-[var(--border)] px-0.5 pt-1.5">
              <button type="button" onClick={back} className={linkButtonClass}>
                <ArrowLeft className="size-3.5" aria-hidden />
                Other suggestions
              </button>
              <button type="button" onClick={continueInChat} className={linkButtonClass}>
                <MessageSquare className="size-3.5" aria-hidden />
                Continue in chat
              </button>
            </div>
          </>
        ) : (
          <>
            {help.items.map((item) => (
              <KraftHelpItem key={item.id} item={item} disabled={busy} onPick={pick} />
            ))}
            {busy ? (
              <p className="px-2 pt-1 text-xs text-[var(--fg-3)]">Kraft is finishing another task. Try again in a moment.</p>
            ) : null}
            <div className="mt-1 border-t border-[var(--border)] px-0.5 pt-1.5">
              <button type="button" onClick={continueInChat} className={linkButtonClass}>
                <MessageSquare className="size-3.5" aria-hidden />
                Ask something else
              </button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
