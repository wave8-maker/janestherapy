/**
 * Vercel Blob calls carry no timeout of their own: a stale keep-alive socket
 * after the function was idle leaves a request waiting until the platform kills
 * the whole invocation. Bound each attempt and retry reads, which are safe to repeat.
 */
const READ_TIMEOUT_MS = 8_000;
const WRITE_TIMEOUT_MS = 15_000;

/** `op` must do all its network work, including reading the body, before resolving. */
export async function blobRead<T>(
  op: (signal: AbortSignal) => Promise<T>,
  attempts = 3,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await op(AbortSignal.timeout(READ_TIMEOUT_MS));
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

/** Writes are not retried: a timed-out write may still have landed. */
export function blobWrite<T>(
  op: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  return op(AbortSignal.timeout(WRITE_TIMEOUT_MS));
}
