/**
 * Translation **`tickProgress`** contract for **`generate`** (orchestration → host UI).
 * Hosts map ticks to TTY / JSON / quiet; core stays I/O-free.
 */

/**
 * How **`tickProgress`** should interpret the numeric index for strict vs parallel phases.
 */
export type TranslationProgressPhase = 'strict' | 'parallel_pool';

/**
 * Honest snapshot while a bounded **`translateLeaf`** pool runs (worker slots are stable 0..N-1).
 */
export type TranslationPoolProgressSnapshot = {
  /** Finished **`translateLeaf`** jobs in this pool (monotonic). */
  readonly completed: number;
  /** Total **`translateLeaf`** jobs in this pool. */
  readonly total: number;
  /** In-flight jobs: path per worker slot (slot order). */
  readonly activeBySlot: readonly { readonly slot: number; readonly path: string }[];
};

export type TranslationTickProgressOptions = {
  readonly phase?: TranslationProgressPhase;
  /** Present during **`parallel_pool`** when the host should show pool-accurate bar / keys. */
  readonly pool?: TranslationPoolProgressSnapshot;
};

export type TranslationTickProgressFn = (
  index: number,
  total: number,
  path: string,
  options?: TranslationTickProgressOptions,
) => void;
