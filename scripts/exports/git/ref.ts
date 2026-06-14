import { ExportError } from '../errors/index.js';
import { runGit } from './run.js';

export function recentVersionTags(limit = 8): string[] {
  const result = runGit(['tag', '-l', 'v*', '--sort=version:refname']);
  if (!result.ok || !result.stdout) return [];
  const tags = result.stdout.split('\n').filter(Boolean);
  return tags.slice(-limit);
}

function unknownRefError(ref: string): ExportError {
  const tags = recentVersionTags();
  return new ExportError(`Unknown git ref "${ref}"`, 'unknown_ref', {
    details: {
      ref,
      suggestion: tags.length
        ? `Known version tags: ${tags.join(', ')}`
        : 'Run `git tag -l` to list available tags.',
    },
  });
}

/** Resolve any ref to a full commit SHA. */
export function gitRevParse(ref: string): string {
  const result = runGit(['rev-parse', '--verify', `${ref}^{commit}`]);
  if (!result.ok || !result.stdout || result.stdout.includes('\n')) {
    throw unknownRefError(ref);
  }
  return result.stdout;
}

/** Read a repo-relative path at commit `sha`; null when missing at that revision. */
export function gitShowFile(sha: string, repoRelativePath: string): string | null {
  const result = runGit(['show', `${sha}:${repoRelativePath}`]);
  if (!result.ok) return null;
  return result.stdout;
}

export type SourceRef =
  | { kind: 'worktree'; label: string }
  | { kind: 'commit'; sha: string; label: string };

export function resolveSourceRef(input: string | undefined): SourceRef {
  if (!input || input === 'worktree' || input === 'working-tree' || input === 'wt') {
    return { kind: 'worktree', label: 'working tree' };
  }
  const sha = gitRevParse(input);
  return { kind: 'commit', sha, label: input };
}

function splitRangeToken(token: string): { left: string; right: string } | null {
  const idx = token.indexOf('..');
  if (idx <= 0 || idx >= token.length - 2) return null;
  const left = token.slice(0, idx).trim();
  const right = token.slice(idx + 2).trim();
  if (!left || !right) return null;
  return { left, right };
}

/** Parse `A..B` or single ref token. */
export function parseDiffRange(token: string | undefined): {
  left: SourceRef;
  right: SourceRef;
  rangeLabel: string;
} {
  if (!token) {
    const headSha = gitRevParse('HEAD');
    return {
      left: { kind: 'commit', sha: headSha, label: 'HEAD' },
      right: { kind: 'worktree', label: 'working tree' },
      rangeLabel: 'HEAD → working tree',
    };
  }

  const range = splitRangeToken(token);
  if (range) {
    if (range.right === 'worktree' || range.right === 'working-tree' || range.right === 'wt') {
      throw new ExportError('Range diff requires two commit refs', 'invalid_range', {
        details: {
          range: token,
          suggestion: 'Use `pnpm exports:diff <ref>` to compare a commit against the working tree.',
        },
      });
    }
    const left = resolveSourceRef(range.left);
    const right = resolveSourceRef(range.right);
    if (left.kind !== 'commit' || right.kind !== 'commit') {
      throw new ExportError('Range diff requires two commit refs', 'invalid_range', {
        details: { range: token },
      });
    }
    return {
      left,
      right,
      rangeLabel: `${left.label} → ${right.label}`,
    };
  }

  const base = resolveSourceRef(token);
  return {
    left: base,
    right: { kind: 'worktree', label: 'working tree' },
    rangeLabel: `${base.label} → working tree`,
  };
}

export function shortSha(sha: string): string {
  return sha.slice(0, 7);
}
