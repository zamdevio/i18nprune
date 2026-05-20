import type { ScanExcludeConfig } from '../types/scanner/exclude.js';
import type { NormalizedProjectConfig } from '../types/project/config.js';
import { sha256HexBytes } from '../share/sha256.js';

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableJson(v)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export async function projectConfigHash(config: NormalizedProjectConfig): Promise<string> {
  return sha256HexBytes(new TextEncoder().encode(stableJson(config)));
}

export function normalizeProjectConfig(input: Record<string, unknown> | null): NormalizedProjectConfig | null {
  if (!input) return null;
  const locales = input.locales;
  if (!locales || typeof locales !== 'object' || Array.isArray(locales)) return null;
  const lo = locales as Record<string, unknown>;
  const source = typeof lo.source === 'string' ? lo.source : null;
  const localesDir = typeof lo.directory === 'string' ? lo.directory : null;
  const localesMode = lo.mode === 'flat_file' || lo.mode === 'locale_directory' ? lo.mode : undefined;
  const localesStructure =
    lo.structure === 'locale_file' || lo.structure === 'locale_per_dir' || lo.structure === 'feature_bundle'
      ? lo.structure
      : undefined;
  const src = typeof input.src === 'string' ? input.src : null;
  const functions = Array.isArray(input.functions)
    ? input.functions.filter((x): x is string => typeof x === 'string' && x.length > 0)
    : [];
  if (!source || !src || !localesDir || functions.length === 0) return null;
  return {
    source,
    src,
    localesDir,
    localesMode,
    localesStructure,
    functions,
    exclude: (input.exclude ?? undefined) as ScanExcludeConfig | undefined,
  };
}

export function relativeProjectPath(absPath: string): string {
  return absPath.replace(/^\/project\//, '').replace(/^\/project$/, '');
}

export function basenameNoExt(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  const segs = normalized.split('/');
  const name = segs[segs.length - 1] ?? normalized;
  return name.endsWith('.json') ? name.slice(0, -5) : name;
}

export function parseProjectUploadFailure(cause: unknown): { code: string; message: string } {
  const message = cause instanceof Error ? cause.message : 'Failed to process uploaded project archive.';
  if (message.startsWith('Zip exceeds max size')) {
    return { code: 'UPLOAD_ZIP_TOO_LARGE', message };
  }
  if (message.startsWith('Zip exceeds max file count')) {
    return { code: 'UPLOAD_TOO_MANY_FILES', message };
  }
  if (message.startsWith('Zip extracted text exceeds limit')) {
    return { code: 'UPLOAD_TEXT_LIMIT_EXCEEDED', message };
  }
  return { code: 'UPLOAD_PROCESSING_FAILED', message };
}
