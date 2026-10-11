import { describe, expect, it } from "vitest";

import { pairMessagesIntoTurns } from "./pair-messages";
import type { ThreadMessage } from "@/lib/assistant/thread-queries";

function msg(role: "user" | "assistant", content: string): ThreadMessage {
  return { role, content, createdAt: new Date("2026-01-01T00:00:00Z"), actions: [], steps: [], draft: null, emailDraft: null };
}

describe("pairMessagesIntoTurns", () => {
  it("pairs alternating user/assistant rows into one turn each", () => {
    const messages: ThreadMessage[] = [
      msg("user", "Hi there"),
      msg("assistant", "Hello!"),
      msg("user", "What's next?"),
      msg("assistant", "Let's continue."),
    ];

    const turns = pairMessagesIntoTurns(messages, "ask");

    expect(turns).toHaveLength(2);
    expect(turns[0]).toMatchObject({ prompt: "Hi there", text: "Hello!", status: "done" });
    expect(turns[1]).toMatchObject({
      prompt: "What's next?",
      text: "Let's continue.",
      status: "done",
    });
  });

  it("marks a trailing unanswered user message as an error turn", () => {
    const messages: ThreadMessage[] = [
      msg("user", "Hi there"),
      msg("assistant", "Hello!"),
      msg("user", "Are you there?"),
    ];

    const turns = pairMessagesIntoTurns(messages, "ask");

    expect(turns).toHaveLength(2);
    expect(turns[1]).toMatchObject({ prompt: "Are you there?", text: "", status: "error" });
  });

  it("returns an empty array for an empty message list", () => {
    expect(pairMessagesIntoTurns([], "ask")).toEqual([]);
  });

  it("skips an assistant row with no preceding user row", () => {
    const messages: ThreadMessage[] = [
      msg("assistant", "orphaned reply"),
      msg("user", "Hi"),
      msg("assistant", "Hello!"),
    ];

    const turns = pairMessagesIntoTurns(messages, "ask");

    expect(turns).toHaveLength(1);
    expect(turns[0]).toMatchObject({ prompt: "Hi", text: "Hello!", status: "done" });
  });

  it("gives rehydrated turns the thread's mode", () => {
    const turns = pairMessagesIntoTurns(
      [
        { role: "user", content: "hi", createdAt: new Date(), actions: [], steps: [], draft: null, emailDraft: null },
        { role: "assistant", content: "hello", createdAt: new Date(), actions: [], steps: [], draft: null, emailDraft: null },
      ],
      "agent",
    );
    expect(turns[0].mode).toBe("agent");
    expect(turns[0].modeHint).toBeNull();
  });

  it("rehydrates the assistant row's persisted actions and steps onto the turn", () => {
    const actions: ThreadMessage["actions"] = [
      { type: "action", summary: "Created client", entity: "clients", entityId: "c1", undoToken: null },
    ];
    const steps: ThreadMessage["steps"] = [
      { tool: "create_record", entity: "clients", label: "Created client", status: "done" },
    ];
    const turns = pairMessagesIntoTurns(
      [
        { role: "user", content: "add a client", createdAt: new Date(), actions: [], steps: [], draft: null, emailDraft: null },
        { role: "assistant", content: "Done.", createdAt: new Date(), actions, steps, draft: null, emailDraft: null },
      ],
      "agent",
    );
    expect(turns[0].actions).toEqual(actions);
    expect(turns[0].steps).toEqual(steps);
  });

  it("folds a trailing orphan assistant row (post-confirm result) onto the preceding turn", () => {
    const confirmAction: ThreadMessage["actions"] = [
      { type: "action", summary: "Deleted client Acme", entity: "clients", entityId: "c1", undoToken: null },
    ];
    const confirmStep: ThreadMessage["steps"] = [
      { tool: "delete_record", entity: "clients", label: "Deleted client Acme", status: "done" },
    ];
    const turns = pairMessagesIntoTurns(
      [
        { role: "user", content: "delete Acme", createdAt: new Date(), actions: [], steps: [], draft: null, emailDraft: null },
        { role: "assistant", content: "I'll delete this client.", createdAt: new Date(), actions: [], steps: [], draft: null, emailDraft: null },
        { role: "assistant", content: "Deleted client Acme.", createdAt: new Date(), actions: confirmAction, steps: confirmStep, draft: null, emailDraft: null },
      ],
      "agent",
    );

    expect(turns).toHaveLength(1);
    expect(turns[0].text).toBe("I'll delete this client.\n\nDeleted client Acme.");
    expect(turns[0].actions).toEqual(confirmAction);
    expect(turns[0].steps).toEqual(confirmStep);
  });

  it("still skips an orphan assistant row with no preceding turn at all", () => {
    const turns = pairMessagesIntoTurns(
      [{ role: "assistant", content: "orphaned", createdAt: new Date(), actions: [], steps: [], draft: null, emailDraft: null }],
      "ask",
    );
    expect(turns).toEqual([]);
  });

  it("rehydrates a saved email draft so its card survives a reload", () => {
    const emailDraft: ThreadMessage["emailDraft"] = {
      mode: "follow_up",
      tone: "friendly",
      subject: "Invoice INV-0008",
      body: "Hi Sara, INV-0008 is attached.",
      targetSummary: "Invoice INV-0008 for Nova Retail",
      link: null,
    };
    const turns = pairMessagesIntoTurns(
      [
        { ...msg("user", "email it"), draft: null, emailDraft: null },
        { ...msg("assistant", "Drafted."), draft: null, emailDraft },
      ],
      "agent",
    );
    expect(turns[0].emailDraft).toEqual(emailDraft);
    expect(turns[0].draft).toBeNull();
  });
});
