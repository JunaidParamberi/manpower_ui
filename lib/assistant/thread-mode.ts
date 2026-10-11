/**
 * `ai_threads.mode` is a text column with a check constraint, so the driver
 * types it as `string | null`. Anything that is not exactly "agent" — a null,
 * a legacy value, a row written by an older deploy — reads as the safe
 * read-only mode.
 *
 * Lives outside thread-queries.ts because that module is "use server", where
 * every export must be an async server action. This is a synchronous pure
 * function and the production build rejects it there.
 */
export function normalizeThreadMode(value: string | null): "ask" | "agent" {
  return value === "agent" ? "agent" : "ask";
}
