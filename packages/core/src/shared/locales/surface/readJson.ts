import { existsRuntimeFsSync } from '../../../runtime/helpers/sync/fs.js';
import { readLocaleSegmentFromContext } from '../read/index.js';
import type { CoreContext } from '../../../types/context/index.js';
import type { TranslationSurfaceLeaf } from '../../../types/locales/leaves/translationSurface.js';

/** Read locale JSON from disk, or `{}` when the segment file does not exist yet. */
export function readLocaleJsonOrEmpty(ctx: CoreContext, absolutePath: string): unknown {
  if (!existsRuntimeFsSync(absolutePath, ctx.adapters.fs)) {
    return {};
  }
  const read = readLocaleSegmentFromContext(ctx, absolutePath);
  if (!read.ok) return {};
  return read.document;
}

/** Cached segment leaves, or `[]` when the file is missing or unreadable. */
export function readLocaleSegmentLeavesOrEmpty(ctx: CoreContext, absolutePath: string): TranslationSurfaceLeaf[] {
  if (!existsRuntimeFsSync(absolutePath, ctx.adapters.fs)) {
    return [];
  }
  const read = readLocaleSegmentFromContext(ctx, absolutePath);
  if (!read.ok) return [];
  return read.leaves;
}
