/**
 * Path segments (and a few roots) skipped when building a prepared project zip.
 * Mirrors `apps/web/src/zip/zipIgnorePaths.ts` so CLI / web uploads stay aligned.
 */
const IGNORE_DIR_SEGMENTS = new Set(
  [
    'node_modules',
    '.git',
    'dist',
    'build',
    'out',
    '.next',
    '.nuxt',
    'coverage',
    '.turbo',
    '.cache',
    '__pycache__',
    '.venv',
    'venv',
    'target',
    'Pods',
    'DerivedData',
    'storybook-static',
    'cdk.out',
    '.output',
    '.parcel-cache',
    '.vite',
    'tmp',
    'temp',
  ].map((s) => s.toLowerCase()),
);

/** @returns true when `relativePath` (POSIX, relative to project root) must be excluded from the share zip. */
export function shouldSkipPathForShareZip(relativePath: string): boolean {
  const norm = relativePath.replace(/\\/g, '/').replace(/^\.?\//, '');
  if (!norm) return false;
  const lowerPath = norm.toLowerCase();
  if (lowerPath.startsWith('node_modules/') || lowerPath === 'node_modules') return true;
  if (lowerPath.startsWith('.git/') || lowerPath === '.git') return true;

  for (const seg of norm.split('/')) {
    if (!seg) continue;
    const s = seg.toLowerCase();
    if (IGNORE_DIR_SEGMENTS.has(s)) return true;
  }
  return false;
}
