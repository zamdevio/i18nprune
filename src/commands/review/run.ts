import path from 'node:path';
import { resolveContext } from '@/core/context/index.js';
import { collectStringLeaves } from '@/core/json/index.js';
import { isParityExcluded } from '@/core/parity/index.js';
import { readJsonFile, listJsonBasenamesInDir } from '@/utils/fs/index.js';
import { printCommandSummary } from '@/core/output/index.js';
import { logger } from '@/utils/logger/index.js';

/** Locale-level review: leaf counts + English-identical counts (expand toward CepatEdge-style locale review). */
export async function runReviewCommand(opts: { lang?: string }): Promise<void> {
  const started = Date.now();
  const ctx = resolveContext();
  const { run } = ctx;
  const sourcePath = ctx.paths.sourceLocale;
  const sourceRaw = readJsonFile(sourcePath);
  const sourceLeaves = collectStringLeaves(sourceRaw);
  const sourceMap = new Map(sourceLeaves.map((l) => [l.path, l.value]));
  const sourceBase = path.basename(sourcePath, '.json');
  const dir = ctx.paths.localesDir;
  const files = listJsonBasenamesInDir(dir).filter((f) => f !== `${sourceBase}.json`);
  const filtered = opts.lang
    ? files.filter((f) => path.basename(f, '.json') === opts.lang)
    : files;

  const locales: Record<
    string,
    { stringPaths: number; englishIdentical: number }
  > = {};

  for (const file of filtered) {
    const full = path.join(dir, file);
    const targetRaw = readJsonFile(full);
    const tLeaves = collectStringLeaves(targetRaw);
    let englishIdentical = 0;
    for (const leaf of tLeaves) {
      const srcVal = sourceMap.get(leaf.path);
      if (srcVal === undefined) continue;
      if (isParityExcluded(leaf.path, leaf.value, ctx.config.policies?.parity)) continue;
      if (leaf.value === srcVal) englishIdentical += 1;
    }
    locales[file] = {
      stringPaths: tLeaves.length,
      englishIdentical,
    };
  }

  const report = {
    kind: 'localeReview' as const,
    sourceLocale: sourceBase,
    localesDir: ctx.paths.localesDir,
    locales,
  };

  if (run.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  logger.info(`Review: ${String(Object.keys(locales).length)} locale file(s) (vs ${sourceBase})`, run);
  for (const [f, v] of Object.entries(locales)) {
    logger.detail(`  ${f}: ${String(v.stringPaths)} paths · ${String(v.englishIdentical)} English-identical`, run);
  }

  printCommandSummary(
    { command: 'review', ok: true, durationMs: Date.now() - started },
    ctx,
  );
}
