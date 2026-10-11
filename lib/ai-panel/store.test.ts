import { describe, it, expect } from "vitest";
import { aiPanelReducer, initialAiPanelState } from "./store";

describe("aiPanelReducer", () => {
  it("toggles open", () => {
    const s = aiPanelReducer(initialAiPanelState, { type: "toggle" });
    expect(s.isOpen).toBe(true);
    expect(aiPanelReducer(s, { type: "close" }).isOpen).toBe(false);
  });

  it("adds a turn without opening the panel when asked to", () => {
    const s = aiPanelReducer(initialAiPanelState, {
      type: "addTurn",
      turn: { id: "t1", prompt: "hi", mode: "ask" },
      open: false,
    });
    expect(s.isOpen).toBe(false);
    expect(s.turns).toHaveLength(1);
  });

  it("adds a turn (opens panel) and updates it by id", () => {
    const added = aiPanelReducer(initialAiPanelState, {
      type: "addTurn",
      turn: { id: "t1", prompt: "hi", mode: "ask" },
    });
    expect(added.isOpen).toBe(true);
    expect(added.turns).toHaveLength(1);
    expect(added.turns[0]).toMatchObject({ id: "t1", prompt: "hi", status: "streaming" });

    const updated = aiPanelReducer(added, {
      type: "updateTurn",
      id: "t1",
      patch: { status: "done", text: "answer" },
    });
    expect(updated.turns[0].status).toBe("done");
    expect(updated.turns[0].text).toBe("answer");
  });

  it("updateTurn on unknown id is a no-op", () => {
    const s = aiPanelReducer(initialAiPanelState, { type: "updateTurn", id: "x", patch: { text: "a" } });
    expect(s.turns).toHaveLength(0);
  });

  it("clear empties turns but keeps open state", () => {
    let s = aiPanelReducer(initialAiPanelState, { type: "open" });
    s = aiPanelReducer(s, { type: "addTurn", turn: { id: "t1", prompt: "hi", mode: "ask" } });
    s = aiPanelReducer(s, { type: "clear" });
    expect(s.turns).toHaveLength(0);
    expect(s.isOpen).toBe(true);
  });
});

describe("aiPanelReducer — assistant turn fields", () => {
  it("initialises a new turn with empty assistant fields", () => {
    const state = aiPanelReducer(initialAiPanelState, {
      type: "addTurn",
      turn: { id: "t1", prompt: "hi", mode: "ask" },
    });
    const turn = state.turns[0];
    expect(turn.actions).toEqual([]);
    expect(turn.pendingConfirm).toBeNull();
    expect(turn.activeTool).toBeNull();
  });

  it("appends an action to a turn", () => {
    const seeded = aiPanelReducer(initialAiPanelState, {
      type: "addTurn",
      turn: { id: "t1", prompt: "hi", mode: "ask" },
    });
    const state = aiPanelReducer(seeded, {
      type: "updateTurn",
      id: "t1",
      patch: {
        actions: [
          {
            type: "action",
            summary: "Created task",
            entity: "tasks",
            entityId: null,
            undoToken: null,
          },
        ],
      },
    });
    expect(state.turns[0].actions).toHaveLength(1);
  });
});

describe("aiPanelReducer — mode", () => {
  it("defaults to ask mode", () => {
    expect(initialAiPanelState.mode).toBe("ask");
  });

  it("switches to agent mode", () => {
    const state = aiPanelReducer(initialAiPanelState, {
      type: "setMode",
      mode: "agent",
    });
    expect(state.mode).toBe("agent");
  });

  it("keeps the thread when the mode changes", () => {
    const seeded = aiPanelReducer(initialAiPanelState, {
      type: "addTurn",
      turn: { id: "t1", prompt: "hi", mode: "ask" },
    });
    const state = aiPanelReducer(seeded, { type: "setMode", mode: "agent" });
    expect(state.turns).toHaveLength(1);
  });

  it("preserves mode when adding a turn (addTurn spreads state)", () => {
    const agent = aiPanelReducer(initialAiPanelState, {
      type: "setMode",
      mode: "agent",
    });
    const added = aiPanelReducer(agent, {
      type: "addTurn",
      turn: { id: "t1", prompt: "hi", mode: "ask" },
    });
    expect(added.mode).toBe("agent");
    expect(added.turns).toHaveLength(1);
  });
});

describe("aiPanelReducer — threadId", () => {
  it("sets threadId", () => {
    const s = aiPanelReducer(initialAiPanelState, { type: "setThreadId", threadId: "t1" });
    expect(s.threadId).toBe("t1");
  });

  it("can clear threadId back to null", () => {
    const seeded = aiPanelReducer(initialAiPanelState, { type: "setThreadId", threadId: "t1" });
    const cleared = aiPanelReducer(seeded, { type: "setThreadId", threadId: null });
    expect(cleared.threadId).toBeNull();
  });
});

describe("aiPanelReducer — turn mode", () => {
  it("records the mode a turn was submitted in", () => {
    const state = aiPanelReducer(initialAiPanelState, {
      type: "addTurn",
      turn: { id: "t1", prompt: "invoice Acme", mode: "agent" },
    });
    expect(state.turns[0].mode).toBe("agent");
    expect(state.turns[0].modeHint).toBeNull();
  });

  it("stores a mode hint on a turn", () => {
    const added = aiPanelReducer(initialAiPanelState, {
      type: "addTurn",
      turn: { id: "t1", prompt: "invoice Acme", mode: "ask" },
    });
    const state = aiPanelReducer(added, {
      type: "updateTurn",
      id: "t1",
      patch: {
        modeHint: {
          type: "mode_hint",
          requiredMode: "agent",
          action: "Create an invoice for Acme",
        },
      },
    });
    expect(state.turns[0].modeHint?.action).toBe("Create an invoice for Acme");
  });
});

describe("aiPanelReducer — loadTurns", () => {
  it("replaces turns wholesale", () => {
    const seeded = aiPanelReducer(initialAiPanelState, {
      type: "addTurn",
      turn: { id: "t1", prompt: "hi", mode: "ask" },
    });
    const loaded = aiPanelReducer(seeded, {
      type: "loadTurns",
      turns: [
        {
          id: "seed-0",
          prompt: "hello",
          status: "done",
          mode: "ask",
          text: "hi there",
          route: null,
          draft: null,
          emailDraft: null,
          error: null,
          actions: [],
          pendingConfirm: null,
          modeHint: null,
          activeTool: null,
          steps: [],
        },
      ],
    });
    expect(loaded.turns).toHaveLength(1);
    expect(loaded.turns[0].id).toBe("seed-0");
  });
});
