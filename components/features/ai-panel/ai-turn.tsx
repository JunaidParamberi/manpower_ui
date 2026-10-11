"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AiTextResponse } from "@/components/features/ai-panel/ai-text-response";
import { AiDocumentDraftCard } from "@/components/features/ai-panel/ai-document-draft-card";
import { AiEmailDraftCard } from "@/components/features/ai-panel/ai-email-draft-card";
import { AiActionCard } from "@/components/features/ai-panel/ai-action-card";
import { AiConfirmCard } from "@/components/features/ai-panel/ai-confirm-card";
import { AiModeHintCard } from "@/components/features/ai-panel/ai-mode-hint-card";
import { AiStepTrail } from "@/components/features/ai-panel/ai-step-trail";
import { AiChoiceButtons } from "@/components/features/ai-panel/ai-choice-buttons";
import { extractChoices } from "@/lib/ai-panel/choices";
import { EmailComposerModal } from "@/components/features/communication/email-composer-modal";
import { KraftFace } from "@/components/shared/kraft/kraft-face";
import { useAiPanel } from "@/lib/ai-panel/context";
import { useKraftMascot } from "@/lib/ai-panel/kraft-mascot-context";
import { useAiTurnStream } from "@/hooks/use-ai-turn-stream";
import { useResolveConfirm } from "@/hooks/use-resolve-confirm";
import { invalidateAfterWrite } from "@/lib/ai-panel/invalidate-after-write";
import { createDocumentFromAiDraft } from "@/lib/documents/ai-draft-actions";
import { summarizeActionsForToast } from "@/lib/assistant/action-summary-toast";
import type { AiTurn as AiTurnData } from "@/lib/ai-panel/types";

type AiTurnProps = {
  turn: AiTurnData;
  /** Only the latest turn's avatar is live; older turns freeze at idle. */
  isLatest?: boolean;
};

/** The latest turn's avatar follows Kraft live; older ones freeze at idle (and skip the context). */
function KraftTurnAvatar({ live }: { live: boolean }) {
  return live ? <LiveAvatar /> : <KraftFace emotion="idle" size={28} live={false} />;
}

function LiveAvatar() {
  const { emotion } = useKraftMascot();
  return <KraftFace emotion={emotion} size={28} />;
}

export function AiTurn({ turn, isLatest = false }: AiTurnProps) {
  const router = useRouter();
  const { updateTurn, close, threadId, turns, switchModeAndRerun, onThreadCreated, submitPrompt } = useAiPanel();
  const { run, actions } = useAiTurnStream(turn.id, updateTurn, { threadId, onThreadCreated });
  const [creating, setCreating] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const resolveConfirm = useResolveConfirm();
  const anyStreaming = turns.some((t) => t.status === "streaming");

  useEffect(() => {
    // Fires on mount only ([] deps). Under React StrictMode dev the mount →
    // cleanup(abort) → remount cycle re-runs this and starts a fresh stream —
    // which is what we want. A persistent "already started" ref would instead
    // leave the aborted first run permanent (stuck "Thinking"). Retry re-runs
    // via handleRetry; a done turn (text present / status not streaming) is
    // skipped by the guard below. Mode is the value at submit time — a later
    // toggle replays nothing.
    if (turn.status === "streaming" && turn.text.length === 0) {
      void run({ prompt: turn.prompt, mode: turn.mode });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (turn.status !== "done") {
      return;
    }
    // Runs on EVERY completed turn, not just tool-bearing ones: the `ai-thread`
    // tag (busted unconditionally by the invalidate action) is what keeps the
    // 30s-cached thread history from serving a truncated conversation on reload.
    // The refresh + toast stay gated on an actual write.
    const message = summarizeActionsForToast(actions);
    void invalidateAfterWrite(actions).then(() => {
      if (message) {
        router.refresh();
        toast.success(message);
      }
    });
    // run when this turn transitions to done
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn.status]);

  async function handleCreateDraft() {
    if (!turn.draft) {
      return;
    }
    setCreating(true);
    const result = await createDocumentFromAiDraft(turn.draft);
    setCreating(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    close();
    router.push(`/documents/${result.documentId}`);
  }

  function handleRetry() {
    updateTurn(turn.id, {
      status: "streaming",
      text: "",
      error: null,
      actions: [],
      pendingConfirm: null,
      modeHint: null,
      activeTool: null,
      steps: [],
    });
    void run({ prompt: turn.prompt, mode: turn.mode });
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-xl bg-[var(--bg-subtle)] px-3 py-2 text-sm text-foreground">
          {turn.prompt}
        </div>
      </div>

      <div className="flex items-start gap-2.5">
        <div className="grid size-7 shrink-0 place-items-center">
          <KraftTurnAvatar live={isLatest} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <AiStepTrail steps={turn.steps} actions={turn.actions} waitingOnConfirm={turn.pendingConfirm !== null} />

          {turn.actions.map((action, index) => (
            <AiActionCard key={`${action.entity}-${index}`} action={action} />
          ))}

          {turn.pendingConfirm && (
            <AiConfirmCard
              confirm={turn.pendingConfirm}
              onResolved={(approved, write) => resolveConfirm(turn, approved, write)}
            />
          )}

          {turn.modeHint && (
            <AiModeHintCard
              hint={turn.modeHint}
              disabled={anyStreaming}
              onSwitch={() => switchModeAndRerun(turn)}
            />
          )}

          {turn.draft ? (
            <AiDocumentDraftCard
              draft={turn.draft}
              creating={creating}
              onCreateDraft={handleCreateDraft}
            />
          ) : null}

          {turn.emailDraft ? (
            <AiEmailDraftCard
              draft={turn.emailDraft}
              onOpenComposer={() => setComposerOpen(true)}
            />
          ) : null}

          <div className="max-w-[95%]">
            {turn.status === "error" ? (
              <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3">
                <p className="text-sm text-[var(--danger)]">{turn.error}</p>
                <Button size="sm" variant="outline" onClick={handleRetry}>
                  Retry
                </Button>
              </div>
            ) : (
              <AiTextResponse text={turn.text} streaming={turn.status === "streaming"} />
            )}
          </div>

          {isLatest && turn.status === "done" ? (
            <AiChoiceButtons
              choices={extractChoices(turn.text).choices}
              disabled={anyStreaming}
              onPick={(choice) => submitPrompt(choice, turn.mode)}
            />
          ) : null}
        </div>
      </div>

      <EmailComposerModal
        open={composerOpen}
        onOpenChange={setComposerOpen}
        initialTo=""
        initialSubject={turn.emailDraft?.subject ?? ""}
        initialBody={turn.emailDraft?.body ?? ""}
        link={turn.emailDraft?.link ?? null}
      />
    </div>
  );
}
