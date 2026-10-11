/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * The "model" behind `/api/ai/stream` — deterministic, local, and honest.
 *
 * There is no AI in this frontend-only build, so every turn is composed from
 * the request itself (plus, where useful, facts read from the demo database).
 * The result is shaped exactly like the real agents' output, which keeps the
 * downstream UI intact: a document draft previews and applies, an email draft
 * lands in the composer, a generated campaign fills the planner, and the chat
 * panel streams its reply token by token.
 */
import type { CommunicationDraftResult } from "@/lib/ai/communication-draft-result";
import type { CampaignDraftItem } from "@/lib/ai/content-draft-result";
import type { DocumentDraftResult, DocumentDraftLineItem } from "@/lib/ai/document-writer-result";
import type { RelationshipReadResult } from "@/lib/ai/relationship-read-result";
import { getAgentLabel, isAgentId, type AgentId } from "@/lib/ai/agents";
import type { AIStreamRequestInput } from "@/lib/validations/ai-stream";

export type MockTurnFacts = {
  clientName: string | null;
  clientHealth: number | null;
  clientStatus: string | null;
};

export type MockTurn = {
  text: string;
  done: {
    draft?: DocumentDraftResult;
    emailDraft?: CommunicationDraftResult;
    caption?: string;
    hashtags?: string[];
    campaignDrafts?: CampaignDraftItem[];
    relationshipRead?: RelationshipReadResult;
  };
};

const DEMO_PREAMBLE =
  "Demo mode: this build ships without a model, so this reply is scripted — " +
  "but everything around it is real.";

const DEMO_BODY = [
  "The conversation is stored in mock-db.json, so it survives reloads and restarts.",
  "Create, edit and delete anywhere in the app (clients, projects, tasks, time, expenses, documents, marketing) and it all persists the same way.",
  "The workspace you're looking at was seeded the first time you signed in — every number on the dashboard is real data from that store.",
].join(" ");

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function titleFromPrompt(prompt: string, fallback: string): string {
  const cleaned = prompt
    .replace(/^(please\s+)?(can you\s+|could you\s+)?(draft|write|create|make|generate|prepare|send|show)\s+(me\s+)?(an?\s+|the\s+)?/i, "")
    .replace(/[.!?]+$/, "")
    .trim();
  const title = titleCase(cleaned || fallback);
  return title.slice(0, 200);
}

function detectDocType(prompt: string): DocumentDraftResult["docType"] {
  const lower = prompt.toLowerCase();
  if (/\binvoice|billing|payment due\b/.test(lower)) return "invoice";
  if (/\bproposal|pitch|scope of work\b/.test(lower)) return "proposal";
  return "quote";
}

function draftLineItems(docType: DocumentDraftResult["docType"]): DocumentDraftLineItem[] {
  if (docType === "invoice") {
    return [
      { description: "Discovery & requirements", quantity: 1, unitPrice: 1200 },
      { description: "Design & build", quantity: 24, unitPrice: 95 },
      { description: "Launch & handover", quantity: 1, unitPrice: 800 },
    ];
  }
  if (docType === "proposal") {
    return [
      { description: "Research & strategy", quantity: 1, unitPrice: 1500 },
      { description: "Design system & build", quantity: 32, unitPrice: 95 },
      { description: "Testing & launch", quantity: 1, unitPrice: 1100 },
    ];
  }
  return [
    { description: "Workshop & discovery", quantity: 1, unitPrice: 900 },
    { description: "Production", quantity: 16, unitPrice: 110 },
    { description: "Revisions", quantity: 2, unitPrice: 250 },
  ];
}

function buildDocumentDraft(input: AIStreamRequestInput): DocumentDraftResult {
  const prompt = input.prompt ?? "";
  const docType = detectDocType(prompt);
  const clientId = input.clientId ?? (input.input?.clientId as string | undefined);
  return {
    title: titleFromPrompt(prompt, `New ${docType}`),
    docType,
    lineItems: draftLineItems(docType),
    terms: "50% deposit up front, balance within 14 days of delivery.",
    notes: "Drafted in demo mode — edit any field before applying it.",
    currency: (input.input?.currency as string | undefined)?.toUpperCase() ?? "USD",
    clientMatchStatus: clientId ? "matched" : "none",
    ...(clientId ? { matchedClientId: clientId } : {}),
  };
}

