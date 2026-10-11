import type { AiPanelMode } from "@/lib/ai-panel/types";

export type PageSuggestion = {
  prompt: string;
  /** `agent` suggestions write; picking one switches the panel to Agent first. */
  mode: AiPanelMode;
};

export type PageSuggestions = {
  /** How Kraft names the page in its greeting ("You're on **Invoices**"). */
  pageLabel: string;
  items: PageSuggestion[];
};

type Rule = {
  match: (segments: string[]) => boolean;
  suggestions: PageSuggestions;
};

const ask = (prompt: string): PageSuggestion => ({ prompt, mode: "ask" });
const agent = (prompt: string): PageSuggestion => ({ prompt, mode: "agent" });

const DEFAULT: PageSuggestions = {
  pageLabel: "Manpower",
  items: [
    ask("What needs my attention today?"),
    ask("Summarize my week"),
    agent("Draft a status update for my most active client"),
  ],
};

/** Ids are the segment after a list route that is not a known sub-route. */
function isDetail(segments: string[], root: string, subRoutes: string[] = []): boolean {
  return segments[0] === root && segments.length >= 2 && segments[1] !== "new" && !subRoutes.includes(segments[1]);
}

const DOCUMENT_TYPES: Record<string, { label: string; items: PageSuggestion[] }> = {
  invoices: {
    label: "Invoices",
    items: [
      ask("Who's overdue right now?"),
      ask("How much did I invoice this quarter?"),
      agent("Draft a friendly nudge for the oldest overdue invoice"),
    ],
  },
  quotes: {
    label: "Quotes",
    items: [
      ask("Which quotes are still waiting on a reply?"),
      ask("What's my quote acceptance rate this year?"),
      agent("Draft a follow-up for the oldest unanswered quote"),
    ],
  },
  proposals: {
    label: "Proposals",
    items: [
      ask("Which proposals haven't been answered yet?"),
      ask("What's the total value of my open proposals?"),
      agent("Draft a follow-up for the oldest open proposal"),
    ],
  },
  "purchase-orders": {
    label: "Purchase orders",
    items: [
      ask("Which purchase orders are still open?"),
      ask("What's the total value of open purchase orders?"),
      agent("Draft a quote from my latest purchase order"),
    ],
  },
  receipts: {
    label: "Receipts",
    items: [
      ask("How many receipts did I issue this month?"),
      ask("Which clients paid me most this quarter?"),
      agent("Draft a thank-you email for my latest payment"),
    ],
  },
};

const DOCUMENT_SUB_ROUTES = [...Object.keys(DOCUMENT_TYPES), "@list"];

const RULES: Rule[] = [
  {
    match: (s) => s[0] === "dashboard" || s.length === 0,
    suggestions: {
      pageLabel: "Dashboard",
      items: [
        ask("What needs my attention today?"),
        ask("How is this month's revenue tracking?"),
        agent("Draft nudges for every overdue invoice"),
      ],
    },
  },
  {
    match: (s) => isDetail(s, "clients"),
    suggestions: {
      pageLabel: "this client",
      items: [
        ask("Summarize my history with this client"),
        ask("Does this client owe me anything?"),
        agent("Draft a check-in email to this client"),
      ],
    },
  },
  {
    match: (s) => s[0] === "clients",
    suggestions: {
      pageLabel: "Clients",
      items: [
        ask("Which clients need attention?"),
        ask("Who are my top clients by revenue this year?"),
        agent("Draft a check-in for a client I haven't heard from in a while"),
      ],
    },
  },
  {
    match: (s) => isDetail(s, "projects", ["templates"]),
    suggestions: {
      pageLabel: "this project",
      items: [
        ask("How is this project tracking?"),
        ask("What's left to do on this project?"),
        agent("Draft a status update for this project's client"),
      ],
    },
  },
  {
    match: (s) => s[0] === "projects",
    suggestions: {
      pageLabel: "Projects",
      items: [
        ask("Which projects are at risk?"),
        ask("What's due this week across my projects?"),
        agent("Draft a status update for my most active project"),
      ],
    },
  },
  {
    match: (s) => isDetail(s, "documents", DOCUMENT_SUB_ROUTES),
    suggestions: {
      pageLabel: "this document",
      items: [
        ask("Summarize this document"),
        ask("Has this document been paid or accepted?"),
        agent("Draft a follow-up email about this document"),
      ],
    },
  },
  {
    match: (s) => s[0] === "marketing",
    suggestions: {
      pageLabel: "Marketing",
      items: [
        ask("What's scheduled to post this week?"),
        ask("Which campaigns are running right now?"),
        agent("Draft a LinkedIn post about my latest project"),
      ],
    },
  },
  {
    match: (s) => s[0] === "finance" || s[0] === "expenses",
    suggestions: {
      pageLabel: "Finance",
      items: [
        ask("How much did I earn this month?"),
        ask("Is anything unusual in my income or expenses?"),
        agent("Draft nudges for every overdue invoice"),
      ],
    },
  },
  {
    match: (s) => s[0] === "tasks",
    suggestions: {
      pageLabel: "Tasks",
      items: [
        ask("What's due today?"),
        ask("Which tasks are overdue?"),
        agent("Create a task to follow up on my oldest open quote"),
      ],
    },
  },
  {
    match: (s) => s[0] === "time",
    suggestions: {
      pageLabel: "Time",
      items: [
        ask("How many hours did I log this week?"),
        ask("Which project took most of my time this month?"),
        agent("Draft an invoice from this month's unbilled time"),
      ],
    },
  },
];

/**
 * Context-aware starter prompts for Kraft's empty state. Pure and
 * path-only: detail pages use generic phrasing ("this client") because no
 * entity data is loaded here.
 */
export function suggestionsForPath(pathname: string): PageSuggestions {
  const segments = pathname.split("?")[0].split("/").filter(Boolean);

  if (segments[0] === "documents") {
    const type = DOCUMENT_TYPES[segments[1] ?? ""];
    if (type) {
      return { pageLabel: type.label, items: type.items };
    }
    if (!isDetail(segments, "documents", DOCUMENT_SUB_ROUTES)) {
      return {
        pageLabel: "Documents",
        items: [
          ask("Which documents need action?"),
          ask("Who's overdue right now?"),
          agent("Draft a friendly nudge for the oldest overdue invoice"),
        ],
      };
    }
  }

  return RULES.find((rule) => rule.match(segments))?.suggestions ?? DEFAULT;
}
