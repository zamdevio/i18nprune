import fs from 'node:fs';
import { listSourceFiles } from '@/core/scanner/files.js';

/** Read concatenated source text from all scanned files under `srcRoot`. */
export function scanSources(srcRoot: string): { files: string[]; text: string } {
  const files = listSourceFiles(srcRoot);
  const parts: string[] = [];
  for (const f of files) {
    try {
      parts.push(fs.readFileSync(f, 'utf8'));
    } catch {
      /* skip */
    }
  }
  return { files, text: parts.join('\n') };
}
