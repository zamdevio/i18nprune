import fs from 'node:fs';
import path from 'node:path';
import { buildConstStringMap } from '@/core/constmap/build.js';
import { commentRangesForJsLikeText } from '@/core/extractor/dynamic/comment.js';
import { scanKeyObservations } from '@/core/extractor/keySites/scan.js';
import { listSourceFiles } from '@/core/scanner/files.js';
import type { Context } from '@/types/core/context/index.js';
import type { KeyObservation } from '@/types/core/extractor/keySites/index.js';

/** Scan all source files under `srcRoot` and return key observations with file paths. */
export function scanProjectKeyObservations(ctx: Context): KeyObservation[] {
  const files = listSourceFiles(ctx.paths.srcRoot);
  const out: KeyObservation[] = [];
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
    const constMap = buildConstStringMap(content);
    const commentRanges = commentRangesForJsLikeText(content);
    const observations = scanKeyObservations(content, ctx.config.functions, constMap, {
      commentRanges,
    });
    for (const obs of observations) {
      out.push({
        ...obs,
        span: {
          ...obs.span,
          filePath: displayPath,
        },
      });
    }
  }

  return out;
}
