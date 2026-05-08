/**
 * Path segments (and a few roots) skipped when zipping a folder in the browser.
 * Keeps uploads smaller and avoids leaking VCS / dependency trees to the worker.
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

export function shouldSkipPathForFolderZip(relativePath: string): boolean {
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
