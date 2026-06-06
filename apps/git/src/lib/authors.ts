import type { Author, AuthorProfileStats, Commit } from '../types';
import { computeScopeBreakdown, computeTypeBreakdown } from './breakdown';

export function authorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function authorUsername(name: string, email = ''): string {
  const fromName = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  if (fromName) return fromName;
  const fromEmail = email.split('@')[0]?.toLowerCase().replace(/[^a-z0-9-]/g, '');
  return fromEmail || 'unknown';
}

export function authorProfilePath(username: string): string {
  return `/authors/${encodeURIComponent(username)}`;
}

export function findAuthorByUsername(authors: Author[], username: string): Author | undefined {
  const normalized = username.toLowerCase();
  return authors.find((author) => author.username.toLowerCase() === normalized);
}

export function findAuthorForCommit(authors: Author[], commit: Commit): Author | undefined {
  return (
    authors.find((author) => author.email === commit.email) ??
    authors.find((author) => author.name === commit.author)
  );
}

export function commitsForAuthor(commits: Commit[], author: Author): Commit[] {
  return commits.filter((commit) => commit.email === author.email);
}

export function buildAuthorProfile(author: Author, commits: Commit[]): AuthorProfileStats {
  const authorCommits = commitsForAuthor(commits, author);
  const activeDays = new Set(authorCommits.map((commit) => commit.date)).size;
  const weeksActive = new Set(authorCommits.map((commit) => commit.week)).size;
  const netLines = author.insertions - author.deletions;
  const avgCommitsPerActiveDay =
    activeDays > 0 ? Math.round((author.commits / activeDays) * 10) / 10 : 0;

  const scopeBreakdown = computeScopeBreakdown(authorCommits);
  const topScopes = scopeBreakdown.slice(0, 8);
  const topScopeItem = scopeBreakdown[0];

  const dayCounts = new Map<string, number>();
  for (const commit of authorCommits) {
    dayCounts.set(commit.date, (dayCounts.get(commit.date) ?? 0) + 1);
  }
  let peakDate = '';
  let peakCount = 0;
  for (const [date, count] of dayCounts) {
    if (count > peakCount) {
      peakDate = date;
      peakCount = count;
    }
  }

  return {
    activeDays,
    weeksActive,
    netLines,
    avgCommitsPerActiveDay,
    peakCommitDay: peakCount > 0 ? { date: peakDate, count: peakCount } : null,
    topScope: topScopeItem ? { scope: topScopeItem.scope, count: topScopeItem.count } : null,
    typeBreakdown: computeTypeBreakdown(authorCommits),
    scopeBreakdown,
    topScopes,
    recentCommits: authorCommits.slice(0, 20),
  };
}
