/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Demo stand-in for the assistant's stream endpoint.
 *
 * Same contract as the original (POST JSON in, SSE out with `thread_created`,
 * `route`, `token`… `done` events), but the "model" is local: turns are
 * composed by `buildMockTurn`, and the conversation is stored in
 * `mock-db.json` so the panel's history survives reloads like every other
 * screen. No external service, no keys.
 */
import { buildMockTurn, chunkReply, mockAgentFor } from "@/lib/ai/mock-turn";
import { getAgentLabel } from "@/lib/ai/agents";
import { createThread } from "@/lib/assistant/thread-store";
import { createClient } from "@/lib/supabase/server";
import { parseAIStreamRequest } from "@/lib/validations/ai-stream";

export const runtime = "nodejs";

const FRAME_DELAY_MS = 18;

function frame(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = parseAIStreamRequest(body);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }
  const input = parsed.data;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user?.id) {
    return Response.json({ error: "Not signed in." }, { status: 401 });
  }

  const isAssistantTurn = !input.agent;
  const mode = input.assistantMode === "agent" ? "agent" : "ask";

  // ── Thread ─────────────────────────────────────────────────────────────
  let threadId: string | null = input.threadId ?? null;
  let createdThread: { id: string; title: string } | null = null;

  if (isAssistantTurn) {
    if (threadId) {
      const { data: threadRow } = await supabase
        .from("ai_threads")
        .select("id")
        .eq("id", threadId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!threadRow) threadId = null;
    }
    if (!threadId) {
      const title =
        (input.prompt ?? "").trim().slice(0, 60) || "New conversation";
      const created = await createThread(supabase, {
        userId: user.id,
        mode,
        title,
      });
      if (!created) {
        return Response.json(
          { error: "Could not start a conversation." },
          { status: 500 },
        );
      }
      threadId = created;
      createdThread = { id: created, title };
    }
  }

  // ── Facts the turn can lean on ─────────────────────────────────────────
  const clientId =
    input.clientId ??
    (typeof input.input?.clientId === "string" ? input.input.clientId : null);

  let clientName: string | null = null;
  let clientHealth: number | null = null;
  let clientStatus: string | null = null;

  if (clientId) {
    const { data: client } = await supabase
      .from("clients")
      .select("name, health_score, relationship_status")
      .eq("id", clientId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (client) {
      clientName = client.name ?? null;
      clientHealth = client.health_score ?? null;
      clientStatus = client.relationship_status ?? null;
    }
  }

  const turn = buildMockTurn(input, { clientName, clientHealth, clientStatus });
  const promptText =
    (input.prompt ?? "").trim() ||
    `${getAgentLabel(mockAgentFor(input))} request`;

  // ── Persist the turn (before streaming, so an abort still leaves the ask) ──
  if (isAssistantTurn && threadId) {
    const { data: lastRow } = await supabase
      .from("ai_messages")
      .select("seq")
      .eq("thread_id", threadId)
      .eq("user_id", user.id)
      .order("seq", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextSeq = Number(lastRow?.seq ?? 0) + 1;
    const { error: insertError } = await supabase.from("ai_messages").insert([
      {
        thread_id: threadId,
        user_id: user.id,
        role: "user",
        content: promptText,
        tool_calls: null,
        seq: nextSeq,
      },
      {
        thread_id: threadId,
        user_id: user.id,
        role: "assistant",
        content: turn.text,
        tool_calls: null,
        seq: nextSeq + 1,
      },
    ]);

    if (insertError) {
      console.warn("[mock-ai-stream] could not persist turn:", insertError.message);
    }

    await supabase
      .from("ai_threads")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", threadId)
      .eq("user_id", user.id);
  }

  // ── Frames ─────────────────────────────────────────────────────────────
  const agent = mockAgentFor(input);
  const frames: string[] = [];

  if (createdThread) frames.push(frame("thread_created", createdThread));

  frames.push(
    frame("route", {
      agent,
      confidence: 0.92,
      payload: {
        intent: input.agent ? input.agent : "assistant_turn",
        summary: promptText.slice(0, 160),
      },
    }),
  );

  // Agent mode: a visible "looking things up" step so the trail UI has work.
  if (isAssistantTurn && mode === "agent") {
    frames.push(
      frame("tool_start", {
        tool: "query_data",
        entity: "workspace",
        label: "Looking up your workspace…",
      }),
    );
    frames.push(
      frame("tool_done", {
        tool: "query_data",
        entity: "workspace",
        summary: "Read dashboard, clients and projects",
      }),
    );
  }

  for (const chunk of chunkReply(turn.text)) {
    frames.push(frame("token", { text: chunk }));
  }
  frames.push(frame("done", { finishReason: "stop", ...turn.done }));

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (const item of frames) {
          controller.enqueue(encoder.encode(item));
          await sleep(FRAME_DELAY_MS);
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