function buildEmailDraft(
  input: AIStreamRequestInput,
  facts: MockTurnFacts,
): CommunicationDraftResult {
  const mode: CommunicationDraftResult["mode"] = input.mode === "reply" ? "reply" : "follow_up";
  const tone: CommunicationDraftResult["tone"] = input.tone ?? "friendly";
  const name = facts.clientName ?? "there";

  const opener =
    tone === "firm"
      ? `Hi ${name},\n\nI'm following up on the outstanding item below.`
      : tone === "formal"
        ? `Dear ${name},\n\nI hope this message finds you well.`
        : `Hi ${name},\n\nHope you're having a good week!`;

  const subject = mode === "reply" ? "Re: your message" : "Quick follow-up";
  const body = [
    opener,
    "",
    mode === "reply"
      ? "Thanks for your note — summarising where things stand so nothing gets lost."
      : "Just a gentle nudge on where we left off. Everything is on track on our side, and I wanted to check whether anything is needed from you.",
    "",
    tone === "firm"
      ? "Could you confirm by end of week so we can keep the timeline intact?"
      : "Happy to jump on a quick call if that's easier — just say the word.",
    "",
    tone === "formal" ? "Kind regards," : "Thanks!",
  ].join("\n");

  return {
    mode,
    tone,
    subject,
    body,
    targetSummary: facts.clientName ? `Check-in with ${facts.clientName}` : "Client check-in",
  };
}

function hashtagsFor(topic: string, platform: string): string[] {
  const base = topic
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 4)
    .map((word) => `#${word.replace(/-/g, "")}`);
  const platformTag = platform.toLowerCase().includes("linked") ? "#business" : "#behindthescenes";
  return [...new Set([...base, platformTag, "#studio"])].slice(0, 8);
}

function buildSinglePost(input: AIStreamRequestInput): { caption: string; hashtags: string[] } {
  const topic = String(input.input?.topic ?? "your latest project").trim() || "your latest project";
  const platform = String(input.input?.platform ?? "Instagram").trim() || "Instagram";
  const tone = String(input.input?.tone ?? "").trim();
  const caption = [
    `${titleCase(topic)}.`,
    "",
    `A short ${tone || "behind-the-scenes"} look at how it came together — from the first sketch to the finished work, and what we learned along the way.`,
    "",
    "If you're working on something similar, we'd love to hear about it in the comments.",
  ].join("\n");
  return { caption, hashtags: hashtagsFor(topic, platform) };
}

function buildCampaign(input: AIStreamRequestInput): CampaignDraftItem[] {
  const goal = String(input.input?.goal ?? "a month of content").trim() || "a month of content";
  const platforms = Array.isArray(input.input?.platforms)
    ? (input.input.platforms as unknown[]).filter((p): p is string => typeof p === "string")
    : [];
  const platformList = platforms.length ? platforms : ["Instagram"];
  const cadence = Number(input.input?.cadencePerWeek ?? 2) || 2;
  const start = input.input?.startDate ? new Date(String(input.input.startDate)) : new Date();
  const end = input.input?.endDate ? new Date(String(input.input.endDate)) : new Date(Date.now() + 28 * 86_400_000);
  const spanDays = Math.max(7, Math.min(365, Math.round((end.getTime() - start.getTime()) / 86_400_000)));
  const total = Math.max(4, Math.min(30, Math.round((spanDays / 7) * cadence)));

  const angles = ["Case study", "Process", "Tip", "Before & after", "Client story", "Tools we use"];
  const items: CampaignDraftItem[] = [];
  for (let i = 0; i < total; i++) {
    const dayOffset = Math.round((i * spanDays) / total);
    const platform = platformList[i % platformList.length];
    const angle = angles[i % angles.length];
    items.push({
      dayOffset,
      platform,
      title: `${angle}: ${goal}`,
      caption: `${angle} — ${goal}.\n\nWhat we did, why it worked, and what we'd do differently. Save this one for later.`,
      hashtags: hashtagsFor(`${goal} ${angle}`, platform),
    });
  }
  return items;
}

