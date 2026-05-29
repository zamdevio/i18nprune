import { existsRuntimeFsSync } from '../../../runtime/helpers/sync/fs.js';
import { readLocaleJsonFromContextSync } from '../read/bundle.js';
import type { CoreContext } from '../../../types/context/index.js';

/** Read locale JSON from disk, or `{}` when the segment file does not exist yet. */
export function readLocaleJsonOrEmpty(ctx: CoreContext, absolutePath: string): unknown {
  if (!existsRuntimeFsSync(absolutePath, ctx.adapters.fs)) {
    return {};
  }
  return readLocaleJsonFromContextSync(ctx, absolutePath);
}
