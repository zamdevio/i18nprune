import { readRuntimeFsTextSync } from '../runtime/helpers/sync/fs.js';
import { existsRuntimeFsSync, listRuntimeFsDirSync } from '../runtime/helpers/sync/index.js';
import { listSourceFiles } from '../shared/scanner/files.js';
import { ISSUE_IO_READ_FAILED, ISSUE_SHARE_REMOTE_PAYLOAD_TOO_LARGE } from '../shared/constants/issueCodes.js';
import {
  SHARE_PROJECT_SNAPSHOT_MAX_FILES,
  SHARE_PROJECT_SNAPSHOT_MAX_TEXT_BYTES,
  SHARE_PROJECT_SNAPSHOT_MAX_ZIP_BYTES,
} from '../shared/constants/shareProject.js';
import type { CoreContext } from '../types/context/index.js';
import type { Issue } from '../types/json/envelope/index.js';
import type { ProjectFilesystemRuntime } from '../types/runtime/capabilities.js';
import { shouldSkipPathForShareZip } from './ignorePaths.js';

const CONFIG_NAMES = new Set([
  'i18nprune.config.ts',
  'i18nprune.config.mts',
  'i18nprune.config.cts',
  'i18nprune.config.js',
  'i18nprune.config.mjs',
  'i18nprune.config.cjs',
  'i18nprune.config.json',
]);

function relPosix(path: ProjectFilesystemRuntime['path'], rootDir: string, absPath: string): string {
  return path.relative(rootDir, absPath).replace(/\\/g, '/');
}

function isUnderRoot(path: ProjectFilesystemRuntime['path'], root: string, candidate: string): boolean {
  const rel = relPosix(path, root, candidate);
  return rel !== '' && !rel.startsWith('../') && !path.isAbsolute(rel);
}

function walkLocaleJsonFiles(
  runtime: ProjectFilesystemRuntime,
  dir: string,
  projectRoot: string,
  out: Set<string>,
): Issue[] {
  const issues: Issue[] = [];
  const { fs, path } = runtime;
  if (!existsRuntimeFsSync(dir, fs)) return issues;
  const entries = listRuntimeFsDirSync(dir, fs);
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    const rel = relPosix(path, projectRoot, abs);
    if (!isUnderRoot(path, projectRoot, abs)) continue;
    if (shouldSkipPathForShareZip(rel)) continue;
    if (e.kind === 'directory') {
      issues.push(...walkLocaleJsonFiles(runtime, abs, projectRoot, out));
    } else if (e.kind === 'file' && e.name.toLowerCase().endsWith('.json')) {
      out.add(abs);
    }
  }
  return issues;
}

/**
 * Collects absolute file paths for a prepared project snapshot (config + locale JSON + scanned sources).
 */
export function collectShareSnapshotPaths(input: {
  ctx: CoreContext;
  projectRoot: string;
}): { paths: string[]; issues: Issue[] } {
  const { ctx, projectRoot } = input;
  const runtime: ProjectFilesystemRuntime = { fs: ctx.adapters.fs, path: ctx.adapters.path };
  const absRoot = ctx.adapters.path.resolve(projectRoot);
  const issues: Issue[] = [];
  const out = new Set<string>();

  if (existsRuntimeFsSync(absRoot, ctx.adapters.fs)) {
    const top = listRuntimeFsDirSync(absRoot, ctx.adapters.fs);
    for (const e of top) {
      if (e.kind !== 'file') continue;
      if (!CONFIG_NAMES.has(e.name)) continue;
      const abs = ctx.adapters.path.join(absRoot, e.name);
      out.add(abs);
    }
  }

  issues.push(...walkLocaleJsonFiles(runtime, ctx.paths.localesDir, absRoot, out));

  let sourceFiles: string[] = [];
  try {
    sourceFiles = listSourceFiles(runtime, ctx.paths.srcRoot, ctx.config.exclude);
  } catch (err) {
    issues.push({
      severity: 'error',
      code: ISSUE_IO_READ_FAILED,
      message: err instanceof Error ? err.message : 'Failed to list source files for share snapshot.',
      path: ctx.paths.srcRoot,
    });
    return { paths: [], issues };
  }

  for (const abs of sourceFiles) {
    const rel = relPosix(ctx.adapters.path, absRoot, abs);
    if (!isUnderRoot(ctx.adapters.path, absRoot, abs)) continue;
    if (shouldSkipPathForShareZip(rel)) continue;
    out.add(abs);
  }

  return { paths: [...out], issues };
}

export type ShareZipBuildIssue = Issue;

/**
 * Reads collected paths and builds the `fflate` zip map (POSIX keys → UTF-8 bytes).
 */
export function buildShareZipObject(input: {
  ctx: CoreContext;
  projectRoot: string;
  paths: readonly string[];
}): { zipObject: Record<string, Uint8Array>; textFileCount: number; issues: ShareZipBuildIssue[] } {
  const absRoot = input.ctx.adapters.path.resolve(input.projectRoot);
  const issues: ShareZipBuildIssue[] = [];
  const zipObject: Record<string, Uint8Array> = {};
  const enc = new TextEncoder();
  let textBytes = 0;
  let textFileCount = 0;

  for (const abs of input.paths) {
    const rel = relPosix(input.ctx.adapters.path, absRoot, abs);
    if (shouldSkipPathForShareZip(rel)) continue;
    try {
      const text = readRuntimeFsTextSync(abs, input.ctx.adapters.fs);
      textFileCount += 1;
      const bytes = enc.encode(text);
      textBytes += bytes.byteLength;
      if (textBytes > SHARE_PROJECT_SNAPSHOT_MAX_TEXT_BYTES) {
        issues.push({
          severity: 'error',
          code: ISSUE_SHARE_REMOTE_PAYLOAD_TOO_LARGE,
          message: `Prepared snapshot text exceeds the worker text limit (${String(SHARE_PROJECT_SNAPSHOT_MAX_TEXT_BYTES)} bytes) before zipping.`,
        });
        return { zipObject: {}, textFileCount: 0, issues };
      }
      zipObject[rel] = bytes;
    } catch (err) {
      issues.push({
        severity: 'error',
        code: ISSUE_IO_READ_FAILED,
        message: err instanceof Error ? err.message : `Failed to read file for share snapshot: ${abs}`,
        path: abs,
      });
      return { zipObject: {}, textFileCount: 0, issues };
    }
  }

  const fileCount = Object.keys(zipObject).length;
  if (fileCount > SHARE_PROJECT_SNAPSHOT_MAX_FILES) {
    issues.push({
      severity: 'error',
      code: ISSUE_SHARE_REMOTE_PAYLOAD_TOO_LARGE,
      message: `Prepared snapshot has too many files (${String(fileCount)} > ${String(SHARE_PROJECT_SNAPSHOT_MAX_FILES)}).`,
    });
    return { zipObject: {}, textFileCount: 0, issues };
  }

  return { zipObject, textFileCount, issues };
}

export function assertZipWithinLimit(zipBytes: Uint8Array): Issue | undefined {
  if (zipBytes.byteLength <= SHARE_PROJECT_SNAPSHOT_MAX_ZIP_BYTES) return undefined;
  return {
    severity: 'error',
    code: ISSUE_SHARE_REMOTE_PAYLOAD_TOO_LARGE,
    message: `Prepared zip exceeds worker limit (${String(SHARE_PROJECT_SNAPSHOT_MAX_ZIP_BYTES)} bytes).`,
  };
}
