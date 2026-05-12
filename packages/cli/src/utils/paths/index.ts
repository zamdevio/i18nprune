import path from 'node:path';

export function resolveFromCwd(p: string, cwd = process.cwd()): string {
  return path.isAbsolute(p) ? p : path.resolve(cwd, p);
}
