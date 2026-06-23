import chalk from 'chalk';

import path from 'node:path';

import type { CacheStatus, SnapshotResult } from '../cache/index.js';
import { ExportError } from '../errors/index.js';
import { printHelp } from '../help/index.js';
import type { DiffResult } from '../format/index.js';
import { gitRevParse, shortSha, type SourceRef } from '../git/index.js';
import type { InventorySnapshot } from '../inventory/index.js';
import { cacheDirForSha, repoRoot, rootIndexRepoPath, WORKTREE_CACHE_KEY } from '../paths.js';
import {
  compactCoreSourcePath,
  formatInventoryCategory,
  formatInventoryName,
  formatInventorySymbolKind,
  formatInventoryTier,
  formatSubject,
  formatVerboseInventoryHeader,
} from './format.js';

const BRAND = chalk.bold.cyan('exports');

export type CommandStatus = 'ok' | 'fail' | 'error';

function padLabel(label: string, width = 10): string {
  return chalk.dim(label.padEnd(width));
}

function formatDelta(before: number, after: number): string {
  const delta = after - before;
  if (delta === 0) return chalk.dim(`${before} → ${after}`);
  if (delta > 0) return `${chalk.dim(String(before))} ${chalk.dim('→')} ${chalk.yellow(String(after))} ${chalk.yellow(`(+${delta})`)}`;
  return `${chalk.dim(String(before))} ${chalk.dim('→')} ${chalk.green(String(after))} ${chalk.green(`(${delta})`)}`;
}

function inventoryCacheDirDisplay(sha: string): string {
  return `${path.relative(repoRoot, cacheDirForSha(sha)).replace(/\\/g, '/')}/`;
}

function cacheLabel(status: CacheStatus): string {
  switch (status) {
    case 'hit':
      return chalk.green('hit');
    case 'miss':
      return chalk.yellow('miss');
    case 'refresh':
      return chalk.cyan('refresh');
    case 'bypass':
      return chalk.dim('bypass');
    default:
      return chalk.dim('n/a');
  }
}

function snapshotShaLabel(snapshot: InventorySnapshot): string {
  if (snapshot.sha === WORKTREE_CACHE_KEY) {
    return `HEAD ${shortSha(gitRevParse('HEAD'))}`;
  }
  return shortSha(snapshot.sha);
}

function refLine(ref: SourceRef, snapshot: InventorySnapshot): string {
  if (ref.kind === 'worktree') {
    return `working tree ${chalk.dim(`(${snapshotShaLabel(snapshot)})`)}`;
  }
  return `${ref.label} ${chalk.dim(`(${shortSha(ref.sha)})`)}`;
}

function tierColor(tier: string, value: number): string {
  const text = String(value).padStart(6, ' ');
  switch (tier) {
    case 'stable':
      return chalk.green(text);
    case 'advanced':
      return chalk.yellow(text);
    case 'internal':
      return chalk.magenta(text);
    case 'unclassified':
      return chalk.red(text);
    default:
      return text;
  }
}

export function printCommandLine(command: string, status: CommandStatus, ms: number): void {
  const statusText =
    status === 'ok'
      ? chalk.green(status)
      : status === 'fail'
        ? chalk.red(status)
        : chalk.red(status);
  console.log(
    `${BRAND}  ${chalk.bold(command)} ${chalk.dim('·')} ${statusText} ${chalk.dim('·')} ${chalk.white(`${ms}ms`)}`,
  );
}

export function printHeader(command: string, subtitle: string): void {
  console.log(`${BRAND}  ${chalk.bold(command)} ${chalk.dim('·')} ${subtitle}`);
}

export function printMeta(rows: Record<string, string | undefined>): void {
  for (const [key, value] of Object.entries(rows)) {
    if (!value) continue;
    console.log(`       ${padLabel(key)} ${value}`);
  }
}

