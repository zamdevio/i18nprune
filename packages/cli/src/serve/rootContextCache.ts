import type { Context } from '@/types/core/context/index.js';
import type { CliGlobalOverrides } from '@/types/core/context/index.js';
import { resolveContextForProjectRoot } from '@/shared/context/contextForRoot.js';
import { SERVE_DEFAULT_ROOT_CACHE_MAX, SERVE_ROOT_CACHE_TTL_MS } from '@/constants/serve.js';

type Entry = { readonly context: Promise<Context>; seq: number; lastUsedMs: number };

export type RootContextCacheHost = {
  readonly run: Context['run'];
  readonly cliOverrides: CliGlobalOverrides;
};

/** Resolver seam (injectable for deterministic tests); defaults to the real root resolver. */
export type RootContextResolver = (root: string, host: RootContextCacheHost) => Promise<Context>;

/**
 * In-memory `Context` (incl. `localeRead`) cache keyed by normalized absolute project root.
 *
 * The disk cache is already safe by construction — `computeCacheProjectId()` hashes the absolute
 * root — but `CoreContext`/`localeRead` are in-memory and must not be shared across roots. Bounded
 * LRU + TTL so a long-lived hub does not grow without limit; {@link invalidate} drops a root after a
 * write to it (slice S.4) or when its config file changes on disk.
 */
export class RootContextCache {
  private readonly entries = new Map<string, Entry>();
  /** Monotonic access counter — LRU order without relying on (equal-valued) wall-clock timestamps. */
  private accessSeq = 0;

  constructor(
    private readonly host: RootContextCacheHost,
    private readonly max = SERVE_DEFAULT_ROOT_CACHE_MAX,
    private readonly ttlMs = SERVE_ROOT_CACHE_TTL_MS,
    private readonly resolve: RootContextResolver = resolveContextForProjectRoot,
  ) {}

  /** Warm context for `root`, resolving (and caching) it on first use. */
  get(root: string): Promise<Context> {
    this.evictStale();
    const existing = this.entries.get(root);
    if (existing) {
      existing.seq = ++this.accessSeq;
      existing.lastUsedMs = Date.now();
      return existing.context;
    }
    const context = this.resolve(root, this.host);
    // Do not retain a rejected resolution: a transient failure must be retryable.
    context.catch(() => this.entries.delete(root));
    this.entries.set(root, { context, seq: ++this.accessSeq, lastUsedMs: Date.now() });
    this.trim();
    return context;
  }

  /** Drop a root's cached context (after a write, or a config change on disk). */
  invalidate(root: string): void {
    this.entries.delete(root);
  }

  /** Drop everything (shutdown). */
  clear(): void {
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }

  private trim(): void {
    while (this.entries.size > this.max) {
      let oldestKey: string | null = null;
      let oldestSeq = Infinity;
      for (const [key, entry] of this.entries) {
        if (entry.seq < oldestSeq) {
          oldestSeq = entry.seq;
          oldestKey = key;
        }
      }
      if (oldestKey === null) break;
      this.entries.delete(oldestKey);
    }
  }

  private evictStale(): void {
    const cutoff = Date.now() - this.ttlMs;
    for (const [key, entry] of this.entries) {
      if (entry.lastUsedMs < cutoff) this.entries.delete(key);
    }
  }
}
