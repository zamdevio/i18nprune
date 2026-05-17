import { existsRuntimeFsSync, listRuntimeFsDirSync } from '../../../runtime/helpers/sync/fs.js';

import { MAX_LOCALE_SEGMENT_TREE_DEPTH } from '../../constants/locales.js';
import type { LocaleLeafPathApi } from '../../../types/locales/leaves/segmentSource.js';
import type { RuntimeFsPort } from '../../../types/runtime/fs.js';

export type WalkedJsonSegment = {
  absolutePath: string;
  relativePath: string;
};

function posixRelative(pathApi: LocaleLeafPathApi, root: string, absolute: string): string {
  let rel = pathApi.relative(root, absolute);
  if (rel.startsWith('..') || pathApi.isAbsolute(rel)) {
    rel = pathApi.basename(absolute);
  }
  return rel.replace(/\\/g, '/');
}

/**
 * Collect `*.json` segment files under `rootAbsolute` (skips `*.meta.json`).
 *
 * @param recursive — When false, only immediate children of `rootAbsolute` are scanned.
 */
export function walkLocaleJsonSegments(input: {
  fs: RuntimeFsPort;
  path: LocaleLeafPathApi;
  rootAbsolute: string;
  recursive: boolean;
  maxDepth?: number;
}): WalkedJsonSegment[] {
  const { fs, path, rootAbsolute, recursive } = input;
  const maxDepth = input.maxDepth ?? MAX_LOCALE_SEGMENT_TREE_DEPTH;
  const out: WalkedJsonSegment[] = [];

  function visit(dirAbsolute: string, depth: number): void {
    if (!existsRuntimeFsSync(dirAbsolute, fs)) return;
    const entries = listRuntimeFsDirSync(dirAbsolute, fs);
    for (const entry of entries) {
      const childAbsolute = path.join(dirAbsolute, entry.name);
      if (entry.kind === 'file' && entry.name.endsWith('.json') && !entry.name.endsWith('.meta.json')) {
        out.push({
          absolutePath: childAbsolute,
          relativePath: posixRelative(path, rootAbsolute, childAbsolute),
        });
      } else if (recursive && entry.kind === 'directory' && depth < maxDepth) {
        visit(childAbsolute, depth + 1);
      }
    }
  }

  visit(rootAbsolute, 0);
  return out;
}
