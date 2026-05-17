import { existsRuntimeFsSync, resolvePatchingConfigLocales } from '@i18nprune/core';
import type { RepairPatchingConfigLocalesResult, RuntimeFsPort, RunOptions } from '@i18nprune/core';
import type { I18nPruneConfig } from '@i18nprune/core/config';
import { buildInconsistencyPreview } from '@/shared/patching/inconsistencyPreview.js';
import { decideInconsistencyApply, formatPreviewLines } from '@/shared/patching/inconsistencyPolicy.js';
import { logger } from '@/utils/logger/index.js';

export async function repairPatchingConfigLocales(input: {
  config: I18nPruneConfig;
  configPath: string;
  run: RunOptions;
  fs: RuntimeFsPort;
  top?: number;
  full?: boolean;
  fix?: boolean;
}): Promise<RepairPatchingConfigLocalesResult> {
  const { config, configPath, run, fs, top, full, fix } = input;
  if (!existsRuntimeFsSync(configPath, fs))
    return { detectedCount: 0, autofilledCount: 0, correctedCount: 0, skipped: false };
  const before = await Promise.resolve(fs.readText(configPath));
  const resolved = resolvePatchingConfigLocales(before, { applyCatalogMismatches: false });
  if (!resolved.ok) {
    return {
      detectedCount: 0,
      autofilledCount: 0,
      correctedCount: 0,
      skipped: false,
      metadataRepairBlocked: resolved.error,
    };
  }

  const pendingAutofillCount = resolved.autofilled.length;
  const pendingMismatchCount = resolved.mismatches.length;
  const pendingTotal = pendingAutofillCount + pendingMismatchCount;
  if (pendingTotal === 0) {
    return { detectedCount: 0, autofilledCount: 0, correctedCount: 0, skipped: false };
  }
  const preview = buildInconsistencyPreview({
    config,
    top,
    full,
    autofilled: resolved.autofilled,
    mismatches: resolved.mismatches,
  });
  const decision = await decideInconsistencyApply({
    run,
    fix: fix === true,
    total: preview.total,
    shownLines: preview.shown,
    remaining: preview.remaining,
    autofilledCount: pendingAutofillCount,
    mismatchCount: pendingMismatchCount,
  });
  if (!decision.apply) {
    return { detectedCount: pendingTotal, autofilledCount: 0, correctedCount: 0, skipped: decision.skipped };
  }
  const previewLines = formatPreviewLines(preview.shown, preview.remaining);
  logger.info(`patch --fix: applying ${String(pendingTotal)} suggested locale metadata correction(s).`, run);
  for (const line of previewLines) logger.detail(line, run);

  const corrected = resolvePatchingConfigLocales(before, { applyCatalogMismatches: true });
  if (!corrected.ok) return { detectedCount: pendingTotal, autofilledCount: 0, correctedCount: 0, skipped: false };
  if (corrected.nextConfigText !== before) {
    await Promise.resolve(fs.writeText(configPath, corrected.nextConfigText));
  }
  return {
    detectedCount: pendingTotal,
    autofilledCount: corrected.autofilled.length,
    correctedCount: corrected.mismatches.length,
    skipped: false,
  };
}
