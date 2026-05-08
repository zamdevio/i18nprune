import type { RuntimeFsPort } from './fs.js';
import type { RuntimeNetworkPort } from './network.js';
import type { RuntimePathPort } from './path.js';
import type { RuntimeSystemPort } from './system.js';

/** Filesystem port only. */
export type RuntimeFsCap = { fs: RuntimeFsPort };

/** Path port only. */
export type RuntimePathCap = { path: RuntimePathPort };

/** Clock / cwd (no filesystem). */
export type RuntimeSystemCap = { system: RuntimeSystemPort };

/** HTTP client (`fetch`) — not part of {@link CoreEngineRuntime}; use for translate / remote APIs. */
export type RuntimeNetworkCap = { network: RuntimeNetworkPort };

/**
 * Filesystem + path: scanning, locale file listing, meta resolution.
 * Does not include `system` or `network`.
 */
export type ProjectFilesystemRuntime = RuntimeFsCap & RuntimePathCap;

/**
 * Path + system only (no `fs`): resolve relative config paths against `cwd()` without reading files through the port.
 */
export type ConfigPathSystemRuntime = RuntimePathCap & RuntimeSystemCap;

/**
 * Default “project I/O” bundle: `fs`, `path`, and `system` (`cwd` / `now`).
 * Prefer {@link ProjectFilesystemRuntime} on APIs that never touch `system`.
 */
export type CoreEngineRuntime = RuntimeFsCap & RuntimePathCap & RuntimeSystemCap;
