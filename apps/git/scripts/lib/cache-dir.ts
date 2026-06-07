import path from 'node:path';
import { GIT_APP_ROOT } from './paths.js';

/**
 * Script-only cache (gitignored). SPA reads `src/data/*.json` exports — never this dir.
 *
 * | File | Role |
 * |------|------|
 * | `sync-state.json` | Git fingerprint fast-path (Phase C) |
 * | `github-profiles.json` | Login-keyed GitHub API cache with TTL (Phase D) |
 */
export const CACHE_DIR = path.join(GIT_APP_ROOT, '.cache');

export const SYNC_STATE_FILE = 'sync-state.json';
export const GITHUB_PROFILES_FILE = 'github-profiles.json';
