import path from 'node:path';
import { resolveContext } from '@/core/context/index.js';
import { scanProjectDynamicKeySites } from '@/core/dynamic/index.js';
import { mergeToTemplateShape, pruneToTemplateShape } from '@/core/json/index.js';
import { readJsonFile, writeJsonFile, listJsonBasenamesInDir } from '@/utils/fs/index.js';
import { assertNotSourceTargetLocale } from '@/core/locales/source.js';
import { printSyncHumanSummary, type SyncFileLine } from '@/commands/sync/summary.js';
import { printCommandSummary } from '@/core/output/index.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintDetail } from '@/utils/logger/policy.js';
import { parseSyncLangSelection } from '@/utils/cli/args.js';
import { finalizeReportFile, pushReportEntry } from '@/utils/report/index.js';
import type { SyncOptions } from '@/types/command/sync/index.js';

export async function sync(opts: SyncOptions): Promise<void> {
  const started = Date.now();
  const ctx = resolveContext();
  const dynamicSites = scanProjectDynamicKeySites(ctx);
  const sourcePath = ctx.paths.sourceLocale;
  const template = readJsonFile(sourcePath);
  const sourceBase = path.basename(sourcePath, '.json');
  const dir = ctx.paths.localesDir;
  const allTargets = listJsonBasenamesInDir(dir).filter((f) => f !== `${sourceBase}.json`);

  const sel = parseSyncLangSelection(opts.lang);
  let targets: string[];
  if (sel.mode === 'all') {
    targets = allTargets;
  } else {
    for (const code of sel.codes) {
      assertNotSourceTargetLocale('sync', code, sourcePath, ctx);
    }
    targets = sel.codes
      .map((c) => `${c}.json`)
      .filter((f) => allTargets.includes(f));
    const missing = sel.codes.filter((c) => !allTargets.includes(`${c}.json`));
    if (missing.length > 0 && canPrintDetail(ctx.run)) {
      logger.warn(
        `sync: locale file(s) not found (skipped): ${missing.map((m) => `${m}.json`).join(', ')}`,
        ctx.run,
      );
    }
  }

  let updated = 0;
  if (!ctx.run.json && dynamicSites.length > 0) {
    logger.warn(
      `${String(dynamicSites.length)} translation call(s) use a non-literal key — sync only aligns JSON shapes; dynamic keys are not enumerated.`,
    );
  }

  const fileLines: SyncFileLine[] = [];

  for (const file of targets) {
    const full = path.join(dir, file);
    const cur = readJsonFile(full);
    let next = mergeToTemplateShape(template, cur, ctx.config.policies?.preserve);
    next = pruneToTemplateShape(template, next);
    const wouldChange = JSON.stringify(cur) !== JSON.stringify(next);

    if (opts.dryRun) {
      if (canPrintDetail(ctx.run) && wouldChange) {
        logger.detail(`would write ${full}`, ctx.run);
      }
      fileLines.push({ path: full, changed: wouldChange });
      continue;
    }
    if (wouldChange) {
      writeJsonFile(full, next);
      updated += 1;
    }
    fileLines.push({ path: full, changed: wouldChange });
  }

  const durationMs = Date.now() - started;

  printCommandSummary(
    {
      command: 'sync',
      ok: true,
      durationMs,
      counts: { files: targets.length, written: updated, dynamic: dynamicSites.length },
    },
    ctx,
  );

  printSyncHumanSummary(
    {
      sourcePath,
      localesDir: dir,
      files: fileLines,
      dynamicSiteCount: dynamicSites.length,
      dryRun: Boolean(opts.dryRun),
      durationMs,
    },
    ctx.run,
  );

  pushReportEntry({
    level: 'info',
    command: 'sync',
    message: 'sync completed',
    data: {
      targets: targets.length,
      written: updated,
      dynamicSites: dynamicSites.length,
      dryRun: Boolean(opts.dryRun),
    },
  });
  finalizeReportFile(ctx.config, {
    command: 'sync',
    ok: true,
    durationMs,
    counts: { files: targets.length, written: updated, dynamic: dynamicSites.length },
  });
}
