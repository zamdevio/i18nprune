import { readFileSync } from 'node:fs';
import path from 'node:path';

import { getWorktreeSnapshot } from '../cache/index.js';
import { printCommandLine, printValidateReport } from '../logger/index.js';
import { corePkgPath, repoRoot } from '../paths.js';

interface PackageExports {
  [subpath: string]: unknown;
}

function readCoreExports(): PackageExports {
  const pkg = JSON.parse(readFileSync(corePkgPath, 'utf8')) as { exports?: PackageExports };
  return pkg.exports ?? {};
}

function readRootTsconfigPaths(): Record<string, string[]> {
  const tsconfigPath = path.join(repoRoot, 'tsconfig.json');
  const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8')) as {
    compilerOptions?: { paths?: Record<string, string[]> };
  };
  return tsconfig.compilerOptions?.paths ?? {};
}

function npmExportKeys(exportsField: PackageExports): string[] {
  return Object.keys(exportsField).map((key) => (key === '.' ? '@i18nprune/core' : `@i18nprune/core/${key.slice(2)}`));
}

function tsconfigCorePaths(paths: Record<string, string[]>): string[] {
  return Object.keys(paths).filter((key) => key === '@i18nprune/core' || key.startsWith('@i18nprune/core/'));
}

export interface ValidateOptions {
  since?: string;
  verbose?: boolean;
}

export function runExportsValidate(options: ValidateOptions = {}): number {
  const t0 = performance.now();
  const violations: string[] = [];
  const notes: string[] = [];
  const advancedFlatSymbols: string[] = [];
  const internalFlatSymbols: string[] = [];

  const exportsField = readCoreExports();
  const npmKeys = new Set(npmExportKeys(exportsField));
  const paths = readRootTsconfigPaths();
  const tsKeys = tsconfigCorePaths(paths);

  if (paths['@i18nprune/core/*']) {
    notes.push('tsconfig still has wildcard @i18nprune/core/* (fix in EX-4)');
  }

  for (const key of tsKeys) {
    if (key === '@i18nprune/core/*') continue;
    if (!npmKeys.has(key)) {
      violations.push(`tsconfig path "${key}" has no matching packages/core/package.json exports entry`);
    }
  }

  for (const key of npmKeys) {
    if (!paths[key] && key !== '@i18nprune/core/report-schema') {
      notes.push(`npm export "${key}" not in root tsconfig paths (may be intentional until EX-4)`);
    }
  }

  if (options.since) {
    notes.push(`--since=${options.since} is reserved for future delta validation (not enforced yet)`);
  }

  const { snapshot } = getWorktreeSnapshot({ noCache: true });
  for (const sym of snapshot.symbols) {
    if (sym.exportKind !== 'flat') continue;
    if (sym.tier === 'internal') internalFlatSymbols.push(sym.name);
    if (sym.tier === 'advanced') advancedFlatSymbols.push(sym.name);
    if (sym.tier === 'unclassified') {
      violations.push(`root flat export "${sym.name}" is unclassified — extend scripts/exports/inventory/tiers.ts`);
    }
  }

  if (internalFlatSymbols.length) {
    notes.push(`${internalFlatSymbols.length} internal-tier symbol(s) still flat on root (enforce in EX-3/EX-4)`);
  }
  if (advancedFlatSymbols.length) {
    notes.push(`${advancedFlatSymbols.length} advanced-tier symbol(s) still flat on root (enforce in EX-3/EX-4)`);
  }

  const passed = violations.length === 0;
  printCommandLine('validate', passed ? 'ok' : 'fail', Math.round(performance.now() - t0));
  printValidateReport({
    passed,
    violations,
    notes,
    verbose: options.verbose,
    advancedFlatSymbols,
    internalFlatSymbols,
  });
  return passed ? 0 : 1;
}