export function printInventoryReport(input: {
  ref: SourceRef;
  result: SnapshotResult;
  gitStats?: string;
}): void {
  const { ref, result } = input;
  const { snapshot, cache, barrelPath } = result;

  printMeta({
    ref: refLine(ref, snapshot),
    barrel: chalk.dim(barrelPath),
    cache: `${cacheLabel(cache)} ${chalk.dim(`· ${inventoryCacheDirDisplay(snapshot.sha)}`)}`,
    generated: chalk.dim(new Date(snapshot.generatedAt).toISOString()),
    commit: snapshot.git?.commitDate ? chalk.dim(snapshot.git.commitDate) : undefined,
    edges: chalk.dim(String(snapshot.edges.length)),
    subpaths: chalk.dim(String(snapshot.summary.subpaths.length)),
    git: input.gitStats ? chalk.dim(input.gitStats) : undefined,
  });

  console.log('');
  const r = snapshot.summary.root;
  console.log(`       ${padLabel('root flat')} ${chalk.white(String(r.flat))}`);
  console.log(`       ${padLabel('namespace')} ${chalk.white(String(r.namespace))}`);
  console.log(`       ${padLabel('stable')} ${tierColor('stable', r.stable)}`);
  console.log(`       ${padLabel('advanced')} ${tierColor('advanced', r.advanced)}`);
  console.log(`       ${padLabel('internal')} ${tierColor('internal', r.internal)}`);
  console.log(`       ${padLabel('unclassified')} ${tierColor('unclassified', r.unclassified)}`);

  const topCategories = Object.entries(r.byCategory ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  if (topCategories.length) {
    console.log('');
    console.log(chalk.bold.dim('       Top categories'));
    for (const [cat, count] of topCategories) {
      console.log(`       ${padLabel(cat, 14)} ${chalk.white(String(count))}`);
    }
  }
}

const VERBOSE_INVENTORY_ROW_PREFIX = '       · ';

export function printVerboseInventory(snapshot: InventorySnapshot): void {
  const flat = [...snapshot.symbols].sort((a, b) => a.name.localeCompare(b.name));

  console.log('');
  console.log(chalk.bold.dim('       Symbols (root flat)'));
  console.log(chalk.dim(`${VERBOSE_INVENTORY_ROW_PREFIX}${formatVerboseInventoryHeader()}`));
  for (const sym of flat) {
    const tierPlain = formatInventoryTier(sym.tier);
    const tier =
      sym.tier === 'stable'
        ? chalk.green(tierPlain)
        : sym.tier === 'advanced'
          ? chalk.yellow(tierPlain)
          : sym.tier === 'internal'
            ? chalk.magenta(tierPlain)
            : chalk.red(tierPlain);
    const category = chalk.cyan(formatInventoryCategory(sym.category));
    const symbolKind = chalk.white(formatInventorySymbolKind(sym.symbolKind));
    console.log(
      `${VERBOSE_INVENTORY_ROW_PREFIX}${formatInventoryName(sym.name)} ${tier} ${category} ${symbolKind} ${chalk.dim(sym.targetSubpath)}`,
    );
  }

  if (snapshot.namespaces.length) {
    console.log('');
    console.log(chalk.bold.dim('       Namespaces (root)'));
    for (const ns of snapshot.namespaces.sort((a, b) => a.name.localeCompare(b.name))) {
      const src = chalk.dim(compactCoreSourcePath(ns.sourceModule));
      console.log(
        `       ${chalk.dim('·')} ${ns.name.padEnd(20)} ${chalk.dim('→')} ${src} ${chalk.dim('·')} ${chalk.dim(ns.targetSubpath)}`,
      );
    }
  }

  if (snapshot.summary.subpaths.length) {
    console.log('');
    console.log(chalk.bold.dim('       Published subpaths (rollup)'));
    for (const sp of snapshot.summary.subpaths) {
      console.log(
        `       ${chalk.dim('·')} ${sp.npmSubpath.padEnd(32)} flat ${String(sp.flat).padStart(4)}  ns ${String(sp.namespace).padStart(3)}`,
      );
    }
  }
}

export function printDiffReport(input: {
  rangeLabel: string;
  left: SnapshotResult;
  right: SnapshotResult;
  diff: DiffResult;
}): void {
  const { rangeLabel, left, right, diff } = input;

  printMeta({
    range: rangeLabel,
    from: `${left.snapshot.refLabel} ${chalk.dim(`(${snapshotShaLabel(left.snapshot)})`)}`,
    to: `${right.snapshot.refLabel} ${chalk.dim(`(${snapshotShaLabel(right.snapshot)})`)}`,
    cache: `${cacheLabel(left.cache)} / ${cacheLabel(right.cache)}`,
  });

  console.log('');
  const dl = diff.summaryDelta.left.root;
  const dr = diff.summaryDelta.right.root;
  console.log(`       ${padLabel('root flat')} ${formatDelta(dl.flat, dr.flat)}`);
  console.log(`       ${padLabel('stable')} ${formatDelta(dl.stable, dr.stable)}`);
  console.log(`       ${padLabel('advanced')} ${formatDelta(dl.advanced, dr.advanced)}`);
  console.log(`       ${padLabel('internal')} ${formatDelta(dl.internal, dr.internal)}`);

  console.log('');
  if (diff.added.length) {
    console.log(chalk.green.bold('       Added'));
    for (const name of diff.added) console.log(`       ${chalk.green('+')} ${name}`);
    console.log('');
  }

  if (diff.removed.length) {
    console.log(chalk.red.bold('       Removed'));
    for (const name of diff.removed) console.log(`       ${chalk.red('-')} ${name}`);
    console.log('');
  }

  if (!diff.added.length && !diff.removed.length) {
    console.log(chalk.dim('       No flat export additions or removals.'));
    console.log('');
  }

  if (diff.tierViolations.length) {
    console.log(chalk.yellow.bold('       Tier violations'));
    for (const v of diff.tierViolations) console.log(`       ${chalk.yellow('!')} ${v}`);
  } else {
    console.log(`       ${chalk.green('✓')} ${chalk.dim('No tier violations')}`);
  }
}

export function printDiffVerbose(input: {
  diff: DiffResult;
  left: InventorySnapshot;
  right: InventorySnapshot;
}): void {
  const { diff, left, right } = input;
  if (diff.added.length) {
    console.log('');
    console.log(chalk.bold.dim('       Added detail'));
    for (const name of diff.added) {
      const sym = right.symbols.find((s) => s.name === name);
      if (sym) {
        console.log(
          `       ${chalk.dim('·')} ${name} → ${sym.tier} · ${sym.category} · ${sym.symbolKind} → ${sym.targetSubpath}`,
        );
      }
    }
  }
  if (diff.removed.length) {
    console.log('');
    console.log(chalk.bold.dim('       Removed detail'));
    for (const name of diff.removed) {
      const sym = left.symbols.find((s) => s.name === name);
      if (sym) {
        console.log(
          `       ${chalk.dim('·')} ${name} → ${sym.tier} · ${sym.category} · ${sym.symbolKind} → ${sym.targetSubpath}`,
        );
      }
    }
  }
}

export function printDiffCacheDetail(input: { left: SnapshotResult; right: SnapshotResult }): void {
  const { left, right } = input;
  console.log('');
  console.log(chalk.bold.dim('       Cache detail'));
  console.log(`       ${padLabel('from')} ${left.snapshot.sha} ${chalk.dim(`(${left.cache})`)}`);
  console.log(`       ${padLabel('to')} ${right.snapshot.sha} ${chalk.dim(`(${right.cache})`)}`);
}

export function printValidateReport(input: {
  passed: boolean;
  violations: string[];
  notes: string[];
  verbose?: boolean;
  advancedFlatSymbols?: string[];
  internalFlatSymbols?: string[];
}): void {
  const { passed, violations, notes, verbose, advancedFlatSymbols = [], internalFlatSymbols = [] } = input;
  const noteLimit = verbose ? notes.length : 5;

  if (!passed) {
    console.log('');
    for (const v of violations) console.log(`       ${chalk.red('✗')} ${v}`);
    if (verbose && notes.length) {
      console.log('');
      console.log(chalk.bold.dim('       Notes'));
      for (const note of notes) console.log(`       ${chalk.dim('·')} ${note}`);
    }
    return;
  }

  console.log('');
  console.log(`       ${chalk.green('✓')} tsconfig paths ⊆ npm exports (wildcard flagged separately)`);
  console.log(`       ${chalk.green('✓')} no unclassified root flat exports`);
  for (const note of notes.slice(0, noteLimit)) console.log(`       ${chalk.dim('·')} ${note}`);
  if (!verbose && notes.length > 5) {
    console.log(`       ${chalk.dim(`…and ${notes.length - 5} more notes (use -v)`)}`);
  }

  if (verbose && internalFlatSymbols.length) {
    console.log('');
    console.log(chalk.bold.dim('       Internal-tier flat on root'));
    for (const name of internalFlatSymbols.sort()) console.log(`       ${chalk.magenta('·')} ${name}`);
  }

  if (verbose && advancedFlatSymbols.length) {
    console.log('');
    console.log(chalk.bold.dim('       Advanced-tier flat on root'));
    for (const name of advancedFlatSymbols.sort()) console.log(`       ${chalk.yellow('·')} ${name}`);
  }
}

export function printTrendReport(input: {
  rows: {
    tag: string;
    sha: string;
    cache: CacheStatus;
    rollup: {
      rootFlat: number;
      stable: number;
      advanced: number;
      internal: number;
      byCategory: Record<string, number | undefined>;
    };
  }[];
  tagLimit: number;
  verbose?: boolean;
}): void {
  printMeta({
    tags: chalk.dim(String(input.rows.length)),
    window: chalk.dim(`last ${input.tagLimit} version tags`),
  });

  if (!input.rows.length) {
    console.log('');
    console.log(chalk.dim('       No version tags found (git tag -l v*).'));
    return;
  }

  console.log('');
  console.log(
    chalk.dim(
      `       ${'tag'.padEnd(10)} ${'flat'.padStart(6)} ${'stable'.padStart(6)} ${'adv'.padStart(5)} ${'int'.padStart(4)}`,
    ),
  );
  for (const row of input.rows) {
    console.log(
      `       ${row.tag.padEnd(10)} ${String(row.rollup.rootFlat).padStart(6)} ${String(row.rollup.stable).padStart(6)} ${String(row.rollup.advanced).padStart(5)} ${String(row.rollup.internal).padStart(4)} ${chalk.dim(`(${row.cache})`)}`,
    );
  }

  const first = input.rows[0]!;
  const last = input.rows[input.rows.length - 1]!;
  const delta = last.rollup.rootFlat - first.rollup.rootFlat;
  const pct = first.rollup.rootFlat ? ((delta / first.rollup.rootFlat) * 100).toFixed(1) : '0.0';
  console.log('');
  if (delta === 0) {
    console.log(`       ${chalk.dim(`Δ ${first.tag} → ${last.tag}: flat unchanged`)}`);
  } else if (delta > 0) {
    console.log(`       ${chalk.yellow(`Δ ${first.tag} → ${last.tag}: +${delta} flat (+${pct}%)`)}`);
  } else {
    console.log(`       ${chalk.green(`Δ ${first.tag} → ${last.tag}: ${delta} flat (${pct}%)`)}`);
  }

  if (input.verbose) {
    console.log('');
    console.log(chalk.bold.dim('       Categories (latest tag)'));
    for (const [cat, count] of Object.entries(last.rollup.byCategory).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))) {
      console.log(`       ${padLabel(cat, 14)} ${count ?? 0}`);
    }
  }
}

