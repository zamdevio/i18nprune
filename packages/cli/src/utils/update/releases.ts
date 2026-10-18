import {
  RELEASES_NOTES_FETCH_TIMEOUT_MS,
  RELEASES_PORTAL_ORIGIN,
} from '@/constants/update.js';

/** Release-notes section keys, in the order worth surfacing. */
export type ReleaseSectionKey =
  | 'breaking'
  | 'security'
  | 'added'
  | 'changed'
  | 'fixed'
  | 'removed'
  | 'performance';

/** One release record as published under `/releases/<stream>/<version>.json`. */
export type ReleaseNotes = {
  schemaVersion: number;
  stream: string;
  version: string;
  date: string;
  status: string;
  summary: string;
  highlights?: string[];
  sections?: Partial<Record<ReleaseSectionKey, string[]>>;
  npm?: { package?: string; installSnippet?: string };
};

/**
 * Fetch one release record from the releases portal.
 *
 * Returns `null` on **any** failure — offline, 404 (version not published), non-JSON,
 * or timeout — so callers degrade gracefully instead of failing a command.
 */
export async function fetchReleaseNotes(
  stream: string,
  version: string,
): Promise<ReleaseNotes | null> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), RELEASES_NOTES_FETCH_TIMEOUT_MS);
  try {
    const url = `${RELEASES_PORTAL_ORIGIN}/releases/${stream}/${version}.json`;
    const res = await fetch(url, { signal: ac.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = (await res.json()) as ReleaseNotes;
    if (!data || typeof data !== 'object' || typeof data.summary !== 'string') return null;
    return data;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Portal URL for a release's full notes (human page). */
export function releaseNotesUrl(stream: string, version: string): string {
  return `${RELEASES_PORTAL_ORIGIN}/${stream}/${version}`;
}
