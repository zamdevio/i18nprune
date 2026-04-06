import path from 'node:path';
import { confirm } from '@inquirer/prompts';
import { resolveContext } from '@/core/context/index.js';
import { getCliYesFlag } from '@/core/context/globals.js';
import { I18nPruneError } from '@/core/errors/index.js';
import { collectStringLeaves, deleteAtPath } from '@/core/json/index.js';
import { exactLiteralKeys, usedRootsFromText } from '@/core/extractor/index.js';
import { buildConstStringMap } from '@/core/constmap/index.js';
import { scanSources } from '@/core/scanner/index.js';
import { isPreservePath } from '@/core/parity/index.js';
import { readJsonFile, writeJsonFile, listJsonBasenamesInDir } from '@/utils/fs/index.js';
import { isRipgrepAvailable, rgFixedStringSearch, printRipgrepInstallHint } from '@/utils/rg/index.js';
import { printCommandSummary } from '@/core/output/index.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintInfo, canPrintDetail } from '@/utils/logger/policy.js';
import { canPromptGenerate } from '@/commands/generate/prompts.js';
import { finalizeReportFile, pushReportEntry } from '@/utils/report/index.js';
import type { CleanupOptions } from '@/types/command/cleanup/index.js';

function pathUnderRoot(key: string, roots: Set<string>): boolean {
  for (const r of roots) {
    if (key === r || key.startsWith(`${r}.`) || key.startsWith(`${r}[`)) return true;
  }
  return false;
}

export async function cleanup(opts: CleanupOptions): Promise<void> {
  const started = Date.now();
  const ctx = resolveContext();
  if (canPrintInfo(ctx.run)) {
    logger.info('cleanup: scanning source locale and project sources for unused key paths…', ctx.run);
  }
  const sourcePath = ctx.paths.sourceLocale;
  const sourceRaw = readJsonFile(sourcePath);
  const leaves = collectStringLeaves(sourceRaw);
  const allKeys = new Set(leaves.map((l) => l.path));
  const { text } = scanSources(ctx.paths.srcRoot);
  const constMap = buildConstStringMap(text);
  const exact = exactLiteralKeys(text, ctx.config.functions, constMap);
  const roots = usedRootsFromText(text, ctx.config.functions, constMap);
  const used = new Set<string>();
  for (const k of allKeys) {
    if (exact.has(k)) used.add(k);
    else if (pathUnderRoot(k, roots)) used.add(k);
  }
  const unused = [...allKeys].filter((k) => !used.has(k));
  const preserve = ctx.config.policies?.preserve;
  const candidates = unused.filter((k) => !isPreservePath(k, preserve));

  const rgOk = opts.skipRg ? false : isRipgrepAvailable();
  if (!opts.skipRg && !rgOk) printRipgrepInstallHint();
  if (canPrintInfo(ctx.run)) {
    logger.info(
      `cleanup: ${String(allKeys.size)} key path(s) in source JSON · ${String(candidates.length)} unused candidate(s) after preserve rules`,
      ctx.run,
    );
  }

  const safeToRemove: string[] = [];
  for (const key of candidates) {
    const sample = leaves.find((l) => l.path === key)?.value ?? key;
    if (!rgOk) {
      safeToRemove.push(key);
      continue;
    }
    const hit = rgFixedStringSearch(ctx.paths.srcRoot, sample);
    if (!hit) safeToRemove.push(key);
    else if (canPrintDetail(ctx.run)) {
      logger.detail(`cleanup: skipping key (rg found source match for sample text): ${key}`, ctx.run);
    }
  }

  if (opts.checkOnly || ctx.run.json) {
    if (ctx.run.json) {
      console.log(JSON.stringify({ wouldRemove: safeToRemove.length, keys: safeToRemove }));
    } else {
      logger.info(`Would remove ${String(safeToRemove.length)} unused path(s) (check-only)`, ctx.run);
    }
    printCommandSummary(
      {
        command: 'cleanup',
        ok: true,
        durationMs: Date.now() - started,
        counts: { remove: safeToRemove.length },
      },
      ctx,
    );
    pushReportEntry({
      level: 'info',
      command: 'cleanup',
      message: 'check-only',
      data: { remove: safeToRemove.length },
    });
    finalizeReportFile(ctx.config, {
      command: 'cleanup',
      ok: true,
      durationMs: Date.now() - started,
      counts: { remove: safeToRemove.length },
    });
    return;
  }

  if (safeToRemove.length === 0) {
    if (canPrintInfo(ctx.run)) {
      logger.info('cleanup: nothing to remove (no unused keys after filters).', ctx.run);
    }
    printCommandSummary(
      {
        command: 'cleanup',
        ok: true,
        durationMs: Date.now() - started,
        counts: { removedPaths: 0, filesWritten: 0 },
      },
      ctx,
    );
    finalizeReportFile(ctx.config, {
      command: 'cleanup',
      ok: true,
      durationMs: Date.now() - started,
      counts: { removedPaths: 0, filesWritten: 0 },
    });
    return;
  }

  if (canPromptGenerate(ctx.run) && !getCliYesFlag()) {
    const ok = await confirm({
      message: `Remove ${String(safeToRemove.length)} unused key path(s) from all locale JSON under ${ctx.paths.localesDir}?`,
      default: false,
    });
    if (!ok) {
      if (canPrintInfo(ctx.run)) logger.info('cleanup: aborted (no files changed).', ctx.run);
      printCommandSummary(
        {
          command: 'cleanup',
          ok: true,
          durationMs: Date.now() - started,
          notes: ['aborted: user declined confirmation'],
        },
        ctx,
      );
      return;
    }
  } else if (!canPromptGenerate(ctx.run) && !getCliYesFlag()) {
    throw new I18nPruneError(
      'cleanup: destructive run requires global --yes when non-interactive (or use --check-only)',
      'USAGE',
    );
  }

  if (canPrintInfo(ctx.run)) {
    logger.warn(
      `cleanup: removing ${String(safeToRemove.length)} path(s) from locale files (this affects every locale JSON that still contains them).`,
      ctx.run,
    );
  }

  const dir = ctx.paths.localesDir;
  const files = listJsonBasenamesInDir(dir);
  let writes = 0;
  for (const file of files) {
    const full = path.join(dir, file);
    let data = readJsonFile(full);
    let dirty = false;
    for (const key of safeToRemove) {
      if (collectStringLeaves(data).some((l) => l.path === key)) {
        data = deleteAtPath(data, key);
        dirty = true;
      }
    }
    if (dirty) {
      writeJsonFile(full, data);
      writes += 1;
      if (canPrintDetail(ctx.run)) {
        logger.detail(`cleanup: wrote ${full}`, ctx.run);
      }
    }
  }

  if (canPrintInfo(ctx.run)) {
    logger.info(`cleanup: finished — ${String(writes)} file(s) updated on disk.`, ctx.run);
  }

  const durationMs = Date.now() - started;
  printCommandSummary(
    {
      command: 'cleanup',
      ok: true,
      durationMs,
      counts: { removedPaths: safeToRemove.length, filesWritten: writes },
    },
    ctx,
  );
  pushReportEntry({
    level: 'info',
    command: 'cleanup',
    message: 'cleanup completed',
    data: { removedPaths: safeToRemove.length, filesWritten: writes },
  });
  finalizeReportFile(ctx.config, {
    command: 'cleanup',
    ok: true,
    durationMs,
    counts: { removedPaths: safeToRemove.length, filesWritten: writes },
  });
}
