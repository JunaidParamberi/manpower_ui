import { describe, expect, it } from "vitest";

import {
  deriveMascotEmotion,
  hasPendingTimer,
  isBusyEmotion,
  mascotStatusLine,
  pillStateFor,
  type MascotStateInput,
} from "./mascot-state";
import type { AiTurn } from "./types";

function turn(patch: Partial<AiTurn> = {}): AiTurn {
  return {
    id: "t1",
    prompt: "Who's overdue?",
    status: "streaming",
    mode: "ask",
    text: "",
    route: null,
    draft: null,
    emailDraft: null,
    error: null,
    actions: [],
    pendingConfirm: null,
    modeHint: null,
    activeTool: null,
    steps: [],
    ...patch,
  };
}

function input(patch: Partial<MascotStateInput> = {}): MascotStateInput {
  return {
    latestTurn: null,
    composerHasText: false,
    drawerOpen: false,
    msSinceTurnDone: null,
    msSinceLastActivity: 0,
    msSinceDrawerOpened: null,
    msSinceStepResolved: null,
    msSinceWoke: null,
    ...patch,
  };
}

const confirm = { type: "confirm" as const, summary: "Delete client", threadId: "th", toolUseId: "tu", detail: [] };

describe("deriveMascotEmotion", () => {
  it("is idle with nothing going on", () => {
    expect(deriveMascotEmotion(input())).toBe("idle");
  });

  it("puts a pending confirm above everything", () => {
    expect(
      deriveMascotEmotion(
        input({ latestTurn: turn({ status: "done", pendingConfirm: confirm }), msSinceTurnDone: 10 }),
      ),
    ).toBe("confirm");
  });

  it("shows an error turn", () => {
    expect(deriveMascotEmotion(input({ latestTurn: turn({ status: "error" }) }))).toBe("error");
  });

  it("is surprised just after a step resolves mid-stream", () => {
    expect(
      deriveMascotEmotion(input({ latestTurn: turn({ activeTool: "Looking up invoices…" }), msSinceStepResolved: 300 })),
    ).toBe("surprised");
    expect(deriveMascotEmotion(input({ latestTurn: turn(), msSinceStepResolved: 900 }))).toBe("thinking");
  });

  it("works while a tool runs and thinks otherwise", () => {
    expect(deriveMascotEmotion(input({ latestTurn: turn({ activeTool: "Looking up invoices…" }) }))).toBe("working");
    expect(deriveMascotEmotion(input({ latestTurn: turn() }))).toBe("thinking");
  });

  it("celebrates, then glows, then settles after a turn finishes", () => {
    const done = turn({ status: "done" });
    expect(deriveMascotEmotion(input({ latestTurn: done, msSinceTurnDone: 100 }))).toBe("success");
    expect(deriveMascotEmotion(input({ latestTurn: done, msSinceTurnDone: 3000 }))).toBe("proud");
    expect(deriveMascotEmotion(input({ latestTurn: done, msSinceTurnDone: 5000 }))).toBe("idle");
  });

  it("greets right after the drawer opens", () => {
    expect(deriveMascotEmotion(input({ drawerOpen: true, msSinceDrawerOpened: 200 }))).toBe("greet");
    expect(deriveMascotEmotion(input({ drawerOpen: true, msSinceDrawerOpened: 1500 }))).toBe("idle");
  });

  it("listens while the composer has text", () => {
    expect(deriveMascotEmotion(input({ composerHasText: true }))).toBe("listening");
  });

  it("dozes off after 20s without activity", () => {
    expect(deriveMascotEmotion(input({ msSinceLastActivity: 20_001 }))).toBe("sleepy");
    expect(deriveMascotEmotion(input({ msSinceLastActivity: 19_000 }))).toBe("idle");
  });

  it("flashes surprised when woken, then returns to idle", () => {
    expect(deriveMascotEmotion(input({ msSinceWoke: 100 }))).toBe("surprised");
    expect(deriveMascotEmotion(input({ msSinceWoke: 700 }))).toBe("idle");
  });

  it("ranks a finished turn above the greet", () => {
    expect(
      deriveMascotEmotion(
        input({ latestTurn: turn({ status: "done" }), msSinceTurnDone: 100, drawerOpen: true, msSinceDrawerOpened: 100 }),
      ),
    ).toBe("success");
  });
});

describe("hasPendingTimer", () => {
  it("is true while a time-boxed branch could still change", () => {
    expect(hasPendingTimer(input({ latestTurn: turn({ status: "done" }), msSinceTurnDone: 1000 }))).toBe(true);
    expect(hasPendingTimer(input({ msSinceLastActivity: 1000 }))).toBe(true);
  });

  it("is false once Kraft is asleep with nothing else pending", () => {
    expect(hasPendingTimer(input({ msSinceLastActivity: 30_000 }))).toBe(false);
  });
});

describe("mascotStatusLine", () => {
  it("uses the server's tool label while working", () => {
    expect(mascotStatusLine("working", "Searching invoices…")).toBe("Searching invoices…");
    expect(mascotStatusLine("working", null)).toBe("Working…");
    expect(mascotStatusLine("working", "  ")).toBe("Working…");
  });

  it("uses the fixed copy for every other emotion", () => {
    expect(mascotStatusLine("idle", "ignored")).toBe("Kraft");
    expect(mascotStatusLine("confirm", null)).toBe("Need your OK");
    expect(mascotStatusLine("error", null)).toBe("That didn't work, tap to see");
    expect(mascotStatusLine("sleepy", null)).toBe("Zzz…");
  });
});

describe("pillStateFor", () => {
  it("maps emotions to the five pill states", () => {
    expect(pillStateFor("greet", false)).toBe("idle");
    expect(pillStateFor("working", true)).toBe("busy");
    expect(pillStateFor("confirm", false)).toBe("confirm");
    expect(pillStateFor("proud", false)).toBe("done");
    expect(pillStateFor("error", false)).toBe("error");
  });

  it("keeps a wake-up surprise idle when nothing is running", () => {
    expect(pillStateFor("surprised", false)).toBe("idle");
    expect(pillStateFor("surprised", true)).toBe("busy");
  });
});

describe("isBusyEmotion", () => {
  it("is true only while working on a turn", () => {
    expect(isBusyEmotion("thinking")).toBe(true);
    expect(isBusyEmotion("success")).toBe(false);
  });
});
