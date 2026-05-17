import * as path from 'node:path';

/**
 * Hardcoded explorer filters (replace later with i18nprune config / scan graph).
 * Matches on **basename** for dirs; **extension** (lowercase) for files.
 */
export const EXPLORE_IGNORE_DIR_NAMES = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'out',
  'coverage',
  '.turbo',
  '.cache',
  '__pycache__',
  'venv',
  '.venv',
  'target',
  '.gradle',
  '.idea',
  '.vs',
]);

export const EXPLORE_IGNORE_FILE_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.bmp',
  '.avif',
  '.pdf',
  '.zip',
  '.7z',
  '.gz',
  '.tar',
  '.rar',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.otf',
  '.mp3',
  '.mp4',
  '.mov',
  '.webm',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.map',
  '.bin',
  '.wasm',
  '.pak',
]);

function fileExtLower(name: string): string {
  const ext = path.extname(name);
  return ext.toLowerCase();
}

export function shouldListExplorerEntry(name: string, isDirectory: boolean): boolean {
  if (name === '.' || name === '..') return false;
  if (isDirectory) {
    return !EXPLORE_IGNORE_DIR_NAMES.has(name);
  }
  const ext = fileExtLower(name);
  return !ext || !EXPLORE_IGNORE_FILE_EXTENSIONS.has(ext);
}

/** Known non-text extensions for read preview (skip UTF-8 attempt). */
export const PREVIEW_BINARY_EXT_RE = /\.(png|jpe?g|gif|webp|ico|bmp|avif|pdf|zip|7z|gz|tar|woff2?|ttf|eot|otf|mp3|mp4|mov|webm|exe|dll|so|dylib|wasm|bin)$/i;