export function printTimelineReport(input: {
  range: { label: string; since: string; until: string };
  limit: number;
  rows: {
    date: string;
    sha: string;
    subject: string;
    cache: CacheStatus;
    rollup: { rootFlat: number; stable: number };
    delta: number | null;
  }[];
  verbose?: boolean;
  warmStats?: { warmed: number; totalMs: number };
  gitStats?: string;
}): void {
  const limitLabel = input.limit === 0 ? 'none' : String(input.limit);
  printMeta({
    range: input.range.label,
    from: chalk.dim(input.range.since),
    to: chalk.dim(input.range.until),
    limit: chalk.dim(limitLabel),
    barrel: chalk.dim(`${input.rows.length} commits · ${rootIndexRepoPath}`),
    warm: input.warmStats
      ? chalk.dim(`${input.warmStats.warmed}/${input.rows.length} · ${input.warmStats.totalMs}ms`)
      : undefined,
    git: input.gitStats ? chalk.dim(input.gitStats) : undefined,
  });

  if (!input.rows.length) {
    console.log('');
    console.log(chalk.dim('       No commits touching the root barrel in this range.'));
    return;
  }
  console.log(
    chalk.dim(
      '       Δ = flat change vs row above (newest first); — = first row; +N/−N flat exports vs newer barrel edit',
    ),
  );

  console.log('');
  console.log(chalk.dim(`       ${'date'.padEnd(12)} ${'sha'.padEnd(9)} ${'flat'.padStart(5)} ${'Δ'.padStart(5)}  subject`));
  for (const row of input.rows) {
    let deltaStr: string;
    if (row.delta === null) deltaStr = chalk.dim('    —');
    else if (row.delta === 0) deltaStr = chalk.dim('    0');
    else if (row.delta > 0) deltaStr = chalk.yellow(` +${row.delta}`.padStart(4));
    else deltaStr = chalk.green(` ${row.delta}`.padStart(4));

    const subject = formatSubject(row.subject, 48, input.verbose);
    console.log(
      `       ${row.date.padEnd(12)} ${row.sha.slice(0, 7).padEnd(9)} ${String(row.rollup.rootFlat).padStart(5)} ${deltaStr}  ${subject}`,
    );
  }
}

