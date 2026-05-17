import {
  buildProjectTreeFromPaths,
  emptyDirectoryPathsFromZipKeys,
  type ProjectTreeNode,
  type ProjectZipFileMetaForTree,
} from '@i18nprune/core';
import { unzipSync } from 'fflate';
import { PROJECT_LIMITS } from './limits';

export type { ProjectTreeNode };

export type ProjectFileMeta = {
  path: string;
  kind: 'file';
  size: number;
  ext: string;
  mimeGuess: string;
  textLike: boolean;
};

export type ProjectSnapshot = {
  projectId: string;
  projectHash: string;
  uploadedAt: string;
  zipBytes: number;
  fileCount: number;
  textFileCount: number;
  detectedConfigPath: string | null;
  detectedConfigRaw: string | null;
  tree: ProjectTreeNode[];
  resolvedConfig: Record<string, unknown> | null;
  sourceLocaleJson: Record<string, unknown> | null;
  localeJsonByTag: Record<string, Record<string, unknown>>;
  extraction: {
    configHash: string;
    sourceLocalePath: string;
    srcRoot: string;
    localesDir: string;
    resolvedKeys: string[];
    keyObservationsCount: number;
    dynamicSitesCount: number;
    keyObservationsPreview: unknown[];
    dynamicSitesPreview: unknown[];
    computedAt: string;
  } | null;
};

export type ParsedProjectUpload = {
  snapshot: ProjectSnapshot;
  textFiles: Record<string, string>;
};

const CONFIG_NAMES = new Set([
  'i18nprune.config.ts',
  'i18nprune.config.mts',
  'i18nprune.config.cts',
  'i18nprune.config.js',
  'i18nprune.config.mjs',
  'i18nprune.config.cjs',
]);

