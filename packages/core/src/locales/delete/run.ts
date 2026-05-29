import { existsRuntimeFsSync } from '../../runtime/helpers/sync/fs.js';
import { segmentsForLocaleCode } from '../../shared/locales/targets/index.js';
import { normalizeLanguageCode } from '../../shared/languages/normalize.js';
import type { CoreContext } from '../../types/context/index.js';
import type { Issue } from '../../types/json/envelope/index.js';

export type DeleteTargetResult = {
  target: string;
  /** Segment paths removed for this locale code (e.g. `app/ar.json`). */
  deletedSegmentRelativePaths: string[];
  deletedJsonCount: number;
};

export type DeleteJsonPayload = {
  kind: 'locales-delete';
  targets: string[];
  /** JSON segment files removed on disk. */
  deletedJson: number;
  /** Distinct locale codes that had at least one segment file removed. */
  deletedLocaleCount: number;
  aborted: boolean;
  supportsAutoPatching: false;
};

export type DeleteRunResult = {
  payload: DeleteJsonPayload;
  issues: Issue[];
  deletedTargets: DeleteTargetResult[];
};

/**
 * Delete locale JSON segment files for the given targets.
 *
 * The CLI resolves targets and handles confirmation prompts; core owns the
 * actual file deletion via `ctx.adapters.fs`. No `process.*` access.
 */
export async function deleteLocaleFiles(
  ctx: CoreContext,
  targets: string[],
): Promise<DeleteRunResult> {
  const dir = ctx.paths.localesDir;
  const deletedTargets: DeleteTargetResult[] = [];
  let deletedJson = 0;
  let deletedLocaleCount = 0;

  for (const target of targets) {
    const code = normalizeLanguageCode(target);
    const segments = segmentsForLocaleCode(ctx, code);
    const segmentEntries =
      segments.length > 0
        ? segments.map((s) => ({ absolutePath: s.absolutePath, relativePath: s.relativePath }))
        : [
            {
              absolutePath: ctx.adapters.path.join(dir, `${code}.json`),
              relativePath: `${code}.json`,
            },
          ];

    const deletedSegmentRelativePaths: string[] = [];
    for (const segment of segmentEntries) {
      if (existsRuntimeFsSync(segment.absolutePath, ctx.adapters.fs)) {
        await Promise.resolve(ctx.adapters.fs.deleteFile(segment.absolutePath));
        deletedJson += 1;
        deletedSegmentRelativePaths.push(segment.relativePath);
      }
    }

    if (deletedSegmentRelativePaths.length > 0) {
      deletedLocaleCount += 1;
    }

    deletedTargets.push({
      target: code,
      deletedSegmentRelativePaths,
      deletedJsonCount: deletedSegmentRelativePaths.length,
    });
  }

  const payload: DeleteJsonPayload = {
    kind: 'locales-delete',
    targets,
    deletedJson,
    deletedLocaleCount,
    aborted: false,
    supportsAutoPatching: false,
  };

  return { payload, issues: [], deletedTargets };
}
