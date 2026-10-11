import { describe, expect, it } from "vitest";

import {
  AI_STREAM_PROMPT_MAX,
  aiStreamRequestSchema,
  parseAIStreamRequest,
} from "./ai-stream";

describe("aiStreamRequestSchema", () => {
  it("accepts a trimmed prompt", () => {
    expect(aiStreamRequestSchema.safeParse({ prompt: "  hello  " }).success).toBe(
      true,
    );
    expect(aiStreamRequestSchema.parse({ prompt: "  hello  " }).prompt).toBe(
      "hello",
    );
  });

  it("accepts optional agent", () => {
    expect(
      aiStreamRequestSchema.safeParse({
        prompt: "draft invoice",
        agent: "document-writer",
      }).success,
    ).toBe(true);
  });

  it("rejects empty prompt", () => {
    expect(aiStreamRequestSchema.safeParse({ prompt: "   " }).success).toBe(
      false,
    );
  });

  it("rejects prompt longer than max", () => {
    expect(
      aiStreamRequestSchema.safeParse({
        prompt: "a".repeat(AI_STREAM_PROMPT_MAX + 1),
      }).success,
    ).toBe(false);
  });

  it("rejects missing prompt", () => {
    expect(aiStreamRequestSchema.safeParse({}).success).toBe(false);
  });

  it("accepts a communication-drafter follow-up with no prompt", () => {
    expect(
      aiStreamRequestSchema.safeParse({
        agent: "communication-drafter",
        mode: "follow_up",
        documentId: "550e8400-e29b-41d4-a716-446655440000",
      }).success,
    ).toBe(true);
  });

  it("still requires a prompt for non-drafter agents", () => {
    expect(
      aiStreamRequestSchema.safeParse({ agent: "document-writer" }).success,
    ).toBe(false);
  });

  it("accepts a content-marketer request with input and no prompt", () => {
    expect(
      aiStreamRequestSchema.safeParse({
        agent: "content-marketer",
        input: {
          mode: "draft-single",
          platform: "instagram",
          topic: "product launch",
          clientId: null,
          tone: null,
        },
      }).success,
    ).toBe(true);
  });

  it("preserves the input object through parse (not stripped)", () => {
    const parsed = aiStreamRequestSchema.parse({
      agent: "content-marketer",
      input: { mode: "draft-single", platform: "linkedin" },
    });
    expect(parsed.input).toEqual({ mode: "draft-single", platform: "linkedin" });
  });

  it("preserves drafter fields through parse (not stripped)", () => {
    const parsed = aiStreamRequestSchema.parse({
      agent: "communication-drafter",
      mode: "reply",
      tone: "friendly",
      incomingMessage: "hello",
    });
    expect(parsed.mode).toBe("reply");
    expect(parsed.tone).toBe("friendly");
    expect(parsed.incomingMessage).toBe("hello");
  });
});

describe("parseAIStreamRequest", () => {
  it("returns parsed data on success", () => {
    const result = parseAIStreamRequest({ prompt: "test" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.prompt).toBe("test");
    }
  });

  it("returns error message on failure", () => {
    const result = parseAIStreamRequest({ prompt: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.length).toBeGreaterThan(0);
    }
  });
});

describe("projectId", () => {
  const UUID = "11111111-1111-4111-8111-111111111111";

  it("accepts a uuid projectId", () => {
    const result = parseAIStreamRequest({
      agent: "communication-drafter",
      mode: "follow_up",
      projectId: UUID,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.projectId).toBe(UUID);
    }
  });

  it("rejects a non-uuid projectId", () => {
    const result = parseAIStreamRequest({
      agent: "communication-drafter",
      projectId: "nope",
    });
    expect(result.ok).toBe(false);
  });

  it("stays optional", () => {
    const result = parseAIStreamRequest({ prompt: "hello" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.projectId).toBeUndefined();
    }
  });
});

describe("parseAIStreamRequest — assistant fields", () => {
  it("accepts an assistant request with no agent", () => {
    const result = parseAIStreamRequest({ prompt: "hi", assistantMode: "ask" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.assistantMode).toBe("ask");
      expect(result.data.agent).toBeUndefined();
    }
  });

  it("accepts agent mode", () => {
    const result = parseAIStreamRequest({ prompt: "invoice Cedar 4500", assistantMode: "agent" });
    expect(result.ok).toBe(true);
  });

  it("rejects an unknown assistant mode", () => {
    const result = parseAIStreamRequest({ prompt: "hi", assistantMode: "godmode" });
    expect(result.ok).toBe(false);
  });

  it("accepts a pagePath", () => {
    const result = parseAIStreamRequest({ prompt: "hi", pagePath: "/clients" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.pagePath).toBe("/clients");
    }
  });

  it("accepts a threadId uuid", () => {
    const result = parseAIStreamRequest({
      prompt: "hi",
      threadId: "3f0d5f7a-1b2c-4d5e-8f90-1a2b3c4d5e6f",
    });
    expect(result.ok).toBe(true);
  });

  it("rejects a non-uuid threadId", () => {
    const result = parseAIStreamRequest({ prompt: "hi", threadId: "abc" });
    expect(result.ok).toBe(false);
  });
});
