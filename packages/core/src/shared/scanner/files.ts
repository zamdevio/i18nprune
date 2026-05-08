import type { ProjectFilesystemRuntime } from '../../types/runtime/capabilities.js';
import type { RuntimePathPort } from '../../types/runtime/path.js';
import type { CompiledScanExclude } from '../../types/scanner/compile.js';
import type { ListSourceFilesOptions, ScanDebugEvent } from '../../types/scanner/debug.js';
import type { ScanExcludeConfig } from '../../types/scanner/exclude.js';
import { existsRuntimeFsSync, listRuntimeFsDirSync } from '../../runtime/helpers/sync/index.js';
import { getRunOptions } from '../options/runOptions.js';
import { resolveScanExcludeConfig } from './presets.js';

function resolveScanDebugSink(listOpts?: ListSourceFilesOptions): ((e: ScanDebugEvent) => void) | undefined {
  const g = getRunOptions();
  if (g.silent) return undefined;
  return listOpts?.onScanDebug ?? g.onScanDebug;
}

function emitScanDebug(sink: ((e: ScanDebugEvent) => void) | undefined, event: ScanDebugEvent): void {
  if (sink) sink(event);
}

/** Built-in directory basenames skipped while walking (when `exclude.useDefaultSkip !== false`). */
export const DEFAULT_SCAN_SKIP_DIR_NAMES = [
  'node_modules',
  'dist',
  'build',
  '.git',
  'coverage',
  '.next',
  'out',
] as const;

const DEFAULT_SCAN_SKIP_DIR_SET = new Set<string>(DEFAULT_SCAN_SKIP_DIR_NAMES);

/** Matches extensions scanned for literals and dynamic keys (extension-only; no folder guessing). */
const SOURCE_FILE_NAME = /\.(tsx?|jsx?|mjs|cjs|vue|svelte)$/i;

function normExtToken(s: string): string {
  const t = s.trim().toLowerCase();
  return t.startsWith('.') ? t.slice(1) : t;
}

/** Longest multi-dot suffixes first (e.g. `d.ts` before `ts`). */
function basenameExtensionSuffixes(fileBase: string): string[] {
  const parts = fileBase.split('.');
  if (parts.length < 2) return [];
  const out: string[] = [];
  for (let i = 1; i < parts.length; i++) {
    out.push(parts.slice(i).join('.').toLowerCase());
  }
  out.sort((a, b) => b.length - a.length);
  return out;
}

function relPosix(pathPort: RuntimePathPort, rootDir: string, absPath: string): string {
  return pathPort.relative(rootDir, absPath).replace(/\\/g, '/');
}

function partitionRules(rules: ScanExcludeConfig['dirs']): { strings: Set<string>; regexes: RegExp[] } {
  const strings = new Set<string>();
  const regexes: RegExp[] = [];
  if (!rules) return { strings, regexes };
  for (const r of rules) {
    if (typeof r === 'string') {
      const t = r.trim();
      if (t) strings.add(t);
    } else {
      regexes.push(r);
    }
  }
  return { strings, regexes };
}

function partitionExtRules(rules: ScanExcludeConfig['extensions']): { strings: Set<string>; regexes: RegExp[] } {
  const strings = new Set<string>();
  const regexes: RegExp[] = [];
  if (!rules) return { strings, regexes };
  for (const r of rules) {
    if (typeof r === 'string') {
      const n = normExtToken(r);
      if (n) strings.add(n);
    } else {
      regexes.push(r);
    }
  }
  return { strings, regexes };
}

export function compileScanExclude(exclude?: ScanExcludeConfig): CompiledScanExclude {
  const resolved = resolveScanExcludeConfig(exclude);
  const useDefault = resolved?.useDefaultSkip !== false;
  const defaultDirs = useDefault ? DEFAULT_SCAN_SKIP_DIR_SET : null;

  const dirs = partitionRules(resolved?.dirs);
  const files = partitionRules(resolved?.files);
  const exts = partitionExtRules(resolved?.extensions);
  const pathPatterns = resolved?.patterns ?? [];

  const userRulesEmpty =
    dirs.strings.size === 0 &&
    dirs.regexes.length === 0 &&
    files.strings.size === 0 &&
    files.regexes.length === 0 &&
    exts.strings.size === 0 &&
    exts.regexes.length === 0 &&
    pathPatterns.length === 0;

  return {
    defaultDirs,
    dirStrings: dirs.strings,
    dirRegexes: dirs.regexes,
    fileStrings: files.strings,
    fileRegexes: files.regexes,
    extStrings: exts.strings,
    extRegexes: exts.regexes,
    pathPatterns,
    userRulesEmpty,
  };
}

function explainDirSkip(name: string, c: CompiledScanExclude): string | null {
  if (c.defaultDirs?.has(name)) return `built-in directory skip (${name})`;
  if (c.userRulesEmpty) return null;
  if (c.dirStrings.has(name)) return `exclude.dirs (${name})`;
  for (const re of c.dirRegexes) {
    if (re.test(name)) return `exclude.dirs regex /${re.source}/`;
  }
  return null;
}

function explainFileSkip(relPosix: string, baseName: string, c: CompiledScanExclude): string | null {
  if (c.userRulesEmpty) return null;
  if (c.fileStrings.has(baseName)) return `exclude.files (${baseName})`;
  for (const re of c.fileRegexes) {
    if (re.test(baseName)) return `exclude.files regex /${re.source}/`;
  }
  if (c.extStrings.size > 0 || c.extRegexes.length > 0) {
    for (const suf of basenameExtensionSuffixes(baseName)) {
      if (c.extStrings.has(suf)) return `exclude.extensions (${suf})`;
      for (const re of c.extRegexes) {
        if (re.test(suf)) return `exclude.extensions regex /${re.source}/`;
      }
    }
  }
  for (const re of c.pathPatterns) {
    if (re.test(relPosix)) return `exclude.patterns /${re.source}/ ← ${relPosix}`;
  }
  return null;
}

/**
 * Recursive source files under `rootDir`.
 * Optional `exclude` augments built-in directory skips; see {@link ScanExcludeConfig}.
 */
export function listSourceFiles(
  runtime: ProjectFilesystemRuntime,
  rootDir: string,
  exclude?: ScanExcludeConfig,
  listOpts?: ListSourceFilesOptions,
): string[] {
  const { fs, path } = runtime;
  const compiled = compileScanExclude(exclude);
  const out: string[] = [];
  const debugSink = resolveScanDebugSink(listOpts);

  function walk(dir: string): void {
    if (!existsRuntimeFsSync(dir, fs)) return;
    const entries = listRuntimeFsDirSync(dir, fs);
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.kind === 'directory') {
        const why = explainDirSkip(e.name, compiled);
        if (why) {
          emitScanDebug(debugSink, {
            kind: 'skip_directory',
            relativePath: relPosix(path, rootDir, p),
            basename: e.name,
            reason: why,
          });
          continue;
        }
        walk(p);
      } else if (e.kind === 'file') {
        const rel = relPosix(path, rootDir, p);
        if (!SOURCE_FILE_NAME.test(e.name)) {
          emitScanDebug(debugSink, {
            kind: 'skip_file',
            relativePath: rel,
            basename: e.name,
            reason: `not a scanned source extension (${e.name})`,
          });
          continue;
        }
        const whyF = explainFileSkip(rel, e.name, compiled);
        if (whyF) {
          emitScanDebug(debugSink, {
            kind: 'skip_file',
            relativePath: rel,
            basename: e.name,
            reason: whyF,
          });
          continue;
        }
        out.push(p);
      }
    }
  }

  walk(rootDir);
  return out;
}
