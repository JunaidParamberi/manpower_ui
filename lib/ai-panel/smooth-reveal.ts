/**
 * Pacing for Kraft's streamed text. Network chunks arrive in uneven bursts;
 * painting them as they land makes the answer jump. Instead the UI keeps a
 * "shown" length and moves it toward the received text a little each frame:
 * a steady floor rate, sped up so any backlog drains within a fixed time,
 * and always stopping on a word boundary so a word never appears half-typed.
 */

/** Slowest reveal, in characters per second (a calm reading pace). */
export const MIN_CHARS_PER_SECOND = 55;
/** While streaming, any backlog is caught up within this many seconds. */
export const STREAM_CATCH_UP_SECONDS = 0.9;
/** Once the stream has finished, the rest is drained this fast. */
export const DONE_CATCH_UP_SECONDS = 0.35;

export function revealRate(backlog: number, streaming: boolean): number {
  const catchUp = streaming ? STREAM_CATCH_UP_SECONDS : DONE_CATCH_UP_SECONDS;
  return Math.max(MIN_CHARS_PER_SECOND, backlog / catchUp);
}

/**
 * The next shown length after `elapsedMs`. Never goes backwards, never
 * passes `text.length`, and lands on the end of a word, unless the word is
 * still arriving and the stream is live, in which case it waits.
 */
export function nextRevealLength(
  text: string,
  shown: number,
  elapsedMs: number,
  streaming: boolean,
): number {
  const target = text.length;
  if (shown >= target) {
    return target;
  }
  const step = Math.max(1, Math.round((revealRate(target - shown, streaming) * elapsedMs) / 1000));
  const raw = Math.min(target, shown + step);
  if (raw >= target) {
    // The last word may still be arriving; hold it back until it's complete.
    return streaming ? Math.max(shown, lastWordStart(text)) : target;
  }
  return Math.max(shown, wordEnd(text, raw));
}

function isSpace(char: string | undefined): boolean {
  return char === " " || char === "\n" || char === "\t";
}

/** Extends `index` to the end of the word it lands in (and its trailing space). */
function wordEnd(text: string, index: number): number {
  let i = index;
  while (i < text.length && !isSpace(text[i])) {
    i += 1;
  }
  while (i < text.length && isSpace(text[i])) {
    i += 1;
  }
  return i;
}

/** Where the final, possibly incomplete word starts. */
function lastWordStart(text: string): number {
  let i = text.length;
  if (isSpace(text[i - 1])) {
    return i;
  }
  while (i > 0 && !isSpace(text[i - 1])) {
    i -= 1;
  }
  return i;
}
