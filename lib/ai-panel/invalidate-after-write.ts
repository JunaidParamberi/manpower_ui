/**
 * Asks the server to bust the cache tags a Kraft write touched, so the page
 * behind the panel shows the change after `router.refresh()`.
 */
export async function invalidateAfterWrite(
  actions: Array<{ entity: string; entityId: string | null }>,
): Promise<void> {
  try {
    await fetch("/api/ai/invalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actions }),
    });
  } catch {
    // non-fatal — user can refresh manually
  }
}
