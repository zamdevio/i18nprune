import fs from 'node:fs';
import path from 'node:path';
import type { GitHubUserProfile } from './api.js';
import { CACHE_DIR, GITHUB_PROFILES_FILE } from '../cache-dir.js';

/** Refresh enriched profiles after this age; stale enriched data is kept when the API is down. */
export const GITHUB_PROFILE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type GitHubProfileCacheStatus = 'enriched' | 'not_found';

export type GitHubProfileCacheEntry = {
  login: string;
  status: GitHubProfileCacheStatus;
  fetchedAt: string;
  profile: GitHubUserProfile | null;
};

export type GitHubProfileCacheFile = {
  version: 1;
  entries: Record<string, GitHubProfileCacheEntry>;
};

function cachePath(): string {
  return path.join(CACHE_DIR, GITHUB_PROFILES_FILE);
}

function normalizeLogin(login: string): string {
  return login.trim().toLowerCase();
}

function isExpired(fetchedAt: string, now = Date.now()): boolean {
  const t = Date.parse(fetchedAt);
  if (!Number.isFinite(t)) return true;
  return now - t > GITHUB_PROFILE_TTL_MS;
}

export class GitHubProfileCache {
  private entries: Record<string, GitHubProfileCacheEntry>;

  private constructor(entries: Record<string, GitHubProfileCacheEntry>) {
    this.entries = entries;
  }

  static empty(): GitHubProfileCache {
    return new GitHubProfileCache({});
  }

  static load(): GitHubProfileCache {
    const filePath = cachePath();
    if (!fs.existsSync(filePath)) {
      return new GitHubProfileCache({});
    }
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as GitHubProfileCacheFile;
      if (parsed.version !== 1 || typeof parsed.entries !== 'object' || parsed.entries === null) {
        return new GitHubProfileCache({});
      }
      return new GitHubProfileCache(parsed.entries);
    } catch {
      return new GitHubProfileCache({});
    }
  }

  static clearFile(): void {
    const filePath = cachePath();
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  get(login: string): GitHubProfileCacheEntry | undefined {
    return this.entries[normalizeLogin(login)];
  }

  /** Fresh enriched cache hit (within TTL, unless `forceRefresh`). */
  getFreshEnriched(login: string, forceRefresh: boolean): GitHubProfileCacheEntry | undefined {
    const entry = this.get(login);
    if (!entry || entry.status !== 'enriched' || !entry.profile) return undefined;
    if (forceRefresh || isExpired(entry.fetchedAt)) return undefined;
    return entry;
  }

  /** Fresh not-found cache hit (within TTL). */
  getFreshNotFound(login: string, forceRefresh: boolean): GitHubProfileCacheEntry | undefined {
    const entry = this.get(login);
    if (!entry || entry.status !== 'not_found') return undefined;
    if (forceRefresh || isExpired(entry.fetchedAt)) return undefined;
    return entry;
  }

  /** Sticky enriched entry — used when API is rate-limited or unreachable. */
  getStickyEnriched(login: string): GitHubProfileCacheEntry | undefined {
    const entry = this.get(login);
    if (!entry || entry.status !== 'enriched' || !entry.profile) return undefined;
    return entry;
  }

  setEnriched(login: string, profile: GitHubUserProfile): void {
    const key = normalizeLogin(login);
    this.entries[key] = {
      login: profile.login,
      status: 'enriched',
      fetchedAt: new Date().toISOString(),
      profile,
    };
  }

  setNotFound(login: string): void {
    const key = normalizeLogin(login);
    const existing = this.entries[key];
    if (existing?.status === 'enriched' && existing.profile) {
      return;
    }
    this.entries[key] = {
      login: login.trim(),
      status: 'not_found',
      fetchedAt: new Date().toISOString(),
      profile: null,
    };
  }

  save(): void {
    const payload: GitHubProfileCacheFile = {
      version: 1,
      entries: this.entries,
    };
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(cachePath(), `${JSON.stringify(payload, null, 2)}\n`);
  }
}
