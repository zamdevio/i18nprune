import path from 'node:path';
import { resolveContext, createCliCoreContext } from '@/shared/context/index.js';
import { configPathForContext } from '@/shared/config/paths.js';
import { cliReadinessIssues } from '@/shared/project/index.js';
import { printCommandSummary } from '@/output/index.js';
import { applyCliCiExitGate } from '@/shared/cli/ciExitGate.js';
import type { Issue } from '@i18nprune/core';
import type { Context } from '@/types/core/context/index.js';
import type { KitsCommandId } from '@/constants/commandInvocation.js';
import { kitsCommandLabel } from '@/constants/commandInvocation.js';
import { finishKitsRun } from '@/commands/kits/lib/emit.js';

export type KitsBundle = {
  ctx: Context;
  coreCtx: ReturnType<typeof createCliCoreContext>;
  projectRoot: string;
};

/**
 * Resolve CLI context for kits. Does **not** run readiness — call
 * {@link assertKitsReadiness} immediately after (same pattern as validate/quality).
 */
export async function resolveKitsBundle(): Promise<KitsBundle> {
  const ctx = await resolveContext();
  const coreCtx = createCliCoreContext(ctx);
  const configPath = configPathForContext();
  const projectRoot = configPath ? path.dirname(configPath) : process.cwd();
  return { ctx, coreCtx, projectRoot };
}

/**
 * Project readiness for kits (config + source locale + locales dir + src root).
 * Returns blocking issues, or `null` when the workspace is ready.
 */
export function kitsReadinessIssues(ctx: Context): Issue[] | null {
  return cliReadinessIssues(ctx, { mode: 'preset', preset: 'kits' });
}

/**
 * If readiness fails, emit JSON/human failure like validate and return `false`.
 * Callers should `return` early when this is `false`.
 */
export function assertKitsReadiness<K extends KitsCommandId, D>(
  commandId: K,
  bundle: KitsBundle,
  emptyData: D,
  summaryCounts?: Record<string, number>,
): boolean {
  const readiness = kitsReadinessIssues(bundle.ctx);
  if (!readiness) return true;

  if (bundle.ctx.run.json) {
    finishKitsRun(commandId, bundle.ctx, {
      data: emptyData,
      issues: readiness,
      ok: false,
      summaryCounts,
    });
  } else {
    printCommandSummary(
      {
        command: kitsCommandLabel(commandId),
        ok: false,
        counts: summaryCounts ?? {},
        issues: readiness,
      },
      bundle.ctx,
    );
  }
  applyCliCiExitGate(false);
  return false;
}
