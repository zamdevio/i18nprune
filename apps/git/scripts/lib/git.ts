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

const RECORD = '\x1e--END--\x1e';

export function fetchGitLog(): string {
  const fields = ['%H', '%h', '%ad', '%an', '%ae', '%s', '%b'].join('\x1e');
  return git([
    'log',
    `--pretty=format:${fields}${RECORD}`,
    '--date=short',
    '--numstat',
  ]);
}

export { RECORD as GIT_LOG_RECORD };
