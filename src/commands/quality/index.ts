import path from 'node:path';
import { resolveContext } from '@/core/context/index.js';
import { collectStringLeaves } from '@/core/json/index.js';
import { isParityExcluded } from '@/core/parity/index.js';
import { readJsonFile, listJsonBasenamesInDir } from '@/utils/fs/index.js';
import { printCommandSummary } from '@/core/output/index.js';
import { logger } from '@/utils/logger/index.js';

export async function quality(opts: { lang?: string }): Promise<void> {
  const started = Date.now();
  const ctx = resolveContext();
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

  const perFile: Record<string, number> = {};
  let total = 0;
  for (const file of filtered) {
    const full = path.join(dir, file);
    const targetRaw = readJsonFile(full);
    const tLeaves = collectStringLeaves(targetRaw);
    let n = 0;
    for (const leaf of tLeaves) {
      const srcVal = sourceMap.get(leaf.path);
      if (srcVal === undefined) continue;
      if (isParityExcluded(leaf.path, leaf.value, ctx.config.policies?.parity)) continue;
      if (leaf.value === srcVal) n += 1;
    }
    perFile[file] = n;
    total += n;
  }

  if (ctx.run.json) {
    console.log(JSON.stringify({ total, perFile }));
    return;
  }
  logger.info(`English-identical leaves (value equals source): ${String(total)}`);
  for (const [f, c] of Object.entries(perFile)) {
    if (c > 0) logger.detail(`  ${f}: ${String(c)}`);
  }
  printCommandSummary(
    { command: 'quality', ok: true, durationMs: Date.now() - started, counts: { total } },
    ctx,
  );
}
