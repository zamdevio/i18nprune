import type { ExportCommit } from './parse.js';
import { tryGit } from './git.js';

export interface BranchOutput {
  name: string;
  hash: string;
  shortHash: string;
  date: string;
  subject: string;
  isCurrent: boolean;
  totalCommits: number;
  authors: number;
  authorEmails: string[];
  insertions: number;
  deletions: number;
  netLines: number;
  activeDays: number;
  firstCommit: string;
  lastCommit: string;
}

export type ExclusiveCommitMap = Map<string, Set<string>>;

function branchRef(name: string): string {
  return `refs/heads/${name}`;
}

function revListHashes(branchName: string): string[] {
  return tryGit(['rev-list', branchRef(branchName)])?.split('\n').filter(Boolean) ?? [];
}

export function resolveDefaultBranch(branchNames: string[]): string {
  if (branchNames.includes('main')) return 'main';
  if (branchNames.includes('master')) return 'master';
  return branchNames[0] ?? 'main';
}

/** Commits reachable from `branchName` but not from the default branch. */
export function buildExclusiveCommitMap(
  branchNames: string[],
  defaultBranch = resolveDefaultBranch(branchNames),
): ExclusiveCommitMap {
  const map: ExclusiveCommitMap = new Map();

  for (const name of branchNames) {
    if (name === defaultBranch) continue;
    const raw = tryGit(['rev-list', branchRef(name), '--not', branchRef(defaultBranch)]);
    map.set(name, new Set(raw?.split('\n').filter(Boolean) ?? []));
  }

  return map;
}

/**
 * Primary branch for filtering: side branches own only their exclusive commits;
 * shared history stays on main (or master).
 */
export function pickPrimaryBranch(
  commitHash: string,
  containing: string[],
  exclusiveByBranch: ExclusiveCommitMap,
  defaultBranch = 'main',
): string | null {
  if (containing.length === 0) return null;

  for (const [branchName, hashes] of exclusiveByBranch) {
    if (hashes.has(commitHash) && containing.includes(branchName)) {
      return branchName;
    }
  }

  for (const name of ['main', 'master'] as const) {
    if (containing.includes(name)) return name;
  }

  if (containing.length === 1) return containing[0];

  return [...containing].sort((left, right) => left.localeCompare(right))[0] ?? null;
}

export function buildCommitBranchMap(branchNames: string[]): Map<string, string[]> {
  const map = new Map<string, string[]>();

  for (const name of branchNames) {
    for (const hash of revListHashes(name)) {
      const existing = map.get(hash) ?? [];
      if (!existing.includes(name)) existing.push(name);
      map.set(hash, existing);
    }
  }

  for (const [hash, names] of map) {
    map.set(
      hash,
      [...names].sort((left, right) => left.localeCompare(right)),
    );
  }

  return map;
}

export function buildBranches(
  commits: Array<ExportCommit & { branch: string | null }>,
): BranchOutput[] {
  const commitByHash = new Map(commits.map((commit) => [commit.fullHash, commit]));
  const names =
    tryGit(['branch', '--list', '--format=%(refname:short)'])?.split('\n').filter(Boolean) ?? [];
  const current = tryGit(['branch', '--show-current']) ?? '';

  return names
    .map((name) => {
      const hash = tryGit(['rev-parse', branchRef(name)]) ?? '';
      const shortHash = hash.slice(0, 7);
      const logLine = hash ? tryGit(['log', '-1', '--format=%ad\x1e%s', '--date=short', hash]) : null;
      const [date = '', subject = ''] = logLine?.split('\x1e') ?? [];

      const branchCommits = commits.filter((commit) => commit.branch === name);

      const authorEmails = [...new Set(branchCommits.map((commit) => commit.email))].sort();
      const insertions = branchCommits.reduce((sum, commit) => sum + commit.insertions, 0);
      const deletions = branchCommits.reduce((sum, commit) => sum + commit.deletions, 0);
      const dates = branchCommits.map((commit) => commit.date).sort();
      const activeDays = new Set(branchCommits.map((commit) => commit.date)).size;

      const tipCommit = commitByHash.get(hash);
      const tipDate = tipCommit?.date ?? date;

      return {
        name,
        hash,
        shortHash,
        date,
        subject: tipCommit?.subject ?? subject,
        isCurrent: name === current,
        totalCommits: branchCommits.length,
        authors: authorEmails.length,
        authorEmails,
        insertions,
        deletions,
        netLines: insertions - deletions,
        activeDays,
        firstCommit: dates[0] ?? tipDate,
        lastCommit: dates.at(-1) ?? tipDate,
      };
    })
    .sort((left, right) => {
      if (left.isCurrent !== right.isCurrent) return left.isCurrent ? -1 : 1;
      return right.date.localeCompare(left.date) || left.name.localeCompare(right.name);
    });
}
