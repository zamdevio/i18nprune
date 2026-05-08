import os from 'node:os';
import { computeMissingLiteralKeys } from '@/shared/validate/missingLiterals.js';
import { listSourceFiles } from '@i18nprune/core';
import { toExtractorScanInput } from '@/shared/extractor/scanInput.js';
import { CLI_VERSION } from '@/constants/cli.js';
import { PROJECT_REPORT_KIND } from '@/constants/env.js';
import { PROJECT_REPORT_SCHEMA_VERSION } from '@/constants/report.js';
import {
  type ProjectReportDocument,
} from '@/types/command/report/index.js';
import type { Context } from '@/types/core/context/index.js';
import { readHostJsonUnknown } from '@/shared/io/hostJson.js';
import { extractor } from '@i18nprune/core';

function runtimeFamily(): 'windows' | 'darwin' | 'linux' | 'linux-wsl' {
  if (process.platform === 'win32') return 'windows';
  if (process.platform === 'darwin') return 'darwin';
  if (process.env.WSL_DISTRO_NAME) return 'linux-wsl';
  return 'linux';
}

function readLinuxDistro(fsPort: Context['adapters']['fs']): string | undefined {
  if (process.platform !== 'linux') return undefined;
  try {
    const raw = fsPort.readText('/etc/os-release');
    if (typeof raw !== 'string') return undefined;
    const line = raw
      .split('\n')
      .find((x) => x.startsWith('PRETTY_NAME=') || x.startsWith('NAME='));
    if (!line) return undefined;
    const v = line.split('=')[1] ?? '';
    return v.replace(/^"|"$/g, '').trim() || undefined;
  } catch {
    return undefined;
  }
}

export function buildProjectReportDocument(ctx: Context): ProjectReportDocument {
  const cwd = process.cwd();
  const raw = readHostJsonUnknown(ctx.paths.sourceLocale, ctx.adapters.fs);
  const missing = computeMissingLiteralKeys(ctx, raw);
  const scanInput = toExtractorScanInput(ctx);
  const dynamicSites = extractor.dynamic.scanProjectDynamicKeySites(scanInput);
  const keyObservations = extractor.keySites.scanProjectKeyObservations(scanInput);
  const projectFs = { fs: ctx.adapters.fs, path: ctx.adapters.path };
  const sourceFilesScannedCount = listSourceFiles(projectFs, ctx.paths.srcRoot, ctx.config.exclude).length;
  const sourceLocaleTag = ctx.adapters.path.basename(ctx.paths.sourceLocale, '.json');
  return {
    kind: PROJECT_REPORT_KIND,
    schemaVersion: PROJECT_REPORT_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    toolVersion: CLI_VERSION,
    project: {
      cwd,
      sourceLocalePath: ctx.paths.sourceLocale,
      localesDir: ctx.paths.localesDir,
      srcRoot: ctx.paths.srcRoot,
      sourceLocaleTag,
      environment: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        osRelease: os.release(),
        distro: readLinuxDistro(ctx.adapters.fs),
        runtimeFamily: runtimeFamily(),
        ...(process.env.WSL_DISTRO_NAME
          ? { wslDistroName: process.env.WSL_DISTRO_NAME }
          : {}),
      },
    },
    summary: {
      missingKeysCount: missing.length,
      dynamicSitesCount: dynamicSites.length,
      keyObservationsCount: keyObservations.length,
      sourceFilesScannedCount,
      ok: missing.length === 0,
    },
    details: {
      missingKeys: missing,
      dynamicSites: dynamicSites as unknown[],
      keyObservations: keyObservations as unknown[],
    },
  };
}
