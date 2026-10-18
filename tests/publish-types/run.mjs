#!/usr/bin/env node
/**
 * End-to-end publish types check: build CLI tarball, install in npm-consumer fixture, tsc with skipLibCheck false.
 *
 * Usage (repo root):
 *   node tests/publish-types/run.mjs
 *   node tests/publish-types/run.mjs --skip-build   # dist/ + pack already done
 *   node tests/publish-types/run.mjs --skip-pack    # i18nprune-*.tgz already at repo root
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const fixtureRoot = path.join(repoRoot, 'tests', 'publish-types', 'fixture');

const argv = process.argv.slice(2);
const skipBuild = argv.includes('--skip-build');
const skipPack = argv.includes('--skip-pack');

const rootPkgPath = path.join(repoRoot, 'package.json');
const corePkgPath = path.join(repoRoot, 'packages', 'core', 'package.json');

const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
const corePkg = JSON.parse(fs.readFileSync(corePkgPath, 'utf8'));

/** @param {string} packageName npm `name` field (may include scope) */
function tarballFileName(packageName, version) {
  const base = packageName.startsWith('@') ? packageName.slice(1).replace('/', '-') : packageName;
  return `${base}-${version}.tgz`;
}

const cliTgzName = tarballFileName(rootPkg.name, rootPkg.version);
const cliTgzPath = path.join(repoRoot, cliTgzName);
const coreTgzName = tarballFileName(corePkg.name, corePkg.version);
const coreTgzPath = path.join(repoRoot, coreTgzName);

/**
 * Stable filename the fixture pins to, so a release bump never edits
 * `tests/publish-types/fixture/package.json`. Refreshed from the newest pack on each run.
 */
const CLI_TGZ_STABLE_NAME = `${rootPkg.name}-latest.tgz`;
const cliTgzStablePath = path.join(repoRoot, CLI_TGZ_STABLE_NAME);
/** Matches `i18nprune-<version>.tgz` but not the stable `i18nprune-latest.tgz`. */
const CLI_TGZ_PATTERN = new RegExp(`^${rootPkg.name}-\\d[\\w.+-]*\\.tgz$`);

const fixturePkgPath = path.join(fixtureRoot, 'package.json');
const fixtureLockPath = path.join(fixtureRoot, 'pnpm-lock.yaml');

/**
 * Pick the CLI tarball to hand to the fixture: the current version's pack when present,
 * else the newest `i18nprune-<version>.tgz` at the repo root (covers `--skip-pack`).
 * @returns {string | null} absolute path
 */
