import { listLocaleSegments } from '../shared/locales/enumerate/listLocaleSegments.js';
import { resolveLocalesLayout } from '../shared/locales/layout/resolveLayout.js';
import { listSourceFiles } from '../shared/scanner/files.js';
import { readRuntimeFsTextSync } from '../runtime/helpers/sync/index.js';
import type { LocalesFilesystemConfig } from '../config/schema/root.js';
import type { CacheProjectFileRecord, CacheRuntime, CachedLocalesLayout } from '../types/cache/index.js';
import { computeCacheContentHash, textByteLength } from './io/index.js';
import { resolveCachedLocalesLayout } from './localesLayout.js';

const SYNTHETIC_SOURCE_LOCALE_KEY = '__source_locale__';

/** Omit `__source_locale__` from the `files` map (source lives in `localeSegments`). */
export function omitSyntheticSourceKey(
  files: Record<string, CacheProjectFileRecord>,
): Record<string, CacheProjectFileRecord> {
  if (!(SYNTHETIC_SOURCE_LOCALE_KEY in files)) return files;
  const out = { ...files };
  delete out[SYNTHETIC_SOURCE_LOCALE_KEY];
  return out;
}

export function mergeTrackedFileMaps(
  files: Record<string, CacheProjectFileRecord>,
  localeSegments: Record<string, CacheProjectFileRecord>,
): Record<string, CacheProjectFileRecord> {
  return { ...files, ...localeSegments };
}

function hashFileRecord(
  absPath: string,
  runtime: CacheRuntime,
  now: string,
): CacheProjectFileRecord {
  const content = readRuntimeFsTextSync(absPath, runtime.fs);
  return {
    hash: computeCacheContentHash(content, runtime.hashText),
    size: textByteLength(content, runtime),
    mtimeMs: 0,
    updatedAt: now,
  };
}

export function buildSrcFileRecords(input: {
  runtime: CacheRuntime;
  srcRoot: string;
  exclude?: import('../types/scanner/index.js').ScanExcludeConfig;
}): Record<string, CacheProjectFileRecord> {
  const paths = listSourceFiles({ fs: input.runtime.fs, path: input.runtime.path }, input.srcRoot, input.exclude);
  const now = new Date(input.runtime.system.now()).toISOString();
  const out: Record<string, CacheProjectFileRecord> = {};
  for (const absPath of paths) {
    const rel = input.runtime.path.relative(input.srcRoot, absPath).replace(/\\/g, '/');
    out[rel] = hashFileRecord(absPath, input.runtime, now);
  }
  return out;
}

export function buildLocaleSegmentRecords(input: {
  runtime: CacheRuntime;
  localesDir: string;
  locales: LocalesFilesystemConfig;
}): Record<string, CacheProjectFileRecord> {
  const layout = resolveLocalesLayout(input.locales, input.localesDir);
  const { segments } = listLocaleSegments({ layout, fs: input.runtime.fs, path: input.runtime.path });
  const now = new Date(input.runtime.system.now()).toISOString();
  const out: Record<string, CacheProjectFileRecord> = {};
  for (const segment of segments) {
    out[segment.relativePath] = hashFileRecord(segment.absolutePath, input.runtime, now);
  }
  return out;
}

export type TrackedProjectFilesCurrent = {
  files: Record<string, CacheProjectFileRecord>;
  localeSegments: Record<string, CacheProjectFileRecord>;
  localesLayout: CachedLocalesLayout;
  merged: Record<string, CacheProjectFileRecord>;
};

export function buildTrackedProjectFilesCurrent(input: {
  runtime: CacheRuntime;
  srcRoot: string;
  exclude?: import('../types/scanner/index.js').ScanExcludeConfig;
  localesDir: string;
  locales: LocalesFilesystemConfig;
  reuseSrcFiles?: Record<string, CacheProjectFileRecord>;
  scanSrc: boolean;
}): TrackedProjectFilesCurrent {
  const localesLayout = resolveCachedLocalesLayout(input.locales);
  const files = input.scanSrc
    ? buildSrcFileRecords(input)
    : omitSyntheticSourceKey(input.reuseSrcFiles ?? {});
  const localeSegments = buildLocaleSegmentRecords(input);
  return {
    files,
    localeSegments,
    localesLayout,
    merged: mergeTrackedFileMaps(files, localeSegments),
  };
}
