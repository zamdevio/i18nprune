import { execFileSync } from 'node:child_process';
import { REPO_ROOT } from './paths.js';

export function git(args: string[], cwd = REPO_ROOT): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf-8',
    maxBuffer: 64 * 1024 * 1024,
  }).trimEnd();
}

export function tryGit(args: string[], cwd = REPO_ROOT): string | null {
  try {
    return git(args, cwd);
  } catch {
    return null;
  }
}

export function listLocalBranches(): string[] {
  return tryGit(['branch', '--list', '--format=%(refname:short)'])?.split('\n').filter(Boolean) ?? [];
}

const RECORD = '\x1e--END--\x1e';

/** Walk all local branches so side-branch-only commits appear in commits.json. */
export function fetchGitLog(): string {
  const fields = ['%H', '%h', '%ad', '%an', '%ae', '%s', '%b'].join('\x1e');
  return git([
    'log',
    '--branches',
    '--topo-order',
    `--pretty=format:${fields}${RECORD}`,
    '--date=short',
    '--numstat',
  ]);
}

export { RECORD as GIT_LOG_RECORD };
