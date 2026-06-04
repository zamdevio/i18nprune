/** Full-text search across release summaries, sections, tags, and highlights. */
import { getStreamReleases } from '@/features/catalog';
import type { ReleaseRecordV1, StreamId } from '@/types';

export type SearchHit = {
  stream: StreamId;
  version: string;
  release: ReleaseRecordV1;
  score: number;
  matches: string[];
};

export function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

function collectSearchableLines(release: ReleaseRecordV1): string[] {
  const lines: string[] = [
    release.summary,
    release.version,
    release.npm.package,
    release.git.tag,
    ...(release.highlights ?? []),
    ...(release.tags ?? []),
  ];
  for (const items of Object.values(release.sections)) {
    lines.push(...items);
  }
  for (const note of release.migration.notes) {
    lines.push(note);
  }
  return lines;
}

export function searchMatchSnippets(
  release: ReleaseRecordV1,
  tokens: readonly string[],
  max = 2,
): string[] {
  if (!tokens.length) return [];
  const lines = collectSearchableLines(release);
  const snippets: string[] = [];
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (!tokens.some((t) => lower.includes(t))) continue;
    if (snippets.includes(line)) continue;
    snippets.push(line);
    if (snippets.length >= max) break;
  }
  return snippets;
}

export function searchReleases(query: string, limit = 40): SearchHit[] {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return [];

  const hits: SearchHit[] = [];

  for (const stream of ['cli', 'core', 'extension'] as const) {
    for (const release of getStreamReleases(stream)) {
      const corpus = collectSearchableLines(release).join('\n').toLowerCase();
      const matched = tokens.filter((t) => corpus.includes(t));
      if (matched.length === 0) continue;
      hits.push({
        stream,
        version: release.version,
        release,
        score: matched.length,
        matches: matched,
      });
    }
  }

  return hits
    .sort((a, b) => b.score - a.score || b.release.date.localeCompare(a.release.date))
    .slice(0, limit);
}
