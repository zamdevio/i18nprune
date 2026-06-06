import type { Author, Commit, GitBranch } from '../types';
import { computeScopeBreakdown, computeTypeBreakdown } from './breakdown';

export function branchProfilePath(name: string): string {
  return `/branches/${encodeURIComponent(name)}`;
}

export function findBranchByName(branches: GitBranch[], name: string): GitBranch | undefined {
  const decoded = decodeURIComponent(name);
  return branches.find((branch) => branch.name === decoded);
}

export function pickDisplayBranch(commit: Commit): string | null {
  return commit.branch;
}

export function commitsOnBranch(commits: Commit[], branchName: string): Commit[] {
  return commits.filter((commit) => commit.branch === branchName);
}

export function branchNeighbors(
  branches: GitBranch[],
  name: string,
): { prev: GitBranch | null; next: GitBranch | null } {
  const index = branches.findIndex((branch) => branch.name === name);
  if (index < 0) return { prev: null, next: null };
  return {
    prev: index > 0 ? branches[index - 1] : null,
    next: index < branches.length - 1 ? branches[index + 1] : null,
  };
}

export function authorsOnBranch(authors: Author[], branch: GitBranch): Author[] {
  const emailSet = new Set(branch.authorEmails);
  return authors
    .filter((author) => emailSet.has(author.email))
    .sort((left, right) => right.commits - left.commits);
}

export function buildBranchProfile(branch: GitBranch, commits: Commit[]) {
  const branchCommits = commitsOnBranch(commits, branch.name);
  const weeksActive = new Set(branchCommits.map((commit) => commit.week)).size;

  return {
    weeksActive,
    typeBreakdown: computeTypeBreakdown(branchCommits),
    scopeBreakdown: computeScopeBreakdown(branchCommits),
    recentCommits: branchCommits.slice(0, 20),
  };
}
