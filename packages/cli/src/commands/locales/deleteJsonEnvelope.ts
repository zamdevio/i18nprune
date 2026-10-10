/**
 * Reusable, non-interactive core of **`i18nprune locales delete`**.
 *
 * The CLI command (`./delete.ts`) keeps its prompts, human summary, and `process.exitCode` handling;
 * this entry is the part a non-interactive host (the `serve` transport) needs: resolve targets,
 * delete the locale segment files, run best-effort patching, and return a stable `locales-delete`
 * envelope plus the absolute paths that were deleted (for cache invalidation).
 *
 * Mirrors the CLI's `--json` branch — same envelope kind, payload shape, and issue handling — so a
 * serve client sees the same result the CLI would print.
 */

import {
  buildCliJsonEnvelope,
  deleteLocaleFiles,
  existsRuntimeFsSync,
  I18nPruneError,
  segmentsForLocaleCode,
  type CliJsonEnvelope,
  type DeleteTargetResult,
} from '@i18nprune/core';
import { resolveLocalesTargetCodes } from '@/shared/locales/index.js';
import { createCliCoreContext } from '@/shared/context/coreContext.js';
import { cliReadinessIssues } from '@/shared/project/index.js';
import { applyCommandPatching } from '@/shared/patching/apply.js';
import {
  buildIoReadFailureEnvelope,
  isLocaleTargetMissingMessage,
  issuesFromDiscoveryWarnings,
  issuesFromLocaleTargetMissing,
  issuesFromLocalesUsage,
  mergeIssues,
} from '@/shared/result/index.js';
import { cliEnvelopeCwd } from '@/shared/result/envelopeCwd.js';
import type { Context } from '@/types/core/context/index.js';
import type { LocalesDeleteJsonPayload } from '@/types/command/locales/json.js';
import type { LocalesDeleteOptions } from '@/types/commands/locales/index.js';

export function emptyLocalesDeletePayload(targets: string[] = []): LocalesDeleteJsonPayload {
  return {
    kind: 'locales-delete',
    targets,
    deletedJson: 0,
    deletedLocaleCount: 0,
    aborted: false,
    supportsAutoPatching: false,
  };
}

export type LocalesDeleteRunResult = {
  envelope: CliJsonEnvelope<'locales-delete', LocalesDeleteJsonPayload>;
  /** Absolute paths removed from disk (empty on failure / no-op). For cache invalidation. */
  deletedPaths: string[];
  /** Per-target detail (segment paths) the interactive CLI human output renders. */
  deletedTargets: DeleteTargetResult[];
};

/**
 * Delete the locale files for `opts.target`. Non-interactive: a missing target is a USAGE issue
 * envelope, not a prompt. Never throws.
 */
export async function executeLocalesDelete(
  ctx: Context,
  opts: LocalesDeleteOptions,
): Promise<LocalesDeleteRunResult> {
  const discovery = issuesFromDiscoveryWarnings(ctx.meta.warnings);
  const readiness = cliReadinessIssues(ctx, { mode: 'preset', preset: 'locales-delete' });
  if (readiness) {
    return {
      envelope: buildCliJsonEnvelope('locales-delete', emptyLocalesDeletePayload(), {
        ok: false,
        issues: mergeIssues(discovery, readiness),
        cwd: cliEnvelopeCwd(ctx),
      }),
      deletedPaths: [],
      deletedTargets: [],
    };
  }

  let targets: string[];
  try {
    targets = await resolveLocalesTargetCodes(ctx, 'locales delete', opts.target, {
      promptWhenMissing: false,
    });
  } catch (err) {
    return { envelope: failureEnvelope(ctx, err), deletedPaths: [], deletedTargets: [] };
  }
  return deleteResolvedLocales(ctx, targets);
}

/**
 * Delete already-resolved targets. Shared by {@link executeLocalesDelete} (targets resolved from a
 * selector) and the interactive CLI command (targets resolved + confirmed first). Never throws.
 */
export async function deleteResolvedLocales(
  ctx: Context,
  targets: string[],
): Promise<LocalesDeleteRunResult> {
  const discovery = issuesFromDiscoveryWarnings(ctx.meta.warnings);
  const coreCtx = createCliCoreContext(ctx);
  const dir = ctx.paths.localesDir;
  try {
    // Existence check: fail with a USAGE issue rather than silently deleting nothing.
    const deletedPaths: string[] = [];
    for (const target of targets) {
      const segments = segmentsForLocaleCode(coreCtx, target);
      const paths =
        segments.length > 0
          ? segments.map((s) => s.absolutePath)
          : [ctx.adapters.path.join(dir, `${target}.json`)];
      const existing = paths.filter((p) => existsRuntimeFsSync(p, ctx.adapters.fs));
      if (existing.length === 0) {
        throw new I18nPruneError(`locales delete: no locale files found for ${target}`, 'USAGE');
      }
      deletedPaths.push(...existing);
    }

    const { payload, deletedTargets } = await deleteLocaleFiles(coreCtx, targets);
    await applyCommandPatching({
      ctx,
      command: 'locales-delete',
      action: 'delete_locales',
      localeCodes: targets,
    });

    return {
      envelope: buildCliJsonEnvelope('locales-delete', payload, {
        ok: true,
        issues: discovery,
        cwd: cliEnvelopeCwd(ctx),
      }),
      deletedPaths,
      deletedTargets,
    };
  } catch (err) {
    return { envelope: failureEnvelope(ctx, err), deletedPaths: [], deletedTargets: [] };
  }
}

/** Build the failure envelope for a locales-delete error (USAGE issues, else IO-read failure). */
function failureEnvelope(ctx: Context, err: unknown): CliJsonEnvelope<'locales-delete', LocalesDeleteJsonPayload> {
  const discovery = issuesFromDiscoveryWarnings(ctx.meta.warnings);
  const message = err instanceof Error ? err.message : String(err);
  const usageIssues = isLocaleTargetMissingMessage(message)
    ? issuesFromLocaleTargetMissing(message)
    : err instanceof I18nPruneError && err.code === 'USAGE'
      ? issuesFromLocalesUsage(message)
      : [];
  const envelope =
    usageIssues.length > 0
      ? buildCliJsonEnvelope('locales-delete', emptyLocalesDeletePayload(), {
          ok: false,
          issues: mergeIssues(discovery, usageIssues),
          cwd: cliEnvelopeCwd(ctx),
        })
      : buildIoReadFailureEnvelope('locales-delete', emptyLocalesDeletePayload(), ctx, err);
  return envelope as CliJsonEnvelope<'locales-delete', LocalesDeleteJsonPayload>;
}
