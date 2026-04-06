import { resolveContext } from '@/core/context/index.js';
import { collectStringLeaves } from '@/core/json/index.js';
import { exactLiteralKeys } from '@/core/extractor/index.js';
import { analyzeDynamicKeysFromSourceText } from '@/core/dynamic/index.js';
import { buildConstStringMap } from '@/core/constmap/index.js';
import { scanSources } from '@/core/scanner/index.js';
import { readJsonFile } from '@/utils/fs/index.js';
import { printCommandSummary } from '@/core/output/index.js';
import { logger } from '@/utils/logger/index.js';
import type { ValidateOptions } from '@/types/command/validate/index.js';

export async function validate(_opts: ValidateOptions): Promise<void> {
  const started = Date.now();
  const ctx = resolveContext();
  const raw = readJsonFile(ctx.paths.sourceLocale);
  const leaves = collectStringLeaves(raw);
  const keySet = new Set(leaves.map((l) => l.path));
  const { text } = scanSources(ctx.paths.srcRoot);
  const constMap = buildConstStringMap(text);
  const used = exactLiteralKeys(text, ctx.config.functions, constMap);
  const dynamicSites = analyzeDynamicKeysFromSourceText(text, ctx.config.functions);
  const missing = [...used].filter((k) => !keySet.has(k));
  if (ctx.run.json) {
    console.log(
      JSON.stringify({
        missing,
        count: missing.length,
        dynamic: {
          count: dynamicSites.length,
          sites: dynamicSites.slice(0, 200),
        },
      }),
    );
    return;
  }
  if (dynamicSites.length > 0) {
    logger.warn(
      `${String(dynamicSites.length)} translation call(s) use a non-literal key — not validated as static keys:`,
    );
    for (const d of dynamicSites.slice(0, 20)) {
      logger.detail(`  [${d.kind}] ${d.functionName}: ${d.preview}`);
    }
    if (dynamicSites.length > 20) {
      logger.detail(`  … and ${String(dynamicSites.length - 20)} more`);
    }
  }
  if (missing.length === 0) {
    logger.info('All scanned literal keys exist in source JSON.');
  } else {
    logger.warn(`${String(missing.length)} key(s) in code missing from source JSON:`);
    for (const m of missing.slice(0, 50)) logger.detail(`  ${m}`);
    if (missing.length > 50) logger.detail(`  … and ${String(missing.length - 50)} more`);
  }
  printCommandSummary(
    {
      command: 'validate',
      ok: missing.length === 0,
      durationMs: Date.now() - started,
      counts: { missing: missing.length, dynamic: dynamicSites.length },
    },
    ctx,
  );
}
