import { existsRuntimeFsSync } from '../../runtime/helpers/sync/fs.js';
import type { CoreContext } from '../../types/generate/index.js';
import type { Issue } from '../../types/json/envelope/index.js';

export type DeleteTargetResult = {
  target: string;
  jsonPath: string;
  metaPath: string;
  hadMeta: boolean;
};

export type DeleteJsonPayload = {
  kind: 'locales-delete';
  targets: string[];
  deletedJson: number;
  deletedMeta: number;
  aborted: boolean;
  supportsAutoPatching: false;
};

export type DeleteRunResult = {
  payload: DeleteJsonPayload;
  issues: Issue[];
  deletedTargets: DeleteTargetResult[];
};

/**
 * Delete locale JSON (and optional `.meta.json`) files for the given targets.
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
  let deletedMeta = 0;

  for (const target of targets) {
    const jsonPath = ctx.adapters.path.join(dir, `${target}.json`);
    const metaPath = ctx.adapters.path.join(dir, `${target}.meta.json`);
    const hadMeta = existsRuntimeFsSync(metaPath, ctx.adapters.fs);

    await Promise.resolve(ctx.adapters.fs.deleteFile(jsonPath));
    deletedJson += 1;

    if (hadMeta) {
      await Promise.resolve(ctx.adapters.fs.deleteFile(metaPath));
      deletedMeta += 1;
    }

    deletedTargets.push({ target, jsonPath, metaPath, hadMeta });
  }

  const payload: DeleteJsonPayload = {
    kind: 'locales-delete',
    targets,
    deletedJson,
    deletedMeta,
    aborted: false,
    supportsAutoPatching: false,
  };

  return { payload, issues: [], deletedTargets };
}
