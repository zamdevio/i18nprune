import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { computeMissingLiteralKeys } from '@/core/validate/index.js';
import { scanProjectDynamicKeySites } from '@/core/extractor/dynamic/index.js';
import { scanProjectKeyObservations } from '@/core/extractor/keySites/index.js';
import { listSourceFiles } from '@/core/scanner/files.js';
import { CLI_VERSION } from '@/constants/cli.js';
import { PROJECT_REPORT_KIND } from '@/constants/env.js';
import { PROJECT_REPORT_SCHEMA_VERSION } from '@/constants/report.js';
import {
  type ProjectReportDocument,
} from '@/types/command/report/index.js';
import type { Context } from '@/types/core/context/index.js';
import { readJsonFile } from '@/utils/fs/index.js';

function runtimeFamily(): 'windows' | 'darwin' | 'linux' | 'linux-wsl' {
  if (process.platform === 'win32') return 'windows';
  if (process.platform === 'darwin') return 'darwin';
  if (process.env.WSL_DISTRO_NAME) return 'linux-wsl';
  return 'linux';
}

function readLinuxDistro(): string | undefined {
  if (process.platform !== 'linux') return undefined;
  try {
    const raw = fs.readFileSync('/etc/os-release', 'utf8');
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
  const raw = readJsonFile(ctx.paths.sourceLocale);
  const missing = computeMissingLiteralKeys(ctx, raw);
  const dynamicSites = scanProjectDynamicKeySites(ctx);
  const keyObservations = scanProjectKeyObservations(ctx);
  const sourceFilesScannedCount = listSourceFiles(ctx.paths.srcRoot).length;
  const sourceLocaleTag = path.basename(ctx.paths.sourceLocale, path.extname(ctx.paths.sourceLocale));
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
        distro: readLinuxDistro(),
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
