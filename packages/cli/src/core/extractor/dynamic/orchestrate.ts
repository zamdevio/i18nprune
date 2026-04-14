/**
 * Project-level orchestration: walk `srcRoot`, run per-file dynamic providers, aggregate sites.
 * File-level mechanics live under `providers/`; this module uses `Context` + filesystem.
 */
import fs from 'node:fs';
import path from 'node:path';
import { findDynamicKeySitesInJavascriptMergedText } from '@/core/extractor/dynamic/providers/javascript.js';
import { findDynamicKeySitesForFile } from '@/core/extractor/dynamic/providers/index.js';
import { listSourceFiles } from '@/core/scanner/files.js';
import type { Context } from '@/types/core/context/index.js';
import type { DynamicKeySite } from '@/types/core/extractor/dynamic/index.js';

/**
 * Reuse merged source text for callers that already have it (e.g. tests).
 * Per-file fields are omitted; comment detection is not applied across merged blobs.
 */
export function analyzeDynamicKeysFromSourceText(
  text: string,
  functions: string[],
): DynamicKeySite[] {
  return findDynamicKeySitesInJavascriptMergedText(text, functions);
}

/**
 * Scan each file under `srcRoot` with a provider chosen by **file extension only**.
 * Paths with no registered provider are skipped (no error).
 */
export function scanProjectDynamicKeySites(ctx: Context): DynamicKeySite[] {
  const files = listSourceFiles(ctx.paths.srcRoot);
  const out: DynamicKeySite[] = [];
  const cwd = process.cwd();

  for (const filePath of files) {
    let content: string;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }
    const rel = path.relative(cwd, filePath);
    const displayPath = rel && !rel.startsWith('..') ? rel : filePath;
    const sites = findDynamicKeySitesForFile(filePath, content, ctx.config.functions);
    for (const s of sites) {
      out.push({
        ...s,
        filePath: displayPath,
      });
    }
  }

  return out;
}
