import os from 'node:os';
import path from 'node:path';

/**
 * The two startup shapes, mutually exclusive — see
 * [ADR 012 §Project root modes](../../../../docs/architecture/decisions/012-cli-serve-transport.md#project-root-modes).
 *
 * - `sandbox` — pinned to one project root; a request naming a different root is refused.
 * - `hub` — no pin; every op request must name an absolute `projectRoot`.
 */
export type ServeRootMode = 'sandbox' | 'hub';

export type ServeRootConfig =
  | { readonly mode: 'sandbox'; readonly root: string }
  | { readonly mode: 'hub' };

export type RequestRootResolution =
  | { readonly ok: true; readonly root: string }
  | { readonly ok: false; readonly reason: 'required' | 'relative' | 'confined' };

/**
 * Resolve which project root an op request runs against, enforcing the session's mode.
 *
 * Sandbox: the session root wins; a different requested root is **confined** (rejected), never a
 * silent switch — that confinement is the security guarantee for `ssh <host> i18nprune serve
 * --project <path>`.
 *
 * Hub: the requested root is required and must be absolute.
 */
export function resolveRequestRoot(cfg: ServeRootConfig, requested?: string): RequestRootResolution {
  if (cfg.mode === 'sandbox') {
    if (requested === undefined || requested === '') return { ok: true, root: cfg.root };
    if (!path.isAbsolute(requested)) return { ok: false, reason: 'relative' };
    if (path.resolve(requested) !== cfg.root) return { ok: false, reason: 'confined' };
    return { ok: true, root: cfg.root };
  }
  if (requested === undefined || requested === '') return { ok: false, reason: 'required' };
  if (!path.isAbsolute(requested)) return { ok: false, reason: 'relative' };
  return { ok: true, root: path.resolve(requested) };
}

/** Canonical absolute form of a user-supplied project root (tilde expanded, then resolved). */
export function normalizeServeRoot(input: string): string {
  const expanded =
    input === '~'
      ? os.homedir()
      : input.startsWith('~/')
        ? path.join(os.homedir(), input.slice(2))
        : input;
  return path.resolve(expanded);
}
