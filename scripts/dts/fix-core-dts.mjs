#!/usr/bin/env node
/**
 * tsup DTS rollup bug workaround for `export * as namespace` barrels.
 *
 * Pattern: when a namespace module re-exports `export type { Foo }` and the root barrel
 * does `export * as ns from './namespace'`, the rolled `dist/core.d.ts` may emit invalid
 * `declare const ns_Foo: typeof Foo` lines where `Foo` is type-only (TS2693).
 *
 * Usage:
 *   node scripts/dts/fix-core-dts.mjs --no-test   # sanitize dist/core.d.ts (default)
 *   node scripts/dts/fix-core-dts.mjs --no-test --dts=packages/core/dist/index.d.ts
 *   node scripts/dts/fix-core-dts.mjs --test      # assert no invalid aliases (CI / vitest)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const argv = process.argv.slice(2);
const runTests = argv.includes('--test');
const fixFile = argv.includes('--no-test') || (!runTests && !argv.includes('--test-only'));

const dtsFlag = argv.find((arg) => arg.startsWith('--dts='));
const coreDtsPath = dtsFlag
  ? path.resolve(repoRoot, dtsFlag.slice('--dts='.length))
  : path.join(repoRoot, 'dist', 'core.d.ts');

/**
 * @param {string} content
 * @returns {{ typeOnlySymbols: Set<string>, valueSymbols: Set<string> }}
 */
export function collectDeclarationSymbols(content) {
  const typeOnlySymbols = new Set();
  const valueSymbols = new Set();

  for (const m of content.matchAll(/\btype\s+([A-Za-z_$][\w$]*)\s*=/g)) {
    typeOnlySymbols.add(m[1]);
  }
  for (const m of content.matchAll(/\binterface\s+([A-Za-z_$][\w$]*)\b/g)) {
    typeOnlySymbols.add(m[1]);
  }
  for (const m of content.matchAll(
    /^\s*declare\s+(?:const|function|class|enum)\s+([A-Za-z_$][\w$]*)\b/gm,
  )) {
    valueSymbols.add(m[1]);
  }

  return { typeOnlySymbols, valueSymbols };
}

/**
 * @param {string} content
 * @param {string} symbolName
 */
export function hasModuleLevelValueDeclaration(content, symbolName) {
  const escaped = symbolName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(
    `^\\s*declare\\s+(?:const|function|class|enum)\\s+${escaped}\\b`,
    'gm',
  ).test(content);
}

/**
 * @param {string} symbolName
 * @param {{ typeOnlySymbols: Set<string>, valueSymbols: Set<string> }} symbols
 * @param {string} content
 */
export function isTypeOnlySymbol(symbolName, symbols, content) {
  if (symbols.valueSymbols.has(symbolName)) return false;
  if (symbols.typeOnlySymbols.has(symbolName)) return true;
  return !hasModuleLevelValueDeclaration(content, symbolName);
}

/**
 * @param {string} content
 * @returns {Array<{ aliasName: string, symbolName: string }>}
 */
export function findInvalidTypeofAliases(content) {
  const symbols = collectDeclarationSymbols(content);
  const invalid = [];

  for (const m of content.matchAll(
    /^\s*declare const ([A-Za-z_$][\w$]*): typeof ([A-Za-z_$][\w$]*);\s*$/gm,
  )) {
    const aliasName = m[1];
    const symbolName = m[2];
    if (isTypeOnlySymbol(symbolName, symbols, content)) {
      invalid.push({ aliasName, symbolName });
    }
  }

  return invalid;
}

/**
 * @param {string} inner
 * @param {Set<string>} removedAliases
 */
function sanitizeExportBlock(inner, removedAliases) {
  const items = inner
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  const kept = items.filter((part) => {
    const match = part.match(/^(?:type\s+)?([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/);
    if (!match) return true;
    return !removedAliases.has(match[1]);
  });
  if (kept.length === 0) return 'export {}';
  return `export { ${kept.join(', ')} }`;
}

/**
 * @param {string} content
 * @returns {{ content: string, removed: Array<{ aliasName: string, symbolName: string }> }}
 */
export function sanitizeCoreDtsContent(content) {
  const invalid = findInvalidTypeofAliases(content);
  const removedAliases = new Set(invalid.map((row) => row.aliasName));

  let next = content.replace(
    /^\s*declare const ([A-Za-z_$][\w$]*): typeof ([A-Za-z_$][\w$]*);\s*$/gm,
    (line, aliasName) => {
      if (!removedAliases.has(aliasName)) return line;
      return '';
    },
  );

  next = next.replace(/export\s+\{([^}]+)\}/g, (_, inner) => sanitizeExportBlock(inner, removedAliases));
  next = next.replace(/\n{3,}/g, '\n\n');

  return { content: next, removed: invalid };
}

function assertNoInvalidAliases(label, content) {
  const invalid = findInvalidTypeofAliases(content);
  if (invalid.length > 0) {
    const detail = invalid.map((row) => `${row.aliasName}: typeof ${row.symbolName}`).join(', ');
    throw new Error(`${label}: invalid typeof aliases (${invalid.length}): ${detail}`);
  }
}

export function runCoreDtsTests() {
  const sample = `
type TranslatePolicy = { mode: string };
declare const translator_TranslatePolicy: typeof TranslatePolicy;
declare namespace translator {
  export { translator_TranslatePolicy as TranslatePolicy };
}
`;
  const sampleInvalid = findInvalidTypeofAliases(sample);
  if (
    sampleInvalid.length !== 1 ||
    sampleInvalid[0]?.aliasName !== 'translator_TranslatePolicy' ||
    sampleInvalid[0]?.symbolName !== 'TranslatePolicy'
  ) {
    throw new Error('sample detection: expected one invalid translator_TranslatePolicy alias');
  }

  const { content: sanitized, removed } = sanitizeCoreDtsContent(sample);
  if (removed.length !== 1) {
    throw new Error(`sample sanitize: expected 1 removal, got ${removed.length}`);
  }
  assertNoInvalidAliases('sanitized sample', sanitized);

  if (fs.existsSync(coreDtsPath)) {
    const dts = fs.readFileSync(coreDtsPath, 'utf8');
    assertNoInvalidAliases(coreDtsPath, dts);

    if (coreDtsPath.endsWith('packages/core/dist/index.d.ts')) {
      if (/declare namespace validate \{\s*export \{\};\s*\}/.test(dts)) {
        throw new Error(
          `${coreDtsPath}: declare namespace validate is empty — use index-only DTS rollup in packages/core/tsup.config.ts`,
        );
      }
      if (!dts.includes('validate_computeMissingLiteralKeysFromResolvedKeys')) {
        throw new Error(
          `${coreDtsPath}: missing validate_computeMissingLiteralKeysFromResolvedKeys in rolled index.d.ts`,
        );
      }
    }
  }
}

function fixCoreDts() {
  if (!fs.existsSync(coreDtsPath)) {
    return;
  }
  const original = fs.readFileSync(coreDtsPath, 'utf8');
  const { content, removed } = sanitizeCoreDtsContent(original);
  if (removed.length > 0) {
    fs.writeFileSync(coreDtsPath, content, 'utf8');
  }
}

const invokedDirectly =
  process.argv[1] != null &&
  path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);

if (invokedDirectly) {
  try {
    if (fixFile) {
      fixCoreDts();
    }
    if (runTests) {
      runCoreDtsTests();
    }
    if (!fixFile && !runTests) {
      console.error('Usage: node scripts/dts/fix-core-dts.mjs --no-test [--dts=path] | --test');
      process.exit(1);
    }
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
