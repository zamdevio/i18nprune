#!/usr/bin/env node
/**
 * Keep monorepo release versions aligned.
 *
 * Source of truth for --sync: root package.json `version`.
 * Targets: packages/core, packages/cli.
 *
 * Usage:
 *   pnpm versions:sync
 *   pnpm versions:verify
 *   pnpm versions:up -- 1.0.2
 *   pnpm versions:up -- 1.0.2 --force
 *   tsx scripts/release/sync.ts --sync --verify
 *   tsx scripts/release/sync.ts --help
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const PACKAGE_PATHS = [
  path.join(root, 'package.json'),
  path.join(root, 'packages/core/package.json'),
  path.join(root, 'packages/cli/package.json'),
] as const;

const LABELS = ['root (i18nprune)', '@i18nprune/core', '@i18nprune/cli'] as const;

/** Warn when major jumps by more than this (e.g. 1.x → 3.x). */
const MAX_MAJOR_JUMP = 1;
/** Warn when minor jumps by more than this within the same major. */
const MAX_MINOR_JUMP = 10;

type Flags = {
  force: boolean;
  help: boolean;
  sync: boolean;
  up: string | null;
  verify: boolean;
};

type PackageJson = {
  name?: string;
  version?: string;
  [key: string]: unknown;
};

type SemVer = {
  major: number;
  minor: number;
  patch: number;
  prerelease: string | null;
  raw: string;
};

type Risk = {
  code: 'downgrade' | 'far_major' | 'far_minor';
  message: string;
};

function dim(text: string): string {
  return chalk.dim(text);
}

function ok(text: string): string {
  return chalk.green(text);
}

function warn(text: string): string {
  return chalk.yellow(text);
}

function err(text: string): string {
  return chalk.red(text);
}

function info(text: string): string {
  return chalk.cyan(text);
}

function bold(text: string): string {
  return chalk.bold(text);
}

function heading(title: string): void {
  console.log();
  console.log(bold(info(`▸ ${title}`)));
}

function step(label: string, detail: string): void {
  console.log(`  ${ok('✓')} ${label}  ${dim(detail)}`);
}

function stepWarn(label: string, detail: string): void {
  console.log(`  ${warn('!')} ${label}  ${detail}`);
}

function stepFail(label: string, detail: string): void {
  console.log(`  ${err('✗')} ${label}  ${detail}`);
}

function printHelp(): void {
  console.log(`${bold('Usage:')} tsx scripts/release/sync.ts [options]

Align package versions across the monorepo release line
(${dim('root → @i18nprune/core → @i18nprune/cli')}).

${bold('Options:')}
  --up <version>      Set all three packages to <version>
  --sync              Copy root version → packages/core + packages/cli
  --verify            Fail if root / core / cli versions differ
  --force             Allow downgrades and far version jumps (with warnings)
  -h, --help          Show this help

Flags may be combined. Order: ${dim('--up → --sync → --verify')}.
With no options, this help is shown.

${bold('Risks (need --force):')}
  • target lower than current line (downgrade)
  • major jump greater than +${MAX_MAJOR_JUMP}
  • minor jump greater than +${MAX_MINOR_JUMP} within the same major

${bold('Examples:')}
  pnpm versions:verify
  pnpm versions:sync
  pnpm versions:sync -- --force
  pnpm versions:up -- 1.0.2
  pnpm versions:up -- 0.9.0 --force
  tsx scripts/release/sync.ts --up 1.1.0 --verify
`);
}

function parseArgs(argv: string[]): Flags {
  let force = false;
  let help = false;
  let sync = false;
  let up: string | null = null;
  let verify = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--') continue;
    if (arg === '-h' || arg === '--help') {
      help = true;
      continue;
    }
    if (arg === '--force') {
      force = true;
      continue;
    }
    if (arg === '--sync') {
      sync = true;
      continue;
    }
    if (arg === '--verify') {
      verify = true;
      continue;
    }
    if (arg === '--up') {
      let next = argv[++i];
      // pnpm run versions:up -- 1.0.2 → argv is [--up, --, 1.0.2]
      while (next === '--') next = argv[++i];
      if (!next || next.startsWith('-')) {
        console.error(err('Missing version after --up'));
        printHelp();
        process.exit(1);
      }
      up = next;
      continue;
    }
    // Positional semver (e.g. leftover after pnpm -- forwarding)
    if (!arg.startsWith('-') && parseSemver(arg)) {
      if (up !== null) {
        console.error(err(`Unexpected extra version: ${arg}`));
        process.exit(1);
      }
      up = arg;
      continue;
    }
    console.error(err(`Unknown flag: ${arg}`));
    printHelp();
    process.exit(1);
  }

  return { force, help, sync, up, verify };
}

