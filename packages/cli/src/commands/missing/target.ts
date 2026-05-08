import path from 'node:path';
import { I18nPruneError } from '@i18nprune/core';
import { existsRuntimeFsSync } from '@i18nprune/core';
import { normalizeLanguageCode } from '@/shared/languages/index.js';
import { readHostJsonUnknown } from '@/shared/io/hostJson.js';
import type { Context } from '@/types/core/context/index.js';
import type { MissingOptions } from '@/types/command/missing/index.js';

export type MissingTargetState = {
  targetPath: string;
  targetKind: 'source' | 'locale';
  localeJson: unknown;
  selectedLocaleCode?: string;
};

/** Shared host-side target resolution for missing (JSON + human paths). */
export function resolveMissingTargetState(ctx: Context, opts: MissingOptions): MissingTargetState {
  const localesDir = ctx.paths.localesDir;
  const sourcePath = ctx.paths.sourceLocale;

  let targetPath: string;
  let targetKind: 'source' | 'locale';
  let selectedLocaleCode: string | undefined;

  const { fs } = ctx.adapters;
  if (opts.locale?.trim()) {
    selectedLocaleCode = normalizeLanguageCode(opts.locale.trim());
    if (!existsRuntimeFsSync(localesDir, fs)) {
      throw new I18nPruneError(`locales directory not found: ${localesDir}`, 'USAGE');
    }
    targetPath = path.join(localesDir, `${selectedLocaleCode}.json`);
    targetKind = 'locale';
  } else {
    if (!existsRuntimeFsSync(sourcePath, fs)) {
      throw new I18nPruneError(`Source locale file not found: ${sourcePath}`, 'USAGE');
    }
    targetPath = sourcePath;
    targetKind = 'source';
  }

  let localeJson: unknown;
  if (!existsRuntimeFsSync(targetPath, fs)) {
    if (targetKind === 'source') {
      throw new I18nPruneError(`Source locale file not found: ${targetPath}`, 'USAGE');
    }
    localeJson = {};
  } else {
    localeJson = readHostJsonUnknown(targetPath, fs);
  }

  return { targetPath, targetKind, localeJson, selectedLocaleCode };
}
