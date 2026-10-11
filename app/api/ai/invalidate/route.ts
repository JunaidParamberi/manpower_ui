import { NextResponse } from "next/server";

import { getServerContext } from "@/lib/supabase/get-server-context";
import { invalidateAfterAiAction } from "@/lib/assistant/invalidate-after-action";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { user } = await getServerContext();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    !Array.isArray((body as { actions?: unknown }).actions)
  ) {
    return NextResponse.json({ error: "Missing actions array" }, { status: 400 });
  }

  const actions = (body as { actions: Array<{ entity: unknown; entityId: unknown }> }).actions
    .filter(
      (a): a is { entity: string; entityId: string | null } =>
        typeof a.entity === "string" &&
        (typeof a.entityId === "string" || a.entityId === null),
    );

  const result = await invalidateAfterAiAction({ actions });
  return NextResponse.json({ ok: true, ...result });
}
