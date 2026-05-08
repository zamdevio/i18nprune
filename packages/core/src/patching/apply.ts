import type { PatchingDiagnostic, PatchingFileEdit, PatchingPlan, PatchingRunInput } from '../types/patching/index.js';
import { toMessage } from './utils.js';

export async function applyPatchPlanAtomic(
  runtime: PatchingRunInput['runtime'],
  plan: PatchingPlan,
): Promise<
  { ok: true; changedFiles: string[]; diagnostics: PatchingDiagnostic[] } | { ok: false; changedFiles: string[]; diagnostics: PatchingDiagnostic[] }
> {
  const changedFiles: string[] = [];
  const committed: PatchingFileEdit[] = [];
  try {
    for (const edit of plan.edits) {
      await Promise.resolve(runtime.fs.writeText(edit.path, edit.after));
      committed.push(edit);
      changedFiles.push(edit.path);
    }
    return {
      ok: true,
      changedFiles,
      diagnostics: [
        {
          severity: 'info',
          code: 'i18nprune.patching.applied',
          message: `patching: applied ${String(changedFiles.length)} file edit(s)`,
          docPath: 'patching/README',
        },
      ],
    };
  } catch (err) {
    const diagnostics: PatchingDiagnostic[] = [
      {
        severity: 'warn',
        code: 'i18nprune.patching.apply_failed',
        message: `patching: failed to apply plan: ${toMessage(err)}`,
        docPath: 'patching/README',
      },
    ];
    for (let i = committed.length - 1; i >= 0; i--) {
      const edit = committed[i]!;
      try {
        await Promise.resolve(runtime.fs.writeText(edit.path, edit.before));
      } catch (rollbackErr) {
        diagnostics.push({
          severity: 'error',
          code: 'i18nprune.patching.rollback_failed',
          message: `patching: rollback failed for ${edit.path}: ${toMessage(rollbackErr)}`,
          docPath: 'patching/README',
        });
      }
    }
    return { ok: false, changedFiles, diagnostics };
  }
}
