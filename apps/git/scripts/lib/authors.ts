import { githubProfileUrl } from './github.js';
import { enrichAuthorsWithGitHub, type GitHubEnrichmentResult } from './github-api.js';
import type { ExportCommit } from './parse.js';

function authorUsername(name: string, email = ''): string {
  const fromName = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  if (fromName) return fromName;
  const fromEmail = email.split('@')[0]?.toLowerCase().replace(/[^a-z0-9-]/g, '');
  return fromEmail || 'unknown';
}

export interface AuthorOutput {
  username: string;
  name: string;
  email: string;
  commits: number;
  insertions: number;
  deletions: number;
  firstCommit: string;
  lastCommit: string;
  githubLogin: string | null;
  githubUrl: string;
  displayName: string;
  avatarUrl: string | null;
  followers: number | null;
  following: number | null;
  bio: string | null;
}

export function buildAuthors(commits: ExportCommit[]): AuthorOutput[] {
  const map = new Map<
    string,
    {
      name: string;
      email: string;
      commits: number;
      insertions: number;
      deletions: number;
      firstCommit: string;
      lastCommit: string;
    }
  >();

  for (const commit of commits) {
    const key = commit.email || commit.author;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        name: commit.author,
        email: commit.email,
        commits: 1,
        insertions: commit.insertions,
        deletions: commit.deletions,
        firstCommit: commit.date,
        lastCommit: commit.date,
      });
      continue;
    }
    existing.commits += 1;
    existing.insertions += commit.insertions;
    existing.deletions += commit.deletions;
    if (commit.date < existing.firstCommit) existing.firstCommit = commit.date;
    if (commit.date > existing.lastCommit) existing.lastCommit = commit.date;
  }

  return [...map.values()]
    .map((author) => {
      const username = authorUsername(author.name, author.email);
      const githubLogin = author.name.trim().replace(/\s+/g, '');
      return {
        ...author,
        username,
        githubLogin: /^[a-zA-Z0-9-]+$/.test(githubLogin) ? githubLogin : username,
        githubUrl: githubProfileUrl(author.name, author.email),
        displayName: author.name,
        avatarUrl: null,
        followers: null,
        following: null,
        bio: null,
      };
    })
    .sort((a, b) => b.commits - a.commits || a.name.localeCompare(b.name));
}

export async function buildAuthorsWithGitHub(
  commits: ExportCommit[],
): Promise<GitHubEnrichmentResult<AuthorOutput>> {
  return enrichAuthorsWithGitHub(buildAuthors(commits));
}
