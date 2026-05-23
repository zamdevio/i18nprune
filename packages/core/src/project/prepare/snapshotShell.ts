import { readRuntimeFsTextSync } from '../../runtime/helpers/sync/fs.js';
import type { CoreContext } from '../../types/context/index.js';
import type { BuildProjectSnapshotShellResult } from '../../types/project/snapshotShell.js';
import type { ParsedProjectUpload, ProjectUploadFileMeta } from '../../types/project/upload.js';
import type { ProjectZipFileMetaForTree } from '../../types/project/tree.js';
import {
  I18NPRUNE_CONFIG_JSON_FILE_NAME,
  I18NPRUNE_CONFIG_SNAPSHOT_FILE_NAMES_SET,
} from '../../shared/constants/config.js';
import { collectShareSnapshotPaths } from '../../share/payload/collectSnapshotPaths.js';
import { tryParseConfigObjectFromTsOrJs } from '../parseConfigScript.js';
import { buildProjectTreeFromPaths, emptyDirectoryPathsFromZipKeys } from '../tree.js';

function extOf(filePath: string): string {
  const idx = filePath.lastIndexOf('.');
  return idx >= 0 ? filePath.slice(idx).toLowerCase() : '';
}

function mimeGuess(ext: string): string {
  if (ext === '.json') return 'application/json';
  if (['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].includes(ext)) return 'text/javascript';
  return 'application/octet-stream';
}

function fileMetaMapForTree(fileMeta: Map<string, ProjectUploadFileMeta>): Map<string, ProjectZipFileMetaForTree> {
  const out = new Map<string, ProjectZipFileMetaForTree>();
  for (const [k, v] of fileMeta) {
    out.set(k, { size: v.size, ext: v.ext, mimeGuess: v.mimeGuess, textLike: v.textLike });
  }
  return out;
}

/**
 * Collects share snapshot paths from disk and builds a zip-less {@link ParsedProjectUpload} shell.
 */
export function buildProjectSnapshotShellFromContext(input: {
  ctx: CoreContext;
  projectRoot: string;
  projectId: string;
  projectHash: string;
}): BuildProjectSnapshotShellResult {
  const collected = collectShareSnapshotPaths({ ctx: input.ctx, projectRoot: input.projectRoot });
  if (collected.issues.some((i) => i.severity === 'error')) {
    return { ok: false, issues: collected.issues.filter((i) => i.severity === 'error') };
  }

  const absRoot = input.ctx.adapters.path.resolve(input.projectRoot);
  const textFiles: Record<string, string> = {};
  const fileMeta = new Map<string, ProjectUploadFileMeta>();
  let detectedConfigPath: string | null = null;
  let detectedConfigRaw: string | null = null;
  let resolvedConfig: Record<string, unknown> | null = null;

  for (const abs of collected.paths) {
    const rel = input.ctx.adapters.path.relative(absRoot, abs).replace(/\\/g, '/');
    const text = readRuntimeFsTextSync(abs, input.ctx.adapters.fs);
    textFiles[rel] = text;
    const ext = extOf(rel);
    const size = new TextEncoder().encode(text).byteLength;
    fileMeta.set(rel, {
      path: rel,
      kind: 'file',
      size,
      ext,
      mimeGuess: mimeGuess(ext),
      textLike: true,
    });
    const baseName = rel.split('/').pop() ?? rel;
    if (detectedConfigPath === null && I18NPRUNE_CONFIG_SNAPSHOT_FILE_NAMES_SET.has(baseName)) {
      detectedConfigPath = rel;
      detectedConfigRaw = text;
    }
    if (resolvedConfig === null && baseName === I18NPRUNE_CONFIG_JSON_FILE_NAME) {
      try {
        const parsed = JSON.parse(text) as unknown;
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          resolvedConfig = parsed as Record<string, unknown>;
        }
      } catch {
        /* ignore */
      }
    }
    if (resolvedConfig === null && I18NPRUNE_CONFIG_SNAPSHOT_FILE_NAMES_SET.has(baseName)) {
      resolvedConfig = tryParseConfigObjectFromTsOrJs(text);
    }
  }

  const keys = Object.keys(textFiles);
  const emptyDirs = emptyDirectoryPathsFromZipKeys(keys, (p) => p.replace(/\\/g, '/').replace(/^\.?\//, ''));
  const tree = buildProjectTreeFromPaths(keys, fileMetaMapForTree(fileMeta), emptyDirs);
  const textBytes = keys.reduce((n, k) => n + new TextEncoder().encode(textFiles[k]!).byteLength, 0);

  return {
    ok: true,
    parsed: {
      snapshot: {
        projectId: input.projectId,
        projectHash: input.projectHash,
        preparedAt: new Date().toISOString(),
        zipBytes: textBytes,
        fileCount: keys.length,
        textFileCount: keys.length,
        detectedConfigPath,
        detectedConfigRaw,
        tree,
        resolvedConfig: resolvedConfig ?? (input.ctx.config as unknown as Record<string, unknown>),
        sourceLocaleJson: null,
        localeJsonByTag: {},
        extraction: null,
      },
      textFiles,
    },
  };
}
