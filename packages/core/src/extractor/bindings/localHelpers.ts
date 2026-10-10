import type { ImportBinding } from '../../types/extractor/bindings/index.js';
import { escapeRegex } from '../shared/pattern.js';
import { IMPORT_BINDING_IDENT_PATTERN as IDENT } from './ident.js';
import {
  HOOK_HELPER_PRESETS,
  hookNamesFromPresets,
  type HookHelperPreset,
} from './hookPresets.js';

function isRuntimeNamed(b: ImportBinding): b is ImportBinding & { kind: 'named' } {
  return b.isTypeOnly !== true && b.kind === 'named';
}

/** Map of local hook identifier → preset (from runtime named imports). */
function presetsByImportedHookLocal(
  bindings: ImportBinding[],
  presets: readonly HookHelperPreset[],
): Map<string, HookHelperPreset> {
  const byHook = new Map<string, HookHelperPreset>();
  for (const p of presets) {
    for (const h of p.hooks) byHook.set(h, p);
  }
  const out = new Map<string, HookHelperPreset>();
  for (const b of bindings) {
    if (!isRuntimeNamed(b)) continue;
    const preset = byHook.get(b.imported) ?? byHook.get(b.local);
    if (preset) out.set(b.local, preset);
  }
  return out;
}

function configuredAllowsHookBind(configured: Set<string>, hookLocal: string, bind: string): boolean {
  return configured.has(bind) || configured.has(hookLocal);
}

/**
 * Locals introduced by hook destructuring / direct assign when a preset hook is imported.
 *
 * @example
 * `const { t } = useTranslation()` · `const t = useTranslations()`
 */
function scanHookBoundLocals(
  text: string,
  configured: Set<string>,
  hookLocals: Map<string, HookHelperPreset>,
): Set<string> {
  const added = new Set<string>();
  if (hookLocals.size === 0) return added;

  const hookAlt = [...hookLocals.keys()].map(escapeRegex).join('|');
  if (!hookAlt) return added;

  const destructure = new RegExp(
    String.raw`(?:^|[;\n])\s*(?:const|let)\s*\{\s*(${IDENT})\s*\}\s*=\s*(${hookAlt})\s*\(`,
    'gmu',
  );
  let m: RegExpExecArray | null;
  while ((m = destructure.exec(text)) !== null) {
    const bind = m[1]!;
    const hookLocal = m[2]!;
    const preset = hookLocals.get(hookLocal);
    if (!preset) continue;
    if (!preset.binds.includes(bind)) continue;
    if (!configuredAllowsHookBind(configured, hookLocal, bind)) continue;
    added.add(bind);
  }

  const direct = new RegExp(
    String.raw`(?:^|[;\n])\s*(?:const|let)\s+(${IDENT})\s*=\s*(${hookAlt})\s*\(`,
    'gmu',
  );
  while ((m = direct.exec(text)) !== null) {
    const bind = m[1]!;
    const hookLocal = m[2]!;
    const preset = hookLocals.get(hookLocal);
    if (!preset) continue;
    if (!preset.binds.includes(bind)) continue;
    if (!configuredAllowsHookBind(configured, hookLocal, bind)) continue;
    added.add(bind);
  }

  return added;
}

/**
 * One-hop same-file aliases: `const tt = t` / `const translate = i18n.t`.
 * Single pass only (no multi-hop). RHS must be an exact effective helper spelling.
 */
function scanOneHopAliases(text: string, effective: readonly string[]): Set<string> {
  const added = new Set<string>();
  if (effective.length === 0) return added;

  const sorted = [...effective].sort((a, b) => b.length - a.length || (a < b ? -1 : a > b ? 1 : 0));
  const rhsAlt = sorted.map(escapeRegex).join('|');
  const re = new RegExp(
    String.raw`(?:^|[;\n])\s*(?:const|let)\s+(${IDENT})\s*=\s*(${rhsAlt})\s*(?=[;\n,]|$)`,
    'gmu',
  );

  const effectiveSet = new Set(effective);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const local = m[1]!;
    const rhs = m[2]!;
    if (effectiveSet.has(local)) continue;
    if (!effectiveSet.has(rhs)) continue;
    added.add(local);
  }
  return added;
}

function shouldScanLocalHelpers(
  text: string,
  bindings: ImportBinding[],
  effective: readonly string[],
): boolean {
  const hookNames = hookNamesFromPresets();
  for (const b of bindings) {
    if (!isRuntimeNamed(b)) continue;
    if (hookNames.has(b.imported) || hookNames.has(b.local)) return true;
  }
  for (const name of effective) {
    const esc = escapeRegex(name);
    if (new RegExp(String.raw`=\s*${esc}\s*(?=[;\n,]|$)`, 'mu').test(text)) return true;
  }
  return false;
}

/**
 * Expand import-effective helpers with same-file hook binds + one-hop aliases (HOC §A).
 *
 * @remarks Pure — no IO. Does not follow multi-hop or ternaries. Hook binds require a
 * runtime named import of a {@link HOOK_HELPER_PRESETS} hook and configured evidence
 * (`t` and/or the hook name in `functions`).
 */
export function expandWithLocalHelpers(
  effectiveFromImports: string[],
  configuredFunctions: string[],
  text: string,
  bindings: ImportBinding[],
  presets: readonly HookHelperPreset[] = HOOK_HELPER_PRESETS,
): string[] {
  if (!shouldScanLocalHelpers(text, bindings, effectiveFromImports)) {
    return effectiveFromImports;
  }

  const configured = new Set(configuredFunctions);
  const hookLocals = presetsByImportedHookLocal(bindings, presets);
  const fromHooks = scanHookBoundLocals(text, configured, hookLocals);

  const afterHooksSet = new Set(effectiveFromImports);
  for (const n of fromHooks) afterHooksSet.add(n);
  const afterHooks = [...afterHooksSet];
  const fromAliases = scanOneHopAliases(text, afterHooks);

  const base = new Set(effectiveFromImports);
  const discovered: string[] = [];
  for (const n of fromHooks) {
    if (!base.has(n)) discovered.push(n);
  }
  for (const n of fromAliases) {
    if (!base.has(n) && !discovered.includes(n)) discovered.push(n);
  }
  discovered.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return [...effectiveFromImports, ...discovered];
}
