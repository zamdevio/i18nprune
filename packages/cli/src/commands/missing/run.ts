import { confirm } from '@inquirer/prompts';
import { createCliCoreContext, resolveContext } from '@/shared/context/index.js';
import { getCliYesFlag } from '@/shared/context/globals.js';
import { resolveMissingHumanDefaultTop } from '@/commands/missing/summary.js';
import { resolveCliListWindow } from '@/shared/context/listWindow.js';
import {
  emitMissingPathsPreview,
  emitMissingPlaceholderLeavesPreview,
  emitMissingTargetActionMessage,
  emitMissingTargetWriteIntro,
  I18nPruneError,
  noopRunEmitter,
  resolveMissingLeafPlaceholder,
  writeMissingPaths,
} from '@i18nprune/core';
import { printCommandSummary } from '@/output/index.js';
import { stringifyEnvelope } from '@i18nprune/core';
import { executeCore, runMissingJsonEnvelope } from '@/commands/missing/jsonEnvelope.js';
import { canAsk } from '@/shared/ask/index.js';
import { createCliRunEmitter } from '@/shared/run/renderRunEvent.js';
import type { I18nPruneConfig } from '@i18nprune/core/config';
import type { MissingOptions } from '@/types/command/missing/index.js';
import type { MissingPathDisplayOpts } from '@/types/command/missing/summary.js';
import { attachWallTimer, duringPrompt } from '@/utils/timer/index.js';
import { applyCliCiExitGate } from '@/shared/cli/ciExitGate.js';
import type { RunEmitter } from '@i18nprune/core';

function resolveMissingData(
  ctx: Awaited<ReturnType<typeof resolveContext>>,
  opts: MissingOptions,
  runtime: { emit?: RunEmitter; runId?: string } = {},
): ReturnType<typeof executeCore> {
  return executeCore(ctx, opts, runtime);
}

export async function missing(opts: MissingOptions): Promise<void> {
  assertMissingTop(opts);
  const wall = attachWallTimer();
  try {
    const runId = String(Date.now());
    const ctx = await resolveContext();
    const { run } = ctx;
    const emit = createCliRunEmitter(run);
    const runtime = { emit, runId };

    if (run.json) {
      const { envelope } = runMissingJsonEnvelope(ctx, opts, { emit: noopRunEmitter, runId }, {
        applyWrites: getCliYesFlag(),
      });
      console.log(stringifyEnvelope(envelope));
      applyCliCiExitGate(envelope.ok);
      return;
    }

    const display = missingDisplayOpts(opts, ctx.config);

    const resolved = resolveMissingData(ctx, opts, runtime);
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
        emitMissingTargetActionMessage(runtime, entry, 'would_add', missingPlaceholder);
        emitMissingPathsPreview(runtime, { paths: entry.toAdd, fullList: display.fullList, top: display.top });
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
      emitMissingTargetActionMessage(runtime, entry, 'will_add');
      emitMissingPathsPreview(runtime, { paths: entry.toAdd, fullList: display.fullList, top: display.top });

      if (canAsk(run) && !getCliYesFlag()) {
        const preview =
          missingPlaceholder === '' ? 'empty string values' : `placeholder ${JSON.stringify(missingPlaceholder)}`;
        const ok = await duringPrompt(() =>
          confirm({
            message: `Add ${String(entry.toAdd.length)} key path(s) with ${preview} to ${entry.target.targetPath}?`,
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
        paths: entry.toAdd,
        placeholder: missingPlaceholder,
      });
      added += entry.toAdd.length;
      filesWritten += 1;

      emitMissingTargetActionMessage(runtime, entry, 'added');
      emitMissingPathsPreview(runtime, { paths: entry.toAdd, fullList: display.fullList, top: display.top });
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

function assertMissingTop(opts: MissingOptions): void {
  if (opts.top === undefined) return;
  if (typeof opts.top !== 'number' || !Number.isInteger(opts.top) || opts.top < 1) {
    throw new I18nPruneError('missing: top must be a positive integer', 'USAGE');
  }
}

function missingDisplayOpts(opts: MissingOptions, config: I18nPruneConfig): MissingPathDisplayOpts {
  const window = resolveCliListWindow(config, {
    top: opts.top ?? resolveMissingHumanDefaultTop(config),
    full: opts.full === true,
  });
  return { fullList: window.full, top: window.limit };
}
