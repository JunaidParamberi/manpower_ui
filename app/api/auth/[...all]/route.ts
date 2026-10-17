import { toNextJsHandler } from "better-auth/next-js";

import { getAuthDb } from "@/db";
import { createAuth } from "@/lib/auth";

const handler = async (request: Request) => {
  const auth = createAuth(await getAuthDb());
  const handlers = toNextJsHandler(auth);
  if (request.method === "POST") return handlers.POST(request);
  return handlers.GET(request);
};

export const GET = handler;
export const POST = handler;
