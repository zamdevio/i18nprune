import { buildPatchingSectionIncompleteDiagnostic, runPatching } from '@i18nprune/core';
import type { PatchingAction, PatchingCommandName, PatchingLocaleRecord, PatchingResult } from '@i18nprune/core';
import { getDisplaySourceLocaleCode } from '@/shared/locales/index.js';
import { getCliGlobalOverrides } from '@/shared/context/globals.js';
import { patchingNotAppliedMessage, PATCH_INSPECT_THEN_FIX } from '@/shared/patching/guidance.js';
import { resolvePatchingProjectRoot } from '@/shared/patching/scaffoldI18nLayout.js';
import { logger } from '@/utils/logger/index.js';
import type { Context } from '@/types/core/context/index.js';

type ApplyCommandPatchingInput = {
  ctx: Context;
  command: PatchingCommandName;
  action: PatchingAction;
  localeCodes: string[];
  upsertLocaleRecords?: readonly PatchingLocaleRecord[];
};

function asWarnMessages(result: PatchingResult): string[] {
  return result.diagnostics
    .filter((d) => d.severity !== 'info')
    .map((d) => `patching: ${d.message}`);
}

/**
 * Best-effort patching integration for write commands.
 * Default mode is warn-and-skip; strict mode can escalate via config.
 */
export async function applyCommandPatching(input: ApplyCommandPatchingInput): Promise<PatchingResult | undefined> {
  const { ctx, command, action, localeCodes, upsertLocaleRecords } = input;
  if (localeCodes.length === 0) return undefined;
  if (getCliGlobalOverrides().patch !== true) {
    logger.info(patchingNotAppliedMessage(command), ctx.run);
    return undefined;
  }

  const incomplete = buildPatchingSectionIncompleteDiagnostic(ctx.config.patching, { effectiveWantsRun: true });
  if (incomplete) {
    logger.warn(`${incomplete.message} (${command} --patch skipped).`, ctx.run);
    ctx.meta.warnings.push(incomplete.message);
    return undefined;
  }

  const out = await runPatching({
    command,
    action,
    changedLocaleCodes: localeCodes,
    upsertLocaleRecords,
    sourceLocaleCode: getDisplaySourceLocaleCode(ctx),
    config: ctx.config.patching,
    runtime: { fs: ctx.adapters.fs, path: ctx.adapters.path },
    projectRoot: resolvePatchingProjectRoot(ctx),
  });
  for (const msg of asWarnMessages(out)) {
    ctx.meta.warnings.push(msg);
  }
  if (out.applied) {
    logger.info(
      `patching (${command}): applied ${String(out.changedFiles.length)} file update(s) for ${String(localeCodes.length)} locale code(s).`,
      ctx.run,
    );
  } else if (out.skipped) {
    logger.info(
      `patching (${command}): no changes applied (${out.skipReason ?? 'no_changes'}). ${PATCH_INSPECT_THEN_FIX}`,
      ctx.run,
    );
  }
  return out;
}
