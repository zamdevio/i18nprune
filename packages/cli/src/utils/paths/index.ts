import os from 'node:os';
import path from 'node:path';

export function resolveFromCwd(p: string, cwd = process.cwd()): string {
  const expanded = p === '~' ? os.homedir() : p.startsWith('~/') ? path.join(os.homedir(), p.slice(2)) : p;
  return path.isAbsolute(expanded) ? expanded : path.resolve(cwd, expanded);
}
