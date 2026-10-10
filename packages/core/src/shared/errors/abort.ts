/**
 * Cooperative cancellation primitive for long-running core operations.
 *
 * A host that wants to interrupt work passes an `AbortSignal` (on {@link CoreContext.signal},
 * {@link TranslateOptions.signal}, or {@link GenerateRunOptions.signal}); core checks it at its
 * natural await boundaries — between provider attempts and around each translate-pool slot — and
 * unwinds by throwing {@link AbortError}.
 *
 * This is deliberately **not** an `I18nPruneError`: an abort is host-driven control flow, not a
 * domain failure. Hosts must be able to tell it apart so they do not fold it into provider-fallback
 * or partial-write handling (e.g. `generate` discards the partial locale instead of writing it, and
 * `serve` returns a `SERVE_REQUEST_CANCELLED` error rather than a `run.failed` envelope).
 */

/** Thrown when a caller-supplied `AbortSignal` fires during a long-running core op. */
export class AbortError extends Error {
  override readonly name = 'AbortError';

  constructor(message = 'Operation aborted') {
    super(message);
  }
}

/** Build an {@link AbortError}, preferring the signal's own abort reason when it carries one. */
export function abortErrorFrom(signal: AbortSignal): AbortError {
  const reason: unknown = signal.reason;
  if (reason instanceof Error && reason.message !== '') return new AbortError(reason.message);
  if (typeof reason === 'string' && reason.trim() !== '') return new AbortError(reason);
  return new AbortError();
}

/** Throw {@link AbortError} when `signal` is already aborted; a cheap check for await boundaries. */
export function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw abortErrorFrom(signal);
}

/**
 * True when `e` is an abort raised by an aborted signal — either this package's {@link AbortError}
 * or any error named `AbortError` (e.g. a native `DOMException` surfaced through a provider).
 */
export function isAbortError(e: unknown): e is Error {
  return e instanceof AbortError || (e instanceof Error && e.name === 'AbortError');
}
