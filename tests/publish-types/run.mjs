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

const rootPkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
const tgzName = `${rootPkg.name}-${rootPkg.version}.tgz`;
const tgzPath = path.join(repoRoot, tgzName);

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

if (!skipPack) {
  if (fs.existsSync(tgzPath)) {
    fs.unlinkSync(tgzPath);
  }
  console.log(`→ pnpm pack → ${tgzName}`);
  run('pnpm', ['pack', '--pack-destination', repoRoot], repoRoot, 'pnpm pack');
}

if (!fs.existsSync(tgzPath)) {
  console.error(`Missing ${tgzPath}. Run without --skip-pack or run pnpm pack at repo root.`);
  process.exit(1);
}

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
