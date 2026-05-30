import { confirm } from '@inquirer/prompts';
import { createCliCoreContext, resolveContext } from '@/shared/context/index.js';
import { getCliYesFlag } from '@/shared/context/globals.js';
import { resolveCliListWindow } from '@/shared/context/listWindow.js';
import {
  emitMissingPlaceholderLeavesPreview,
  emitMissingTargetActionMessage,
  emitMissingTargetWriteIntro,
  I18nPruneError,
  noopRunEmitter,
  resolveMissingLeafPlaceholder,
  writeMissingPaths,
} from '@i18nprune/core';
import { printCommandSummary } from '@/output/index.js';
import { stringifyEnvelope, buildCliJsonEnvelope } from '@i18nprune/core';
import { executeCore, runMissingJsonEnvelope, emptyMissingPayload } from '@/commands/missing/jsonEnvelope.js';
import { canAsk } from '@/shared/ask/index.js';
import { createCliRunEmitter } from '@/shared/run/renderRunEvent.js';
import type { I18nPruneConfig } from '@i18nprune/core/config';
import type { MissingOptions } from '@/types/command/missing/index.js';
import type { MissingPathDisplayOpts } from '@/types/command/missing/summary.js';
import { attachWallTimer, duringPrompt } from '@/utils/timer/index.js';
import { applyCliCiExitGate } from '@/shared/cli/ciExitGate.js';
import { cliReadinessIssues } from '@/shared/project/index.js';
import { formatLocaleSegmentFilesLabel } from '@/shared/locales/segmentLabel.js';
import { logger } from '@/utils/logger/index.js';
import type { MissingTargetPlan, RunEmitter } from '@i18nprune/core';

function resolveMissingData(
  ctx: Awaited<ReturnType<typeof resolveContext>>,
  opts: MissingOptions,
  runtime: { emit?: RunEmitter; runId?: string } = {},
): ReturnType<typeof executeCore> {
  return executeCore(ctx, opts, runtime);
}

function missingListOpts(config: I18nPruneConfig): Pick<MissingOptions, 'top' | 'full'> {
  const window = resolveCliListWindow(config);
  return window.full ? { full: true } : { top: window.limit };
}

