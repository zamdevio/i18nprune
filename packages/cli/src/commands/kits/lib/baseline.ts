import fs from 'node:fs';
import path from 'node:path';

import type { KitsBaselineSignal } from '@/types/command/kits/index.js';

function normalizeUserPath(userPath: string): string {
  if (path.isAbsolute(userPath)) {
    throw new Error(`Baseline path must be relative to the project root (got absolute): ${userPath}`);
  }
  const cleaned = userPath.replaceAll('\\', '/');
  if (cleaned.split('/').some((seg) => seg === '..')) {
    throw new Error(`Baseline path must not contain '..': ${userPath}`);
  }
  return cleaned.replace(/^\/+/, '');
}

function ensureExt(filename: string, json: boolean): string {
  const lower = filename.toLowerCase();
  if (json) {
    if (lower.endsWith('.json')) return filename;
    if (lower.endsWith('.md')) return `${filename.slice(0, -3)}.json`;
    return `${filename}.json`;
  }
  if (lower.endsWith('.md')) return filename;
  if (lower.endsWith('.json')) return `${filename.slice(0, -5)}.md`;
  return `${filename}.md`;
}

/** Resolve a user path under the project root (not a global kit directory). */
export function resolveKitsBaselinePath(projectRoot: string, userPath: string, json: boolean): string {
  const cleaned = normalizeUserPath(userPath);
  const parts = cleaned.split('/').filter(Boolean);
  if (parts.length === 0) throw new Error('Empty baseline path.');
  if (parts.length > 11) {
    throw new Error(`Baseline directory depth too deep (>10): ${userPath}`);
  }
  const filename = ensureExt(parts[parts.length - 1]!, json);
  const dirParts = parts.slice(0, -1);
  return path.join(projectRoot, ...dirParts, filename);
}

export function saveKitsBaselineReport(
  projectRoot: string,
  userPath: string,
  content: string,
  json: boolean,
): string {
  const dest = resolveKitsBaselinePath(projectRoot, userPath, json);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const body = content.endsWith('\n') ? content : `${content}\n`;
  fs.writeFileSync(dest, body, 'utf8');
  return dest;
}

export function loadKitsBaselineSignal(projectRoot: string, userPath: string): KitsBaselineSignal {
  const jsonPath = resolveKitsBaselinePath(projectRoot, userPath, true);
  const raw = fs.readFileSync(jsonPath, 'utf8');
  const parsed = JSON.parse(raw) as { signal?: KitsBaselineSignal } & KitsBaselineSignal;
  return (
    parsed.signal ?? {
      missingLiteralKeys: parsed.missingLiteralKeys,
      dynamicKeySites: parsed.dynamicKeySites,
      sourceIdenticalLeaves: parsed.sourceIdenticalLeaves,
    }
  );
}