function readPackage(packageJsonPath: string): PackageJson {
  return JSON.parse(readFileSync(packageJsonPath, 'utf8')) as PackageJson;
}

function writePackage(packageJsonPath: string, data: PackageJson): void {
  writeFileSync(packageJsonPath, `${JSON.stringify(data, null, 2)}\n`);
}

function readVersions(): string[] {
  return PACKAGE_PATHS.map((pkgPath, i) => {
    const data = readPackage(pkgPath);
    if (!data.version) {
      throw new Error(`Missing "version" in ${LABELS[i]} (${pkgPath})`);
    }
    return data.version;
  });
}

function parseSemver(raw: string): SemVer | null {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(raw.trim());
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ?? null,
    raw,
  };
}

function compareSemver(a: SemVer, b: SemVer): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  if (a.patch !== b.patch) return a.patch - b.patch;
  if (a.prerelease === b.prerelease) return 0;
  if (a.prerelease === null) return 1;
  if (b.prerelease === null) return -1;
  return a.prerelease < b.prerelease ? -1 : a.prerelease > b.prerelease ? 1 : 0;
}

function maxSemver(versions: string[]): SemVer {
  const parsed = versions.map((v) => {
    const p = parseSemver(v);
    if (!p) throw new Error(`Invalid semver: ${v}`);
    return p;
  });
  return parsed.reduce((best, cur) => (compareSemver(cur, best) > 0 ? cur : best));
}

function bumpSuggestions(from: SemVer): { patch: string; minor: string; major: string } {
  return {
    patch: `${from.major}.${from.minor}.${from.patch + 1}`,
    minor: `${from.major}.${from.minor + 1}.0`,
    major: `${from.major + 1}.0.0`,
  };
}

function assessChange(fromRaw: string, toRaw: string): Risk[] {
  const from = parseSemver(fromRaw);
  const to = parseSemver(toRaw);
  if (!from || !to) {
    return [{ code: 'far_major', message: `Cannot parse semver (${fromRaw} → ${toRaw})` }];
  }

  const risks: Risk[] = [];
  const cmp = compareSemver(to, from);

  if (cmp < 0) {
    risks.push({
      code: 'downgrade',
      message: `downgrade ${bold(fromRaw)} → ${bold(toRaw)} (lower than current line)`,
    });
  }

  const majorDelta = to.major - from.major;
  if (majorDelta > MAX_MAJOR_JUMP) {
    risks.push({
      code: 'far_major',
      message: `major jump +${majorDelta} (${fromRaw} → ${toRaw}); usual next major is ${from.major + 1}.0.0`,
    });
  }

  if (majorDelta === 0) {
    const minorDelta = to.minor - from.minor;
    if (minorDelta > MAX_MINOR_JUMP) {
      risks.push({
        code: 'far_minor',
        message: `minor jump +${minorDelta} within ${from.major}.x (threshold ${MAX_MINOR_JUMP})`,
      });
    }
  }

  return risks;
}

function printRecommendations(line: SemVer): void {
  const next = bumpSuggestions(line);
  console.log(dim('  Recommended next bumps from line ') + bold(line.raw) + dim(':'));
  console.log(`    ${info('patch')}  ${next.patch}`);
  console.log(`    ${info('minor')}  ${next.minor}`);
  console.log(`    ${info('major')}  ${next.major}`);
}

function requireForceOrExit(risks: Risk[], force: boolean, context: string): void {
  if (risks.length === 0) return;

  heading(`Risks — ${context}`);
  for (const risk of risks) {
    stepWarn(risk.code, risk.message);
  }

  if (!force) {
    console.log();
    console.log(err('Blocked.') + ' Re-run with ' + bold('--force') + ' if this is intentional.');
    process.exit(1);
  }

  console.log();
  console.log(warn('Continuing with --force (intentional override).'));
}

function reportLine(versions: string[]): void {
  for (let i = 0; i < versions.length; i += 1) {
    console.log(`    ${dim('·')} ${LABELS[i].padEnd(22)} ${bold(versions[i])}`);
  }
}

