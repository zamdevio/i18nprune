#!/usr/bin/env node
/**
 * Forbidden import / dependency guard for @i18nprune/ui.
 * See maintainer/systems/ui.md
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const uiRoot = join(repoRoot, 'packages/ui');
const uiSrc = join(uiRoot, 'src');
const uiPkgPath = join(uiRoot, 'package.json');

/** @type {{ label: string; pattern: RegExp }[]} */
const FORBIDDEN_IN_SOURCE = [
  { label: '@i18nprune/core', pattern: /@i18nprune\/core/ },
  { label: 'react-router-dom', pattern: /react-router-dom/ },
  { label: 'hono', pattern: /\bhono\b/ },
  { label: 'zod', pattern: /\bzod\b/ },
  { label: 'fflate', pattern: /\bfflate\b/ },
  { label: 'apps/workers', pattern: /apps\/workers/ },
  { label: '@i18nprune/core/report-schema', pattern: /@i18nprune\/core\/report-schema/ },
  { label: 'i18nprune workspace package', pattern: /from ['"]i18nprune['"]/ },
];

/** @type {string[]} */
const FORBIDDEN_PKG_DEPS = [
  '@i18nprune/core',
  '@i18nprune/core/report-schema',
  'i18nprune',
  'react-router-dom',
  'hono',
  'zod',
  'fflate',
];

/**
 * @param {string} dir
 * @param {string[]} acc
 */
function walkSourceFiles(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) {
      if (name === 'node_modules') continue;
      walkSourceFiles(path, acc);
      continue;
    }
    if (/\.(ts|tsx|js|mjs|cjs)$/.test(name)) acc.push(path);
  }
  return acc;
}

/** @type {string[]} */
const violations = [];

function checkSourceFile(filePath) {
  const text = readFileSync(filePath, 'utf8');
  const rel = filePath.replace(`${repoRoot}/`, '');
  for (const { label, pattern } of FORBIDDEN_IN_SOURCE) {
    if (pattern.test(text)) {
      violations.push(`${rel}: forbidden reference to ${label}`);
    }
  }
}

function checkPackageJson() {
  const pkg = JSON.parse(readFileSync(uiPkgPath, 'utf8'));
  const sections = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];
  for (const section of sections) {
    const deps = pkg[section];
    if (!deps || typeof deps !== 'object') continue;
    for (const name of Object.keys(deps)) {
      if (FORBIDDEN_PKG_DEPS.includes(name)) {
        violations.push(`packages/ui/package.json: forbidden ${section} "${name}"`);
      }
    }
  }
}

walkSourceFiles(uiSrc).forEach(checkSourceFile);
checkPackageJson();

if (violations.length > 0) {
  console.error('ui:purity failed — forbidden imports or dependencies in @i18nprune/ui:\n');
  for (const v of violations) console.error(`  • ${v}`);
  console.error('\nSee maintainer/systems/ui.md');
  process.exit(1);
}

console.log('ui:purity OK — packages/ui has no forbidden imports or dependencies');