function buildRelationshipRead(facts: MockTurnFacts): RelationshipReadResult {
  const name = facts.clientName ?? "This client";
  const health = facts.clientHealth;
  const status = facts.clientStatus;

  const headline =
    health === null
      ? `${name}: worth a closer look`
      : health >= 75
        ? `${name} is in strong shape`
        : health >= 45
          ? `${name} is steady, with room to grow`
          : `${name} needs attention`;

  const assessment = [
    `${name} currently sits at ${health ?? "—"}${health === null ? "" : "/100"} on health${status ? ` with a “${status}” relationship status` : ""}.`,
    health !== null && health < 45
      ? "The main risks are slow response times and a thin recent touchpoint trail — both fixable with a short, specific check-in."
      : "Momentum looks healthy: recent work has shipped and the conversation is still open.",
    "The highest-leverage next step is a short note referencing their most recent deliverable, with one concrete offer attached.",
  ].join(" ");

  return {
    headline,
    assessment,
    plays: [
      {
        title: "Send a targeted check-in",
        rationale: `Reference ${name}'s most recent deliverable and offer one concrete next step.`,
      },
      {
        title: "Surface an unused service",
        rationale: "They have not bought the adjacent service yet — a short case study makes the ask easy.",
      },
      {
        title: "Lock in the next milestone",
        rationale: "Propose the next date while the last delivery is still fresh.",
      },
    ],
  };
}

/** Turn label used for the routing event and the seeded thread title. */
export function mockAgentFor(input: AIStreamRequestInput): AgentId {
  return input.agent && isAgentId(input.agent) ? input.agent : "router";
}

export function buildMockTurn(input: AIStreamRequestInput, facts: MockTurnFacts): MockTurn {
  const agent = mockAgentFor(input);
  const prompt = (input.prompt ?? "").trim();

  switch (agent) {
    case "document-writer": {
      const draft = buildDocumentDraft(input);
      const label = getAgentLabel(agent);
      return {
        text: `${DEMO_PREAMBLE} ${label} drafted a ${draft.docType} with ${draft.lineItems.length} line items — preview it below and apply it to a new document.`,
        done: { draft },
      };
    }

    case "communication-drafter": {
      const emailDraft = buildEmailDraft(input, facts);
      const label = getAgentLabel(agent);
      return {
        text: `${DEMO_PREAMBLE} ${label} put together a ${emailDraft.tone} ${emailDraft.mode.replace("_", " ")} you can send as-is or edit first.`,
        done: { emailDraft },
      };
    }

    case "content-marketer": {
      if (input.input?.mode === "generate-campaign") {
        const campaignDrafts = buildCampaign(input);
        return {
          text: `${DEMO_PREAMBLE} Planned ${campaignDrafts.length} posts across ${new Set(campaignDrafts.map((c) => c.platform)).size} platform(s). Review the calendar and add the ones you like.`,
          done: { campaignDrafts },
        };
      }
      const { caption, hashtags } = buildSinglePost(input);
      return {
        text: `${DEMO_PREAMBLE} Here's a caption plus hashtags — edit anything before publishing.`,
        done: { caption, hashtags },
      };
    }

    case "relationship-manager": {
      const relationshipRead = buildRelationshipRead(facts);
      return {
        text: `${DEMO_PREAMBLE} ${relationshipRead.headline}.`,
        done: { relationshipRead },
      };
    }

    default: {
      const label = agent === "router" ? "Manpower" : getAgentLabel(agent);
      const echo = prompt ? `You asked: “${prompt.slice(0, 160)}”. ` : "";
      return {
        text: `${DEMO_PREAMBLE} ${echo}${DEMO_BODY}`,
        done: {},
      };
    }
  }
}

/** Split a reply into small chunks so it streams like a real completion. */
export function chunkReply(text: string): string[] {
  const pieces = text.split(/(\s+)/).filter((piece) => piece.length > 0);
  const chunks: string[] = [];
  for (let i = 0; i < pieces.length; i += 3) {
    chunks.push(pieces.slice(i, i + 3).join(""));
  }
  return chunks.length ? chunks : [text];
}