function syncVersions(force: boolean): string {
  heading('Sync');
  const versions = readVersions();
  const rootVersion = versions[0];
  step('source', `${LABELS[0]} @ ${rootVersion}`);

  const risks: Risk[] = [];
  for (let i = 1; i < versions.length; i += 1) {
    if (versions[i] === rootVersion) continue;
    risks.push(...assessChange(versions[i], rootVersion).map((r) => ({
      ...r,
      message: `${LABELS[i]}: ${r.message}`,
    })));
  }

  if (risks.length > 0) {
    const line = maxSemver(versions);
    printRecommendations(line);
    requireForceOrExit(risks, force, 'sync would change packages toward root');
  }

  let changed = 0;
  for (let i = 1; i < PACKAGE_PATHS.length; i += 1) {
    const pkgPath = PACKAGE_PATHS[i];
    const data = readPackage(pkgPath);
    const previous = data.version ?? '(missing)';
    if (previous === rootVersion) {
      step('unchanged', `${LABELS[i]} @ ${rootVersion}`);
      continue;
    }
    data.version = rootVersion;
    writePackage(pkgPath, data);
    changed += 1;
    const prevParsed = parseSemver(previous);
    const nextParsed = parseSemver(rootVersion);
    const isDown =
      prevParsed !== null && nextParsed !== null && compareSemver(nextParsed, prevParsed) < 0;
    const arrow = isDown
      ? warn(`${previous} → ${rootVersion}`)
      : ok(`${previous} → ${rootVersion}`);
    step('synced', `${LABELS[i]} ${arrow}`);
  }

  if (changed === 0) {
    step('done', 'already aligned with root');
  } else {
    step('done', `wrote ${changed} package.json file(s)`);
  }

  return rootVersion;
}

function setAllVersions(target: string, force: boolean): void {
  heading('Up');
  const parsed = parseSemver(target);
  if (!parsed) {
    throw new Error(`Invalid semver: ${target} (expected X.Y.Z or X.Y.Z-prerelease)`);
  }

  const versions = readVersions();
  const line = maxSemver(versions);

  step('current line', `max(root, core, cli) = ${bold(line.raw)}`);
  reportLine(versions);
  step('target', bold(parsed.raw));

  const risks = assessChange(line.raw, parsed.raw);
  printRecommendations(line);
  requireForceOrExit(risks, force, `bump to ${parsed.raw}`);

  for (let i = 0; i < PACKAGE_PATHS.length; i += 1) {
    const pkgPath = PACKAGE_PATHS[i];
    const data = readPackage(pkgPath);
    const previous = data.version ?? '(missing)';
    if (previous === parsed.raw) {
      step('unchanged', `${LABELS[i]} @ ${parsed.raw}`);
      continue;
    }
    data.version = parsed.raw;
    writePackage(pkgPath, data);
    step('updated', `${LABELS[i]} ${dim(previous)} → ${ok(parsed.raw)}`);
  }

  step('done', `release line set to ${bold(parsed.raw)}`);
}

function verifyVersions(): void {
  heading('Verify');
  const versions = readVersions();
  const [rootVersion, ...rest] = versions;
  const mismatched = rest
    .map((v, i) => ({ label: LABELS[i + 1], version: v }))
    .filter((entry) => entry.version !== rootVersion);

  if (mismatched.length === 0) {
    step('aligned', `@ ${bold(rootVersion)}`);
    reportLine(versions);
    step('done', ok('all packages match'));
    return;
  }

  stepFail('drift', 'package versions differ');
  reportLine(versions);
  console.log();
  console.log(err('Fix with:') + ` ${bold('pnpm versions:sync')}  ${dim('(or pnpm versions:up -- <version>)')}`);
  process.exit(1);
}

function main(): void {
  const flags = parseArgs(process.argv.slice(2));
  const hasAction = flags.sync || flags.verify || flags.up !== null;

  if (flags.help || !hasAction) {
    printHelp();
    process.exit(0);
  }

  try {
    if (flags.up !== null) {
      setAllVersions(flags.up, flags.force);
    }
    if (flags.sync) {
      syncVersions(flags.force);
    }
    if (flags.verify) {
      verifyVersions();
    }
    console.log();
  } catch (error) {
    console.error(err(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

main();
