import type { Command } from 'commander';

/**
 * Invocation path under the root program (e.g. `locales list`, `validate`).
 * Excludes the root name (e.g. `i18nprune`).
 */
export function getCommandInvocationPath(cmd: Command, rootName: string): string {
  const segments: string[] = [];
  let c: Command | null = cmd;
  while (c) {
    const n = c.name();
    if (!n || n === rootName) break;
    segments.unshift(n);
    c = c.parent;
  }
  return segments.join(' ');
}
