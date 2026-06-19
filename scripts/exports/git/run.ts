import { spawnSync } from 'node:child_process';

import { repoRoot } from '../paths.js';

export interface GitRunResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  status: number | null;
  durationMs: number;
}

export interface GitInvocation {
  args: string[];
  ok: boolean;
  durationMs: number;
  status: number | null;
}

export interface GitRunStats {
  invocations: number;
  totalMs: number;
  last?: GitInvocation;
}

let sessionStats: GitRunStats = { invocations: 0, totalMs: 0 };

/** Run git in repo root; tracks session timing for maintainer-facing summaries. */
export function runGit(args: string[]): GitRunResult {
  const t0 = performance.now();
  const result = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const durationMs = Math.round(performance.now() - t0);
  const ok = result.status === 0;
  sessionStats.invocations += 1;
  sessionStats.totalMs += durationMs;
  sessionStats.last = { args, ok, durationMs, status: result.status };
  return {
    ok,
    stdout: (result.stdout ?? '').trim(),
    stderr: (result.stderr ?? '').trim(),
    status: result.status,
    durationMs,
  };
}


export function resetGitRunStats(): void {
  sessionStats = { invocations: 0, totalMs: 0 };
}

export function formatGitRunStats(stats: Readonly<GitRunStats> = sessionStats): string {
  if (!stats.invocations) return '0 calls';
  return `${stats.invocations} calls · ${stats.totalMs}ms`;
}