function parseFunctionsArray(raw: string): string[] {
  const quoted = raw.match(/['"`]([^'"`]+)['"`]/g) ?? [];
  const values = quoted.map((token) => token.slice(1, -1).trim()).filter((v) => v.length > 0);
  return [...new Set(values)];
}

function tryParseConfigObjectFromTsOrJs(raw: string): Record<string, unknown> | null {
  const compact = raw.replace(/\r\n/g, '\n');
  const nestedSource =
    compact.match(/\blocales\s*:\s*\{[\s\S]*?\bsource\s*:\s*['"`]([^'"`]+)['"`]/)?.[1] ?? null;
  const nestedDirectory =
    compact.match(/\blocales\s*:\s*\{[\s\S]*?\bdirectory\s*:\s*['"`]([^'"`]+)['"`]/)?.[1] ?? null;
  const flatSource = compact.match(/\bsource\s*:\s*['"`]([^'"`]+)['"`]/)?.[1] ?? null;
  const src = compact.match(/\bsrc\s*:\s*['"`]([^'"`]+)['"`]/)?.[1] ?? null;
  const flatLocalesDir = compact.match(/\blocalesDir\s*:\s*['"`]([^'"`]+)['"`]/)?.[1] ?? null;
  const functionsRaw = compact.match(/\bfunctions\s*:\s*\[([\s\S]*?)\]/)?.[1] ?? null;
  const functions = functionsRaw ? parseFunctionsArray(functionsRaw) : [];
  const source = nestedSource && nestedDirectory ? nestedSource : flatSource;
  const localesDir = nestedSource && nestedDirectory ? nestedDirectory : flatLocalesDir;
  if (!source || !src || !localesDir || functions.length === 0) return null;
  return { source, src, localesDir, functions };
}

function extOf(filePath: string): string {
  const idx = filePath.lastIndexOf('.');
  return idx >= 0 ? filePath.slice(idx).toLowerCase() : '';
}

function mimeGuess(ext: string): string {
  switch (ext) {
    case '.ts':
    case '.tsx':
    case '.js':
    case '.jsx':
    case '.mjs':
    case '.cjs':
      return 'text/javascript';
    case '.json':
      return 'application/json';
    case '.md':
      return 'text/markdown';
    case '.yaml':
    case '.yml':
      return 'text/yaml';
    case '.html':
      return 'text/html';
    case '.css':
      return 'text/css';
    case '.txt':
      return 'text/plain';
    default:
      return 'application/octet-stream';
  }
}

function normalizePath(input: string): string {
  return input.replace(/\\/g, '/').replace(/^\.?\//, '').replace(/\/+/g, '/').replace(/\/$/, '');
}

function isLikelyText(bytes: Uint8Array): boolean {
  if (bytes.length === 0) return true;
  let weird = 0;
  const sample = bytes.subarray(0, Math.min(bytes.length, 1024));
  for (const b of sample) {
    if (b === 0) return false;
    if (b < 9 || (b > 13 && b < 32)) weird += 1;
  }
  return weird / sample.length < 0.1;
}

function fileMetaMapForTree(fileMeta: Map<string, ProjectFileMeta>): Map<string, ProjectZipFileMetaForTree> {
  const out = new Map<string, ProjectZipFileMetaForTree>();
  for (const [k, v] of fileMeta) {
    out.set(k, { size: v.size, ext: v.ext, mimeGuess: v.mimeGuess, textLike: v.textLike });
  }
  return out;
}

export function parseZipToSnapshot(projectId: string, projectHash: string, zipBytes: Uint8Array): ParsedProjectUpload {
  if (zipBytes.byteLength > PROJECT_LIMITS.maxZipBytes) {
    throw new Error(`Zip exceeds max size (${PROJECT_LIMITS.maxZipBytes} bytes)`);
  }

  const unzipped = unzipSync(zipBytes);
  const files: Record<string, string> = {};
  const fileMeta = new Map<string, ProjectFileMeta>();
  let totalTextBytes = 0;

  const entries = Object.entries(unzipped)
    .map(([k, v]) => [normalizePath(k), v] as const)
    .filter(([k, v]) => k.length > 0 && !k.endsWith('/') && v.length >= 0);

  if (entries.length > PROJECT_LIMITS.maxFiles) {
    throw new Error(`Zip exceeds max file count (${PROJECT_LIMITS.maxFiles})`);
  }

  let detectedConfigPath: string | null = null;
  let detectedConfigRaw: string | null = null;
  let resolvedConfig: Record<string, unknown> | null = null;

  for (const [rawPath, bytes] of entries) {
    const ext = extOf(rawPath);
    const textLike = isLikelyText(bytes);
    const size = bytes.byteLength;
    const meta: ProjectFileMeta = {
      path: rawPath,
      kind: 'file',
      size,
      ext,
      mimeGuess: mimeGuess(ext),
      textLike,
    };
    fileMeta.set(rawPath, meta);
    if (!textLike) continue;
    totalTextBytes += size;
    if (totalTextBytes > PROJECT_LIMITS.maxTextBytes) {
      throw new Error(`Zip extracted text exceeds limit (${PROJECT_LIMITS.maxTextBytes} bytes)`);
    }
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    files[rawPath] = decoded;
    const baseName = rawPath.split('/').pop() ?? rawPath;
    if (detectedConfigPath === null && CONFIG_NAMES.has(baseName)) {
      detectedConfigPath = rawPath;
      detectedConfigRaw = decoded;
    }
    if (resolvedConfig === null && baseName === 'i18nprune.config.json') {
      try {
        const parsed = JSON.parse(decoded) as unknown;
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          resolvedConfig = parsed as Record<string, unknown>;
        }
      } catch {
        /* ignore invalid config json */
      }
    }
    if (resolvedConfig === null && CONFIG_NAMES.has(baseName)) {
      resolvedConfig = tryParseConfigObjectFromTsOrJs(decoded);
    }
  }

  const emptyDirs = emptyDirectoryPathsFromZipKeys(Object.keys(unzipped), normalizePath);
  const tree = buildProjectTreeFromPaths([...fileMeta.keys()], fileMetaMapForTree(fileMeta), emptyDirs);
  const uploadedAt = new Date().toISOString();
  return {
    snapshot: {
      projectId,
      projectHash,
      uploadedAt,
      zipBytes: zipBytes.byteLength,
      fileCount: entries.length,
      textFileCount: Object.keys(files).length,
      detectedConfigPath,
      detectedConfigRaw,
      tree,
      resolvedConfig,
      sourceLocaleJson: null,
      localeJsonByTag: {},
      extraction: null,
    },
    textFiles: files,
  };
}
