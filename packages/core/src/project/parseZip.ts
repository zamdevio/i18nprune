import { unzipSync } from 'fflate';
import {
  I18NPRUNE_CONFIG_JSON_FILE_NAME,
  I18NPRUNE_CONFIG_SCRIPT_FILE_NAMES_SET,
} from '../shared/constants/config.js';
import { PROJECT_UPLOAD_ZIP_LIMITS } from '../shared/constants/project.js';
import type { ParsedProjectUpload, ProjectUploadFileMeta } from '../types/project/upload.js';
import type { ProjectZipFileMetaForTree } from '../types/project/tree.js';
import { tryParseConfigObjectFromTsOrJs } from './parseConfigScript.js';
import { buildProjectTreeFromPaths, emptyDirectoryPathsFromZipKeys } from './tree.js';

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

function fileMetaMapForTree(
  fileMeta: Map<string, ProjectUploadFileMeta>,
): Map<string, ProjectZipFileMetaForTree> {
  const out = new Map<string, ProjectZipFileMetaForTree>();
  for (const [k, v] of fileMeta) {
    out.set(k, { size: v.size, ext: v.ext, mimeGuess: v.mimeGuess, textLike: v.textLike });
  }
  return out;
}

export function parseZipToSnapshot(
  projectId: string,
  projectHash: string,
  zipBytes: Uint8Array,
): ParsedProjectUpload {
  const limits = PROJECT_UPLOAD_ZIP_LIMITS;
  if (zipBytes.byteLength > limits.maxZipBytes) {
    throw new Error(`Zip exceeds max size (${limits.maxZipBytes} bytes)`);
  }

  const unzipped = unzipSync(zipBytes);
  const files: Record<string, string> = {};
  const fileMeta = new Map<string, ProjectUploadFileMeta>();
  let totalTextBytes = 0;

  const entries = Object.entries(unzipped)
    .map(([k, v]) => [normalizePath(k), v] as const)
    .filter(([k, v]) => k.length > 0 && !k.endsWith('/') && v.length >= 0);

  if (entries.length > limits.maxFiles) {
    throw new Error(`Zip exceeds max file count (${limits.maxFiles})`);
  }

  let detectedConfigPath: string | null = null;
  let detectedConfigRaw: string | null = null;
  let resolvedConfig: Record<string, unknown> | null = null;

  for (const [rawPath, bytes] of entries) {
    const ext = extOf(rawPath);
    const textLike = isLikelyText(bytes);
    const size = bytes.byteLength;
    const meta: ProjectUploadFileMeta = {
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
    if (totalTextBytes > limits.maxTextBytes) {
      throw new Error(`Zip extracted text exceeds limit (${limits.maxTextBytes} bytes)`);
    }
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    files[rawPath] = decoded;
    const baseName = rawPath.split('/').pop() ?? rawPath;
    if (detectedConfigPath === null && I18NPRUNE_CONFIG_SCRIPT_FILE_NAMES_SET.has(baseName)) {
      detectedConfigPath = rawPath;
      detectedConfigRaw = decoded;
    }
    if (resolvedConfig === null && baseName === I18NPRUNE_CONFIG_JSON_FILE_NAME) {
      try {
        const parsed = JSON.parse(decoded) as unknown;
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          resolvedConfig = parsed as Record<string, unknown>;
        }
      } catch {
        /* ignore invalid config json */
      }
    }
    if (resolvedConfig === null && I18NPRUNE_CONFIG_SCRIPT_FILE_NAMES_SET.has(baseName)) {
      resolvedConfig = tryParseConfigObjectFromTsOrJs(decoded);
    }
  }

  const emptyDirs = emptyDirectoryPathsFromZipKeys(Object.keys(unzipped), normalizePath);
  const tree = buildProjectTreeFromPaths([...fileMeta.keys()], fileMetaMapForTree(fileMeta), emptyDirs);
  const preparedAt = new Date().toISOString();
  return {
    snapshot: {
      projectId,
      projectHash,
      preparedAt,
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
