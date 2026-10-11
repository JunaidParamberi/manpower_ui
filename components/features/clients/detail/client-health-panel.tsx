"use client";

import { useState } from "react";

import { AIThinking } from "@/components/shared/ai-thinking";
import { HealthRing } from "@/components/shared/health-ring";
import { AiEmailDraftCard } from "@/components/features/ai-panel/ai-email-draft-card";
import { EmailComposerModal } from "@/components/features/communication/email-composer-modal";
import { Button } from "@/components/ui/button";
import { useAIStream } from "@/hooks/use-ai-stream";
import { bandLabel } from "@/lib/clients/health-display";
import type { HealthSignal } from "@/lib/clients/health-facts";
import type { ClientHealthSnapshotRow } from "@/lib/clients/health-queries";
import { cn } from "@/lib/utils";

type ClientHealthPanelProps = {
  clientId: string;
  clientName: string;
  clientEmail: string | null;
  snapshot: ClientHealthSnapshotRow | null;
};

const SEVERITY_DOT: Record<HealthSignal["severity"], string> = {
  critical: "bg-[var(--danger)]",
  warning: "bg-[var(--warning)]",
  info: "bg-[var(--fg-3)]",
};

const SECTION = "mx-4 mt-5 overflow-hidden rounded-xl border border-border bg-card shadow-xs sm:mx-6 lg:mx-7";
const BLOCK = "border-t border-border px-4 py-3";

function formatSnapshotDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(
    new Date(`${dateStr}T12:00:00.000Z`),
  );
}

/** The one card on the client Overview: health band, the signals behind it, and a drafted nudge. */
export function ClientHealthPanel({
  clientId,
  clientName,
  clientEmail,
  snapshot,
}: ClientHealthPanelProps) {
  const { status, error, donePayload, stream } = useAIStream();
  const {
    status: draftStatus,
    error: draftError,
    donePayload: draftDonePayload,
    stream: streamDraft,
  } = useAIStream();
  const [composerOpen, setComposerOpen] = useState(false);
  const isStreaming = status === "streaming";
  const isDrafting = draftStatus === "streaming";
  const read = donePayload?.relationshipRead ?? null;
  const draft = draftDonePayload?.emailDraft ?? null;

  function explain() {
    void stream({ agent: "relationship-manager", input: { clientId } });
  }

  function draftCheckIn() {
    void streamDraft({
      agent: "communication-drafter",
      mode: "follow_up",
      clientId,
    });
  }

  if (!snapshot) {
    return (
      <section className={SECTION} aria-label="Relationship health">
        <header className="flex min-h-[46px] items-center gap-2.5 px-4 py-2.5">
          <HealthRing score={null} size={26} strokeWidth={2.5} />
          <h3 className="flex-1 text-card-title">Relationship health</h3>
        </header>
        <p className={cn(BLOCK, "text-body text-[var(--fg-3)]")}>Not scored yet. Scores update every night.</p>
      </section>
    );
  }

  return (
    <section className={SECTION} aria-label="Relationship health">
      <header className="flex min-h-[46px] items-center gap-2.5 px-4 py-2.5">
        <HealthRing score={snapshot.score} size={26} strokeWidth={2.5} />
        <h3 className="flex-1 text-card-title">{bandLabel(snapshot.band)}</h3>
        <Button size="sm" onClick={draftCheckIn} disabled={isDrafting}>
          Draft a nudge
        </Button>
      </header>

      {snapshot.signals.length === 0 ? (
        <p className={cn(BLOCK, "text-body text-[var(--fg-3)]")}>Nothing needs attention.</p>
      ) : (
        <ul className="border-t border-border">
          {snapshot.signals.map((signal) => (
            <li key={signal.kind} className="flex items-start gap-2.5 border-t border-border px-4 py-2.5 first:border-t-0">
              <span aria-hidden className={cn("mt-[7px] size-1.5 shrink-0 rounded-full", SEVERITY_DOT[signal.severity])} />
              <div className="min-w-0">
                <p className="text-body text-foreground">{signal.title}</p>
                <p className="text-meta text-[var(--fg-3)]">{signal.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-2">
        <span className="flex-1 text-meta text-[var(--fg-3)]">Checked {formatSnapshotDate(snapshot.snapshotDate)}</span>
        <Button variant="ghost" size="sm" onClick={explain} disabled={isStreaming}>
          Explain this
        </Button>
      </div>

      {isStreaming ? (
        <div className={BLOCK}>
          <AIThinking />
        </div>
      ) : read ? (
        <div className={cn(BLOCK, "flex flex-col gap-1.5")}>
          <p className="text-body font-medium">{read.headline}</p>
          <p className="text-body text-[var(--fg-2)]">{read.assessment}</p>
          {read.plays.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {read.plays.map((play, index) => (
                <li key={`play-${index}`} className="text-body">
                  <span className="font-medium">{play.title}</span>
                  <span className="text-[var(--fg-2)]">. {play.rationale}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {error ? <p className={cn(BLOCK, "text-body text-[var(--danger)]")}>{error}</p> : null}

      {isDrafting ? (
        <div className={BLOCK}>
          <AIThinking label="Drafting email" />
        </div>
      ) : null}

      {draftStatus === "error" ? (
        <div className={cn(BLOCK, "flex items-center gap-3")}>
          <p className="flex-1 text-body text-[var(--danger)]">{draftError ?? "The draft didn't finish."}</p>
          <Button size="sm" variant="outline" onClick={draftCheckIn}>
            Try again
          </Button>
        </div>
      ) : null}

      {draft ? (
        <div className={BLOCK}>
          <AiEmailDraftCard draft={draft} onOpenComposer={() => setComposerOpen(true)} />
        </div>
      ) : null}

      {draft ? (
        <EmailComposerModal
          open={composerOpen}
          onOpenChange={setComposerOpen}
          initialTo={clientEmail ?? ""}
          initialSubject={draft.subject ?? `Checking in, ${clientName}`}
          initialBody={draft.body}
        />
      ) : null}
    </section>
  );
}