function resolveCliTarball() {
  if (fs.existsSync(cliTgzPath)) return cliTgzPath;
  const newest = fs
    .readdirSync(repoRoot)
    .filter((name) => CLI_TGZ_PATTERN.test(name))
    .map((name) => {
      const full = path.join(repoRoot, name);
      return { full, mtime: fs.statSync(full).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime)[0];
  return newest?.full ?? null;
}

/**
 * Copy the resolved pack to `i18nprune-latest.tgz` so the fixture dependency stays stable
 * across version bumps.
 * @param {string} source absolute path to a packed CLI tarball
 */
function publishStableCliTarball(source) {
  fs.copyFileSync(source, cliTgzStablePath);
  console.log(`→ ${path.basename(source)} → ${CLI_TGZ_STABLE_NAME}`);
}

/**
 * Point the npm-consumer fixture at the stable `i18nprune-latest.tgz` ref.
 * Stale lockfiles (e.g. pinned to an old pack) are removed so install resolves fresh.
 */
function syncFixtureCliTarballRef() {
  const tarballRef = `file:../../../${CLI_TGZ_STABLE_NAME}`;
  const fixturePkg = JSON.parse(fs.readFileSync(fixturePkgPath, 'utf8'));
  const prev = fixturePkg.dependencies?.i18nprune;
  if (prev !== tarballRef) {
    fixturePkg.dependencies.i18nprune = tarballRef;
    fs.writeFileSync(fixturePkgPath, `${JSON.stringify(fixturePkg, null, 2)}\n`);
    console.log(`→ fixture package.json: i18nprune ${prev ?? '(missing)'} → ${tarballRef}`);
  }
  if (fs.existsSync(fixtureLockPath)) {
    fs.unlinkSync(fixtureLockPath);
    console.log('→ removed stale tests/publish-types/fixture/pnpm-lock.yaml');
  }
}

/**
 * @param {string} command
 * @param {string[]} args
 * @param {string} cwd
 * @param {string} label
 */
function run(command, args, cwd, label) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', env: process.env });
  if (result.status !== 0) {
    console.error(`publish:verify failed: ${label}`);
    process.exit(result.status ?? 1);
  }
}

if (!skipBuild) {
  console.log('→ pnpm run cli:build');
  run('pnpm', ['run', 'cli:build'], repoRoot, 'cli:build');
}

console.log('→ scripts/dts/fix-core-dts.mjs --test');
run('node', ['scripts/dts/fix-core-dts.mjs', '--test'], repoRoot, 'dts test');

if (rootPkg.version !== corePkg.version) {
  console.warn(
    `publish:verify warning: root (${rootPkg.version}) and @i18nprune/core (${corePkg.version}) semver differ — align before npm publish.`,
  );
}

if (!skipPack) {
  for (const stale of [cliTgzPath, coreTgzPath]) {
    if (fs.existsSync(stale)) {
      fs.unlinkSync(stale);
    }
  }
  console.log(`→ pnpm pack (CLI ${rootPkg.name}@${rootPkg.version}) → ${cliTgzName}`);
  run('pnpm', ['pack', '--pack-destination', repoRoot], repoRoot, 'pnpm pack (cli)');

  console.log(`→ pnpm pack (core ${corePkg.name}@${corePkg.version}) → ${coreTgzName}`);
  run('pnpm', ['pack', '--pack-destination', repoRoot], path.join(repoRoot, 'packages', 'core'), 'pnpm pack (core)');
}

const cliTarball = resolveCliTarball();
if (!cliTarball) {
  console.error(
    `Missing a packed CLI tarball (expected ${cliTgzName}, or any ${rootPkg.name}-<version>.tgz). Run without --skip-pack or pnpm pack at repo root.`,
  );
  process.exit(1);
}
if (path.basename(cliTarball) !== cliTgzName) {
  console.warn(
    `publish:verify warning: no ${cliTgzName}; using newest pack ${path.basename(cliTarball)}.`,
  );
}

if (!fs.existsSync(coreTgzPath)) {
  console.error(`Missing ${coreTgzPath} (expected @i18nprune/core@${corePkg.version}). Run without --skip-pack or pnpm pack in packages/core.`);
  process.exit(1);
}

publishStableCliTarball(cliTarball);
syncFixtureCliTarballRef();

const fixtureNodeModules = path.join(fixtureRoot, 'node_modules');
if (fs.existsSync(fixtureNodeModules)) {
  fs.rmSync(fixtureNodeModules, { recursive: true, force: true });
}

// npm-consumer simulation: use npm so resolution cannot walk into the monorepo pnpm workspace.
console.log('→ fixture: npm install (consumer layout)');
run('npm', ['install', '--no-package-lock', '--ignore-scripts'], fixtureRoot, 'fixture install');

const fixtureTsc = path.join(fixtureRoot, 'node_modules', 'typescript', 'bin', 'tsc');
if (!fs.existsSync(fixtureTsc)) {
  console.error('publish:verify failed: fixture missing typescript after npm install');
  process.exit(1);
}

console.log('→ fixture: tsc --skipLibCheck false');
run(
  process.execPath,
  [fixtureTsc, '-p', 'tsconfig.json', '--skipLibCheck', 'false'],
  fixtureRoot,
  'fixture tsc',
);

console.log('publish:verify OK');
