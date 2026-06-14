import chalk from 'chalk';

import { formatTimelineRangeHelp } from '../time/index.js';

const BRAND = chalk.bold.cyan('exports');

function cmd(name: string, args = ''): string {
  return `  ${chalk.cyan(`pnpm exports:${name}`)} ${chalk.dim(args)}`;
}

function section(title: string, lines: string[]): void {
  console.log(`\n${chalk.bold(title)}`);
  for (const line of lines) console.log(line);
}

export type HelpTopic = 'all' | 'inventory' | 'diff' | 'validate' | 'trend' | 'timeline' | 'graph' | 'help';

export function printHelp(topic: HelpTopic = 'all'): void {
  console.log(`\n${BRAND}  ${chalk.bold('maintainer tools for @i18nprune/core export surface')}`);

  if (topic === 'all' || topic === 'inventory') {
    section('inventory — summarize root barrel exports', [
      cmd('inventory', '[ref] [flags]'),
      '',
      `  ${chalk.dim('Prints')} root flat count, namespace count, tier and category breakdown.`,
      `  ${chalk.dim('Default ref')} working tree (includes uncommitted edits).`,
      '',
      `  ${chalk.bold('Refs')}`,
      `    ${chalk.dim('(omit)')}     working tree`,
      `    HEAD         committed HEAD`,
      `    v0.1.4       tag`,
      `    d60df9e      short commit SHA (git must resolve uniquely)`,
      '',
      `  ${chalk.bold('Flags')}`,
      `    -v, --verbose   symbol table: tier, category, symbolKind, targetSubpath; subpath rollups`,
      `    --no-cache      skip reading/writing .exports/cache/ for this run`,
      `    -h, --help      show this section`,
      '',
      `  ${chalk.bold('Output')}`,
      `    ${chalk.dim('root flat')}   count of flat exports on packages/core/src/index.ts`,
      `    ${chalk.dim('stable/advanced/internal')}   governance tiers (see inventory/tiers.ts)`,
      `    ${chalk.dim('cache')}   hit/miss against .exports/cache/<sha>/inventory.full.json`,
    ]);
  }

  if (topic === 'all' || topic === 'diff') {
    section('diff — compare export surfaces between refs', [
      cmd('diff', '[ref|A..B] [flags]'),
      '',
      `  ${chalk.dim('Default')} HEAD → working tree.`,
      '',
      `  ${chalk.bold('Forms')}`,
      `    ${chalk.dim('(omit)')}           HEAD → working tree`,
      `    v0.1.4               v0.1.4 → working tree`,
      `    v0.1.3..v0.1.4       tag range (two commits)`,
      `    a6caa74..HEAD        SHA or tag .. SHA or tag`,
      '',
      `  ${chalk.bold('Flags')}`,
      `    -v, --verbose   category, symbolKind, targetSubpath for each added/removed symbol`,
      `    --no-cache      bypass .exports/cache/ for this run`,
      `    -h, --help      show this section`,
      '',
      `  ${chalk.bold('Output')}`,
      `    ${chalk.dim('Added/Removed')}   flat export names only (namespaces not listed here)`,
      `    ${chalk.dim('Tier violations')}   internal/advanced symbols promoted against policy`,
    ]);
  }

  if (topic === 'all' || topic === 'validate') {
    section('validate — governance checks on working tree', [
      cmd('validate', '[flags]'),
      '',
      `  ${chalk.dim('Exits')} 0 when checks pass, 1 when they fail.`,
      '',
      `  ${chalk.bold('Flags')}`,
      `    -v, --verbose   all notes, path parity gaps, tier flat leaks`,
      `    --since=<ref>   reserved for future delta validation`,
      `    -h, --help      show this section`,
      '',
      `  ${chalk.bold('Output')}`,
      `    ${chalk.dim('✓/✗ lines')}   tsconfig ↔ npm exports parity, unclassified root flats`,
      `    ${chalk.dim('notes')}   policy gaps (internal/advanced still flat on root, etc.)`,
    ]);
  }

  if (topic === 'all' || topic === 'trend') {
    section('trend — export counts across release tags', [
      cmd('trend', '[flags]'),
      '',
      `  ${chalk.dim('Prints')} root flat / stable / advanced / internal per \`v*\` tag.`,
      `  ${chalk.dim('Warms')} cache for each tag when missing.`,
      '',
      `  ${chalk.bold('Flags')}`,
      `    --tags=<n>      last N version tags (default 12)`,
      `    -v, --verbose   category breakdown on latest tag`,
      `    --no-cache      bypass cache for this run`,
      `    -h, --help      show this section`,
      '',
      `  ${chalk.bold('Output')}`,
      `    ${chalk.dim('flat/stable/adv/int')}   per-tag root export counts; Δ footer compares first vs last tag in window`,
    ]);
  }

  if (topic === 'all' || topic === 'timeline') {
    section('timeline — commits that changed the root export barrel', [
      cmd('timeline', '[range] [flags]'),
      '',
      `  ${chalk.dim('Default range')} @4w (last 4 weeks, UTC).`,
      `  ${chalk.dim('Scope')} git log on ${chalk.white('packages/core/src/index.ts')} only — not every repo commit.`,
      `  ${chalk.dim('Example')} @3m has ~330 repo commits but only commits that edit the root barrel appear.`,
      '',
      `  ${chalk.bold('Range formats')}`,
      ...formatTimelineRangeHelp().map((line) => `    ${chalk.dim(line)}`),
      '',
      `  ${chalk.bold('Output')}`,
      `    ${chalk.dim('flat')}   root flat export count at that commit`,
      `    ${chalk.dim('Δ')}      change in flat vs the row above (newest commit first; — on first row)`,
      `    ${chalk.dim('       ')} +N = N more flat exports than the newer barrel edit above; -N = N fewer`,
      `    ${chalk.dim('       ')} only steps between consecutive barrel edits, not every repo commit`,
      '',
      `  ${chalk.bold('Flags')}`,
      `    --limit=<n>     max commits (default 20; 0 = no limit)`,
      `    -v, --verbose   full subjects; per-commit warm timing on stderr`,
      `    --no-cache      bypass cache for this run`,
      `    -h, --help      show this section`,
    ]);
  }

  if (topic === 'all' || topic === 'graph') {
    section('graph — re-export map (target subpaths + modules)', [
      cmd('graph', '[ref] [flags]'),
      '',
      `  ${chalk.dim('Prints')} governance groups from snapshot edges[] and root namespaces.`,
      `  ${chalk.dim('Default ref')} working tree.`,
      '',
      `  ${chalk.bold('Flags')}`,
      `    -v, --verbose   all subpath groups, sample symbols per module`,
      `    --no-cache      bypass cache for this run`,
      `    -h, --help      show this section`,
      '',
      `  ${chalk.bold('Output')}`,
      `    ${chalk.dim('By target subpath')}   governance grouping (flat + namespace counts per npm subpath)`,
      `    ${chalk.dim('Root namespaces')}   export * as name → source file → target subpath`,
    ]);
  }

  if (topic === 'all' || topic === 'help') {
    section('help', [cmd('help'), '', `  ${chalk.dim('Prints')} full usage.`]);
  }

  if (topic === 'all') {
    section('global', [
      `  ${chalk.bold('Commands')} inventory, diff, validate, trend, timeline, graph, help`,
      `  ${chalk.bold('Cache')}   ${chalk.dim('.exports/cache/')} per-sha: inventory.full.json, timeline.summary.json`,
      `  ${chalk.bold('Docs')}    ${chalk.dim('scripts/exports/README.md')}`,
      `  ${chalk.bold('Output')}  each command section above documents key columns and labels`,
      `  ${chalk.bold('Debug')}   EXPORTS_DEBUG=1 for unexpected error stacks`,
      '',
      `  ${chalk.dim('Resolving a ref warms')} ${chalk.dim('.exports/cache/')} ${chalk.dim('(gitignored). Nothing is committed to the repo.')}`,
    ]);
  }

  console.log('');
}

export function printHelpHint(command?: string): void {
  const hint = command
    ? `Run ${chalk.cyan(`pnpm exports:${command} --help`)} for command-specific usage.`
    : `Run ${chalk.cyan('pnpm exports:help')} or see ${chalk.dim('scripts/exports/README.md')}.`;
  console.log(`${BRAND}  ${chalk.dim('hint')}  ${hint}\n`);
}
