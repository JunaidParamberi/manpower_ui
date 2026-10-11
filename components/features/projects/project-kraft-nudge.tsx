"use client";

import { KraftFace } from "@/components/shared/kraft/kraft-face";
import { Button } from "@/components/ui/button";
import { useAiPanel } from "@/lib/ai-panel/context";
import type { Pace } from "@/lib/projects/project-pace";

/** One slim line from Kraft when a project needs you; nothing otherwise. */
export function ProjectKraftNudge({ pace, clientName, projectTitle, onDraft }: { pace: Pace; clientName: string | null; projectTitle: string; onDraft?: (prompt: string) => void }) {
  const panel = useAiPanel();
  if (!pace.needsYou) return null;
  const who = clientName ?? "the client";
  const lead = pace.kind === "late" ? "Past the deadline." : pace.kind === "over_budget" ? "Spending ahead of the work." : "Slipping.";
  const prompt = `Draft a short status update to ${who} about "${projectTitle}". It is ${pace.label.toLowerCase()} (${pace.detail}). Propose a realistic new date.`;
  const draft = onDraft ?? ((p: string) => panel.submitPrompt(p, "agent", { openPanel: true }));
  return (
    <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-border bg-card py-2.5 ps-3.5 pe-3 shadow-[inset_3px_0_0_var(--danger),var(--shadow-xs)]">
      <KraftFace emotion={pace.kind === "late" ? "confirm" : "thinking"} size={22} />
      <p className="min-w-48 flex-1 text-body text-[var(--fg-2)]">
        <span className="font-medium text-foreground">{lead}</span> I can draft an update to {who} with a new date.
      </p>
      <Button size="sm" variant="outline" onClick={() => draft(prompt)}>
        Draft update
      </Button>
    </div>
  );
}
