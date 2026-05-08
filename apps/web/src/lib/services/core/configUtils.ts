import type { ScanExcludeConfig } from '@i18nprune/core';
import { sha256Hex } from './cryptoUtils';

export type NormalizedConfig = {
  source: string;
  src: string;
  localesDir: string;
  functions: string[];
  exclude?: ScanExcludeConfig;
};

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableJson(v)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export async function configHash(config: NormalizedConfig): Promise<string> {
  return sha256Hex(new TextEncoder().encode(stableJson(config)));
}

export function normalizeConfig(input: Record<string, unknown> | null): NormalizedConfig | null {
  if (!input) return null;
  const source = typeof input.source === 'string' ? input.source : null;
  const src = typeof input.src === 'string' ? input.src : null;
  const localesDir = typeof input.localesDir === 'string' ? input.localesDir : null;
  const functions = Array.isArray(input.functions)
    ? input.functions.filter((x): x is string => typeof x === 'string' && x.length > 0)
    : [];
  if (!source || !src || !localesDir || functions.length === 0) return null;
  return {
    source,
    src,
    localesDir,
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

export function parseUploadFailure(cause: unknown): { code: string; message: string } {
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
