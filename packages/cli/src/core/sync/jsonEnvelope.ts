import path from 'node:path';
import { scanProjectDynamicKeySites } from '@/core/extractor/dynamic/index.js';
import { computeSyncedLocaleJson } from '@/core/sync/index.js';
import { buildKeyReferenceContext, resolveReferenceConfig } from '@/core/reference/index.js';
import { readJsonFile, writeJsonFile, listJsonBasenamesInDir } from '@/utils/fs/index.js';
import { assertNotSourceTargetLocale } from '@/core/locales/source.js';
import { parseSyncLangSelection } from '@/utils/cli/args.js';
import { buildCliJsonEnvelope } from '@/core/result/cliJson.js';
import {
  issuesFromDiscoveryWarnings,
  issuesFromDynamicScanCount,
  issuesFromSyncMissingLocaleFiles,
  mergeIssues,
} from '@/core/result/cliEnvelopeIssues.js';
import type { Context } from '@/types/core/context/index.js';
import type { SyncOptions } from '@/types/command/sync/index.js';
import type { SyncJsonOutput } from '@/types/command/sync/json.js';
import type { SyncFileLine } from '@/types/command/sync/summary.js';
import type { CliJsonEnvelope } from '@/types/core/json/envelope.js';

export type SyncJsonRunResult = {
  envelope: CliJsonEnvelope<'sync', SyncJsonOutput>;
  fileLines: SyncFileLine[];
  targets: string[];
  updated: number;
  dynamicSites: ReturnType<typeof scanProjectDynamicKeySites>;
  /** Requested locale codes with no matching file under `localesDir` (human-mode warning). */
  missingLocaleCodes: string[];
};

/**
 * Runs sync filesystem work and builds the same JSON envelope as `sync --json`.
 * When `dryRun` is false, writes locale files (same as CLI). Throws on I/O errors (human mode);
 * the command layer catches for **`--json`** and emits **`buildIoReadFailureEnvelope`**.
 */
export function runSync(ctx: Context, opts: SyncOptions): SyncJsonRunResult {
  const eff = resolveReferenceConfig('sync', ctx.config);
  const refCtx = buildKeyReferenceContext(ctx, eff);
  const dynamicSites = scanProjectDynamicKeySites(ctx);
  const sourcePath = ctx.paths.sourceLocale;
  const template = readJsonFile(sourcePath);
  const sourceBase = path.basename(sourcePath, '.json');
  const dir = ctx.paths.localesDir;
  const allTargets = listJsonBasenamesInDir(dir).filter((f) => f !== `${sourceBase}.json`);

  const sel = parseSyncLangSelection(opts.target);
  let targets: string[];
  let missingLocaleCodes: string[] = [];
  if (sel.mode === 'all') {
    targets = allTargets;
  } else {
    for (const code of sel.codes) {
      assertNotSourceTargetLocale('sync', code, sourcePath, ctx);
    }
    targets = sel.codes.map((c) => `${c}.json`).filter((f) => allTargets.includes(f));
    missingLocaleCodes = sel.codes.filter((c) => !allTargets.includes(`${c}.json`));
  }

  let updated = 0;
  const fileLines: SyncFileLine[] = [];

  for (const file of targets) {
    const full = path.join(dir, file);
    const cur = readJsonFile(full);
    const mergeOpts =
      eff.uncertainKeyPolicy === 'protect' || eff.uncertainKeyPolicy === 'warn_only'
        ? { uncertainKeepPrefixes: refCtx.uncertainPrefixes }
        : undefined;
    const { next, wouldChange } = computeSyncedLocaleJson(
      template,
      cur,
      ctx.config.policies?.preserve,
      mergeOpts,
    );

    if (opts.dryRun) {
      fileLines.push({ path: full, changed: wouldChange });
      continue;
    }
    if (wouldChange) {
      writeJsonFile(full, next);
      updated += 1;
    }
    fileLines.push({ path: full, changed: wouldChange });
  }

  const jsonPayload: SyncJsonOutput = {
    kind: 'sync',
    sourcePath,
    localesDir: dir,
    targetFiles: targets.length,
    writtenFiles: updated,
    dynamicKeySites: dynamicSites.length,
    dryRun: Boolean(opts.dryRun),
    files: fileLines,
  };

  const issues = mergeIssues(
    issuesFromDiscoveryWarnings(ctx.meta.warnings),
    issuesFromDynamicScanCount(dynamicSites.length),
    issuesFromSyncMissingLocaleFiles(missingLocaleCodes),
  );

  const envelope = buildCliJsonEnvelope('sync', jsonPayload, {
    ok: true,
    issues,
    cwd: process.cwd(),
  });

  return { envelope, fileLines, targets, updated, dynamicSites, missingLocaleCodes };
}
