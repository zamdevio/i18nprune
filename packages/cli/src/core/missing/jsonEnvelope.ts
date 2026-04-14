import fs from 'node:fs';
import path from 'node:path';
import { normalizeLanguageCode } from '@/core/languages/index.js';
import { isSourceLocaleSlug } from '@/core/locales/source.js';
import { I18nPruneError } from '@/core/errors/index.js';
import { resolvePathsToAddForMissing } from '@/core/missing/index.js';
import { readJsonFile, fileExists } from '@/utils/fs/index.js';
import { buildCliJsonEnvelope } from '@/core/result/cliJson.js';
import { buildIoReadFailureEnvelope } from '@/core/result/ioEnvelope.js';
import {
  issuesFromDiscoveryWarnings,
  issuesFromMissingSkippedNotInScan,
  mergeIssues,
} from '@/core/result/cliEnvelopeIssues.js';
import type { Context } from '@/types/core/context/index.js';
import type { MissingJsonOutput, MissingOptions } from '@/types/command/missing/index.js';
import type { CliJsonEnvelope } from '@/types/core/json/envelope.js';

function emptyMissingPayload(opts: MissingOptions): MissingJsonOutput {
  return {
    kind: 'missing',
    targetPath: '',
    targetKind: 'source',
    pathsAdded: 0,
    paths: [],
    dryRun: Boolean(opts.dryRun),
    skippedNotInScan: [],
  };
}

/**
 * Same payload as `missing --json` (before interactive write). On I/O or path errors returns **`ok: false`**
 * with **`i18nprune.io.read_failed`** instead of throwing (for `--json` consumers).
 */
export function runMissing(ctx: Context, opts: MissingOptions): CliJsonEnvelope<'missing', MissingJsonOutput> {
  try {
    const { paths } = ctx;
    const localesDir = paths.localesDir;
    const sourcePath = paths.sourceLocale;

    let targetPath: string;
    let targetLabel: 'source' | 'locale';

    if (opts.locale?.trim()) {
      const code = normalizeLanguageCode(opts.locale.trim());
      if (!fs.existsSync(localesDir)) {
        throw new I18nPruneError(`locales directory not found: ${localesDir}`, 'USAGE');
      }
      targetPath = path.join(localesDir, `${code}.json`);
      targetLabel = 'locale';
    } else {
      if (!fileExists(sourcePath)) {
        throw new I18nPruneError(`Source locale file not found: ${sourcePath}`, 'USAGE');
      }
      targetPath = sourcePath;
      targetLabel = 'source';
    }

    let localeJson: unknown;
    if (!fileExists(targetPath)) {
      if (targetLabel === 'source') {
        throw new I18nPruneError(`Source locale file not found: ${targetPath}`, 'USAGE');
      }
      localeJson = {};
    } else {
      localeJson = readJsonFile(targetPath);
    }

    const { toAdd, skippedNotInScan } = resolvePathsToAddForMissing(ctx, localeJson, {
      fromReport: opts.fromReport,
    });

    const jsonPayload: MissingJsonOutput = {
      kind: 'missing',
      targetPath: path.relative(process.cwd(), targetPath) || targetPath,
      targetKind: targetLabel,
      pathsAdded: toAdd.length,
      paths: toAdd,
      dryRun: Boolean(opts.dryRun),
      skippedNotInScan,
    };

    const issues = mergeIssues(
      issuesFromDiscoveryWarnings(ctx.meta.warnings),
      issuesFromMissingSkippedNotInScan(skippedNotInScan),
    );

    return buildCliJsonEnvelope('missing', jsonPayload, {
      ok: true,
      issues,
      cwd: process.cwd(),
    });
  } catch (err) {
    return buildIoReadFailureEnvelope('missing', emptyMissingPayload(opts), ctx, err);
  }
}
