import type { ImportBinding } from '../../types/extractor/bindings/index.js';
import { IMPORT_BINDING_IDENT_PATTERN as IDENT } from './ident.js';

const RX_SAFE_BRACKET_METHOD = new RegExp(String.raw`^` + IDENT + String.raw`$`, 'u');

function isRuntimeBinding(b: ImportBinding): boolean {
  return b.isTypeOnly !== true;
}

function isSafeBracketMethodKey(method: string): boolean {
  if (method.length === 0) return false;
  if (/['"\\\s\n\r]/.test(method)) return false;
  return RX_SAFE_BRACKET_METHOD.test(method);
}

/** Adds dot, optional-chaining, and single/double-quoted bracket member call spellings. */
function addMemberCallVariants(effective: Set<string>, objectLocal: string, method: string): void {
  effective.add(`${objectLocal}.${method}`);
  effective.add(`${objectLocal}?.${method}`);
  if (isSafeBracketMethodKey(method)) {
    effective.add(`${objectLocal}['${method}']`);
    effective.add(`${objectLocal}?.['${method}']`);
    effective.add(`${objectLocal}["${method}"]`);
    effective.add(`${objectLocal}?.["${method}"]`);
  }
}

/**
 * Collect method suffixes for `obj.<method>(` expansion: configured simple roots plus
 * imported/local names from runtime **named** bindings that intersect the configured set
 * (so `import { t as translate }` + `['translate']` still expands `i18n.t()` via imported `t`).
 */
function methodSuffixesForModuleExpansion(
  configuredSet: Set<string>,
  simpleRoots: string[],
  bindings: ImportBinding[],
): Set<string> {
  const suffixes = new Set<string>(simpleRoots);
  for (const b of bindings) {
    if (!isRuntimeBinding(b) || b.kind !== 'named') continue;
    if (configuredSet.has(b.imported) || configuredSet.has(b.local)) {
      suffixes.add(b.imported);
      suffixes.add(b.local);
    }
  }
  return suffixes;
}

/**
 * Expand configured translation helper identifiers with alias and module discoveries from
 * {@link scanImportBindings}.
 *
 * @remarks Pure — no IO. Named bindings add the local identifier when either the imported
 * specifier or the local alias is listed in configured `functions`. Module member expansion uses
 * {@link methodSuffixesForModuleExpansion} so canonical export names (e.g. `t`) still apply on
 * `import * as i18n` when only a local alias is configured. Type-only bindings are ignored.
 * Discovered names sort by UTF-16 code unit order.
 */
export function expandFunctionsWithBindings(
  configuredFunctions: string[],
  bindings: ImportBinding[],
): string[] {
  const uniqConfigured = [...new Set(configuredFunctions)];
  const configuredSet = new Set(uniqConfigured);
  const effective = new Set<string>(uniqConfigured);

  const simpleRoots = uniqConfigured.filter((f) => !f.includes('.'));

  for (const b of bindings) {
    if (!isRuntimeBinding(b)) continue;
    // Add local alias when either exported name or local name appears in configured `functions`.
    if (b.kind === 'named' && (configuredSet.has(b.imported) || configuredSet.has(b.local))) {
      effective.add(b.local);
    }
  }

  const methodSuffixes = methodSuffixesForModuleExpansion(configuredSet, simpleRoots, bindings);

  for (const method of methodSuffixes) {
    for (const b of bindings) {
      if (!isRuntimeBinding(b)) continue;
      if (b.kind === 'module') {
        addMemberCallVariants(effective, b.local, method);
      }
    }
  }

  const discovered = [...effective].filter((f) => !configuredSet.has(f));
  discovered.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return [...uniqConfigured, ...discovered];
}
