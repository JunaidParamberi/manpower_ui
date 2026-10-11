/** Storybook stand-in for `@/lib/mcp/connection-actions` (server actions). */
export async function revokeMcpConnection(): Promise<{ ok: true }> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return { ok: true };
}

export async function approveMcpAuthorization(): Promise<void> {}

export async function denyMcpAuthorization(): Promise<void> {}
