export type SaveStatus = "idle" | "saving" | "saved" | "error";
export type SaveResult = { ok: true } | { ok: false; error: string };
type Job = () => Promise<SaveResult>;

export const AUTOSAVE_DELAY_MS = 600;

export type AutosaveQueue = {
  schedule(key: string, run: Job, opts?: { immediate?: boolean }): void;
  flush(): Promise<boolean>;
  retry(): Promise<boolean>;
  getStatus(): SaveStatus;
  getError(): string | null;
  hasPending(): boolean;
  hasWritten(): boolean;
  subscribe(fn: () => void): () => void;
  dispose(): void;
};

/**
 * Keyed, debounced write queue. Same key: last write wins. Different keys run
 * in insertion order, one at a time, so line-item writes stay ordered. A failed
 * job stays queued so `retry()` re-runs it.
 */
export function createAutosaveQueue(opts: {
  delayMs?: number;
  setTimer?: typeof setTimeout;
  clearTimer?: typeof clearTimeout;
} = {}): AutosaveQueue {
  const delay = opts.delayMs ?? AUTOSAVE_DELAY_MS;
  const setTimer = opts.setTimer ?? setTimeout;
  const clearTimer = opts.clearTimer ?? clearTimeout;

  const pending = new Map<string, Job>();
  const listeners = new Set<() => void>();
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running: Promise<boolean> | null = null;
  let status: SaveStatus = "idle";
  let error: string | null = null;
  let written = false;

  const emit = () => listeners.forEach((fn) => fn());
  const setStatus = (s: SaveStatus, e: string | null = null) => {
    status = s;
    error = e;
    emit();
  };

  async function runAll(): Promise<boolean> {
    setStatus("saving");
    let failure: string | null = null;
    for (const [key, job] of pending) {
      let result: SaveResult;
      try {
        result = await job();
      } catch (e) {
        result = { ok: false, error: e instanceof Error ? e.message : "Couldn't save" };
      }
      if (!result.ok) {
        // A rejected write stays queued for Retry; the others still go out.
        failure ??= result.error;
        continue;
      }
      // Keep the entry if the key was rewritten while this job ran.
      if (pending.get(key) === job) pending.delete(key);
    }
    if (failure !== null) {
      setStatus("error", failure);
      return false;
    }
    setStatus("saved");
    return true;
  }

  async function drain(): Promise<boolean> {
    if (running) {
      const settled = await running;
      return settled && pending.size > 0 ? drain() : settled;
    }
    if (pending.size === 0) return status !== "error";
    running = runAll();
    const outcome = await running;
    running = null;
    return outcome && pending.size > 0 ? drain() : outcome;
  }

  function arm(ms: number) {
    if (timer) clearTimer(timer);
    timer = setTimer(() => {
      timer = null;
      void drain();
    }, ms);
  }

  return {
    schedule(key, run, o) {
      written = true;
      pending.delete(key); // move to the end
      pending.set(key, run);
      arm(o?.immediate ? 0 : delay);
    },
    flush() {
      if (timer) {
        clearTimer(timer);
        timer = null;
      }
      return drain();
    },
    retry() {
      return drain();
    },
    getStatus: () => status,
    getError: () => error,
    hasPending: () => pending.size > 0 || running !== null,
    hasWritten: () => written,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    dispose() {
      // Leaving the page must not drop what was typed: send it now.
      if (timer) {
        clearTimer(timer);
        timer = null;
        void drain();
      }
      listeners.clear();
    },
  };
}
