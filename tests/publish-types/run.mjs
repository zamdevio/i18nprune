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

const fixturePkgPath = path.join(fixtureRoot, 'package.json');
const fixtureLockPath = path.join(fixtureRoot, 'pnpm-lock.yaml');

/**
 * Point the npm-consumer fixture at the packed CLI tarball for the current root version.
 * Stale lockfiles (e.g. pinned to an old 0.1.0 pack) are removed so install resolves fresh.
 * @param {string} version root package.json semver
 */
function syncFixtureCliTarballRef(version) {
  const tarballRef = `file:../../../${tarballFileName(rootPkg.name, version)}`;
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

if (!fs.existsSync(cliTgzPath)) {
  console.error(`Missing ${cliTgzPath} (expected i18nprune@${rootPkg.version}). Run without --skip-pack or pnpm pack at repo root.`);
  process.exit(1);
}

if (!fs.existsSync(coreTgzPath)) {
  console.error(`Missing ${coreTgzPath} (expected @i18nprune/core@${corePkg.version}). Run without --skip-pack or pnpm pack in packages/core.`);
  process.exit(1);
}

syncFixtureCliTarballRef(rootPkg.version);

const fixtureNodeModules = path.join(fixtureRoot, 'node_modules');
if (fs.existsSync(fixtureNodeModules)) {
  fs.rmSync(fixtureNodeModules, { recursive: true, force: true });
}

console.log('→ fixture: pnpm install --ignore-workspace');
run('pnpm', ['install', '--ignore-workspace'], fixtureRoot, 'fixture install');

console.log('→ fixture: tsc --skipLibCheck false');
run(
  'pnpm',
  ['exec', 'tsc', '-p', 'tsconfig.json', '--skipLibCheck', 'false'],
  fixtureRoot,
  'fixture tsc',
);

console.log('publish:verify OK');