export async function missing(opts: MissingOptions): Promise<void> {
  const wall = attachWallTimer();
  try {
    const runId = String(Date.now());
    const ctx = await resolveContext();
    const { run } = ctx;
    const emit = createCliRunEmitter(run);
    const runtime = { emit, runId };
    const listOpts = missingListOpts(ctx.config);
    const coreOpts: MissingOptions = {
      target: opts.target,
      dryRun: opts.dryRun,
      ...listOpts,
    };

    const readiness = cliReadinessIssues(ctx, { mode: 'preset', preset: 'missing' });
    if (readiness) {
      if (run.json) {
        console.log(
          stringifyEnvelope(
            buildCliJsonEnvelope('missing', emptyMissingPayload(coreOpts), {
              ok: false,
              issues: readiness,
              cwd: ctx.adapters.system.cwd(),
            }),
          ),
        );
        applyCliCiExitGate(false);
        return;
      }
      if (readiness[0]) logger.warn(readiness[0].message, run);
      printCommandSummary(
        {
          command: 'missing',
          ok: false,
          durationMs: wall.elapsedMs(),
          counts: { added: 0, targets: 0, skippedTargets: 0 },
          issues: readiness,
        },
        ctx,
      );
      applyCliCiExitGate(false);
      return;
    }

    if (run.json) {
      const { envelope } = runMissingJsonEnvelope(ctx, coreOpts, { emit: noopRunEmitter, runId }, {
        applyWrites: getCliYesFlag(),
      });
      console.log(stringifyEnvelope(envelope));
      applyCliCiExitGate(envelope.ok);
      return;
    }

    const display = missingDisplayOpts(ctx.config);

    const resolved = resolveMissingData(ctx, coreOpts, runtime);
    const extractionBaseline = {
      dynamic: resolved.dynamicSites,
      keyObservations: resolved.keyObservationsCount,
    };
    const summaryIssues = resolved.envelope.issues;
    emitMissingPlaceholderLeavesPreview(runtime, {
      leaves: resolved.placeholderLeaves,
      fullList: display.fullList,
      top: display.top,
    });

    const plansWithAdds = resolved.targets.filter((entry) => entry.toAdd.length > 0);
    const totalToAdd = plansWithAdds.reduce((sum, entry) => sum + entry.toAdd.length, 0);

    if (totalToAdd === 0) {
      printCommandSummary(
        {
          command: 'missing',
          ok: true,
          durationMs: wall.elapsedMs(),
          counts: {
            added: 0,
            targets: resolved.targets.length,
            skippedTargets: resolved.skippedTargets.length,
          },
        issues: summaryIssues,
      },
      ctx,
    );
    applyCliCiExitGate(resolved.envelope.ok);
    return;
  }

    const missingPlaceholder = resolveMissingLeafPlaceholder(ctx.config.missing?.placeholder).placeholder;

    if (opts.dryRun) {
      for (const entry of plansWithAdds) {
        emitMissingTargetWriteIntro(runtime, entry);
        emitMissingTargetActionMessage(runtime, entry, 'would_add', missingPlaceholder, {
          fullList: display.fullList,
          top: display.top,
        });
      }
      printCommandSummary(
        {
          command: 'missing',
          ok: true,
          durationMs: wall.elapsedMs(),
          counts: {
            wouldAdd: totalToAdd,
            targets: plansWithAdds.length,
            skippedTargets: resolved.skippedTargets.length,
            ...extractionBaseline,
          },
        issues: summaryIssues,
      },
      ctx,
    );
    applyCliCiExitGate(resolved.envelope.ok);
    return;
  }

    if (!canAsk(run) && !getCliYesFlag()) {
      throw new I18nPruneError(
        'missing: non-interactive run requires global --yes to write files (or use --dry-run)',
        'USAGE',
      );
    }

    const coreCtx = createCliCoreContext(ctx);
    let added = 0;
    let filesWritten = 0;
    let declined = 0;

    for (const entry of plansWithAdds) {
      emitMissingTargetWriteIntro(runtime, entry);
      emitMissingTargetActionMessage(runtime, entry, 'will_add', undefined, {
        fullList: display.fullList,
        top: display.top,
      });

      if (canAsk(run) && !getCliYesFlag()) {
        const preview =
          missingPlaceholder === '' ? 'empty string values' : `placeholder ${JSON.stringify(missingPlaceholder)}`;
        const ok = await duringPrompt(() =>
          confirm({
            message: `Add ${String(entry.toAdd.length)} key path(s) with ${preview} to ${missingWriteTargetLabel(entry)}?`,
            default: false,
          }),
        );
        if (!ok) {
          declined += 1;
          emitMissingTargetActionMessage(runtime, entry, 'declined');
          continue;
        }
      }

      writeMissingPaths(coreCtx, {
        targetPath: entry.target.targetPath,
        localeJson: entry.target.localeJson,
        localeCode: entry.target.selectedLocaleCode,
        paths: entry.toAdd,
        placeholder: missingPlaceholder,
        writePlan: entry.writePlan,
      });
      added += entry.toAdd.length;
      filesWritten += entry.writePlan.length > 0 ? entry.writePlan.length : 1;

      emitMissingTargetActionMessage(runtime, entry, 'added', undefined, {
        fullList: display.fullList,
        top: display.top,
      });
    }

    printCommandSummary(
      {
        command: 'missing',
        ok: true,
        durationMs: wall.elapsedMs(),
        counts: {
          added,
          filesWritten,
          targets: plansWithAdds.length,
          skippedTargets: resolved.skippedTargets.length,
          ...extractionBaseline,
        },
        notes: declined > 0 ? [`skipped ${String(declined)} target(s): user declined confirmation`] : undefined,
        issues: summaryIssues,
      },
      ctx,
    );
    applyCliCiExitGate(resolved.envelope.ok);
  } finally {
    wall.dispose();
  }
}

function missingWriteTargetLabel(entry: MissingTargetPlan): string {
  if (entry.writePlan.length === 0) {
    return entry.target.targetDisplayPath ?? entry.target.targetPath;
  }
  if (entry.writePlan.length === 1) {
    return entry.writePlan[0]!.relativePath;
  }
  const localeCode = entry.target.selectedLocaleCode ?? 'locale';
  return formatLocaleSegmentFilesLabel(
    localeCode,
    entry.writePlan.map((w) => w.relativePath),
  );
}

function missingDisplayOpts(config: I18nPruneConfig): MissingPathDisplayOpts {
  const window = resolveCliListWindow(config);
  return { fullList: window.full, top: window.limit };
}