export function printGraphReport(input: {
  ref: SourceRef;
  snapshot: InventorySnapshot;
  cache: CacheStatus;
  targetGroups: { targetSubpath: string; flat: number; namespace: number; modules: Map<string, number> }[];
  topModules: { module: string; edges: number; symbols: string[] }[];
  namespaces: { name: string; targetSubpath: string; module: string | null }[];
  verbose?: boolean;
}): void {
  printMeta({
    ref: refLine(input.ref, input.snapshot),
    cache: cacheLabel(input.cache),
    edges: chalk.dim(String(input.snapshot.edges.length)),
    symbols: chalk.dim(String(input.snapshot.symbols.length)),
  });

  console.log('');
  console.log(chalk.bold.dim('       By target subpath (governance)'));
  console.log(chalk.dim(`       ${'subpath'.padEnd(22)} ${'flat'.padStart(6)} ${'ns'.padStart(4)}`));
  for (const group of input.targetGroups.slice(0, input.verbose ? undefined : 12)) {
    console.log(
      `       ${group.targetSubpath.padEnd(22)} ${String(group.flat).padStart(6)} ${String(group.namespace).padStart(4)}`,
    );
  }

  console.log('');
  console.log(chalk.bold.dim('       Root namespaces'));
  for (const ns of input.namespaces.slice(0, input.verbose ? undefined : 15)) {
    const src = compactCoreSourcePath(ns.module);
    console.log(
      `       ${chalk.dim('·')} ${ns.name.padEnd(18)} ${chalk.dim('→')} ${chalk.dim(src)} ${chalk.dim('·')} ${ns.targetSubpath}`,
    );
  }

  console.log('');
  console.log(chalk.bold.dim('       Top source modules (edge count)'));
  for (const mod of input.topModules) {
    console.log(`       ${chalk.dim('·')} ${mod.edges.toString().padStart(4)}  ${mod.module}`);
    if (input.verbose && mod.symbols.length) {
      console.log(`       ${chalk.dim('     e.g.')} ${mod.symbols.join(', ')}`);
    }
  }
}

export function printExportError(err: ExportError): void {
  printHeader('error', chalk.red(err.message));
  printMeta({
    code: chalk.red(err.code),
    ...(err.details as Record<string, string | undefined>),
  });
}

export function printUnexpected(err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  printHeader('error', chalk.red('Unexpected failure'));
  printMeta({ message });
  if (process.env.EXPORTS_DEBUG) {
    console.error(err);
  }
}
