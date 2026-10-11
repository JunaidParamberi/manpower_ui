import { formatSSEEvent } from "@/lib/ai/parse-sse-chunk";

type MockSSEOptions = {
  tokens?: string[];
  route?: {
    agent: string;
    confidence: number;
    payload: {
      intent: string;
      summary: string;
      entities?: Record<string, string>;
    };
  };
  error?: string;
  delayMs?: number;
  httpStatus?: number;
  /** Attached to the terminal `done` event, as the communication-drafter does. */
  emailDraft?: {
    mode: "follow_up" | "reply";
    tone: "friendly" | "firm" | "formal";
    subject: string | null;
    body: string;
    targetSummary: string;
  };
  /** Attached to the terminal `done` event, as the relationship-manager does. */
  relationshipRead?: {
    headline: string;
    assessment: string;
    plays: { title: string; rationale: string }[];
  };
};

/**
 * Storybook helper: mock fetch for POST /api/ai/stream SSE responses.
 */
export function mockAIStreamFetch(options: MockSSEOptions = {}): () => void {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    if (!url.includes("/api/ai/stream") || init?.method !== "POST") {
      return originalFetch(input, init);
    }

    if (options.httpStatus && options.httpStatus >= 400) {
      return new Response(
        JSON.stringify({ error: options.error ?? "Unauthorized" }),
        {
          status: options.httpStatus,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (options.error) {
      const stream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(
            encoder.encode(formatSSEEvent("error", { message: options.error! })),
          );
          controller.close();
        },
      });
      return new Response(stream, {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      });
    }

    const tokens = options.tokens ?? ["Routing to Document Writer…"];
    const delayMs = options.delayMs ?? 120;
    const route = options.route ?? {
      agent: "document-writer",
      confidence: 0.92,
      payload: {
        intent: "create_invoice",
        summary: "Draft an invoice for the website redesign project",
        entities: { document_type: "invoice" },
      },
    };

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for (const token of tokens) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          controller.enqueue(
            encoder.encode(formatSSEEvent("token", { text: token })),
          );
        }
        controller.enqueue(
          encoder.encode(
            formatSSEEvent("route", {
              agent: route.agent,
              confidence: route.confidence,
              payload: route.payload,
            }),
          ),
        );
        controller.enqueue(
          encoder.encode(
            formatSSEEvent("done", {
              finishReason: "stop",
              ...(options.emailDraft ? { emailDraft: options.emailDraft } : {}),
              ...(options.relationshipRead
                ? { relationshipRead: options.relationshipRead }
                : {}),
            }),
          ),
        );
        controller.close();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    });
  };

  return () => {
    globalThis.fetch = originalFetch;
  };
}
