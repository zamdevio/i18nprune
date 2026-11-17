import type { RuntimePathPort } from '../../types/runtime/path.js';

/**
 * Cross-file static string consts (extractor v2, cross-file phase).
 *
 * Resolves `import { NS } from './constants'` against an **export index** so
 * `` t(`${NS}.title`) `` folds like a same-file const — without a TS program and
 * without globally merging const maps (per-file overlays only, so `NS` collisions
 * across files stay independent).
 */
export type ExportConstIndex = Map<string, Record<string, string>>;

/** One project source file: absolute path + raw text. */
export type ProjectFileEntry = { filePath: string; text: string };

type Reexport = { exported: string; imported: string; from: string };

/** `export const NAME = 'static'` — value must be a plain string (no `${…}`). */
const EXPORT_CONST_RE =
  /\bexport\s+(?:readonly\s+)?(?:const|let)\s+([A-Za-z_$][\w$]*)\s*(?::[^=;]+)?=\s*(['"`])([^'"`]*)\2/g;

/** `export { A, B as C } from './mod'`. */
const REEXPORT_RE = /\bexport\s*\{([^}]*)\}\s*from\s*(['"])([^'"]+)\2/g;

/** `import { A, B as C } from './mod'` (type-only imports excluded). */
const NAMED_IMPORT_RE = /\bimport\s+(?!type\b)\{([^}]*)\}\s*from\s*(['"])([^'"]+)\2/g;

/** Relative specifiers only — bare packages / `paths` aliases are out of scope. */
const RELATIVE_SPECIFIER = /^\.{1,2}(\/|$)/;

/** Extensions tried when a relative import omits one, in order. */
const RESOLVE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.vue', '.svelte'];

/** Max re-export hops resolved (hard limit per `cross-file.md`). */
const MAX_REEXPORT_DEPTH = 2;

function splitSpecifiers(clause: string): string[] {
  return clause
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** `A` → `{ imported: 'A', local: 'A' }`; `A as B` → `{ imported: 'A', local: 'B' }`. */
function parseSpecifier(spec: string): { imported: string; local: string } | null {
  const m = /^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/.exec(spec.trim());
  if (!m) return null;
  return { imported: m[1]!, local: m[2] ?? m[1]! };
}

function collectFileExports(text: string): { consts: Record<string, string>; reexports: Reexport[] } {
  const consts: Record<string, string> = {};
  const constRe = new RegExp(EXPORT_CONST_RE.source, EXPORT_CONST_RE.flags);
  let m: RegExpExecArray | null;
  while ((m = constRe.exec(text)) !== null) {
    const value = m[3]!;
    // A template with holes is not a static string — leave it to same-file resolution.
    if (value.includes('${')) continue;
    consts[m[1]!] = value;
  }

  const reexports: Reexport[] = [];
  const reRe = new RegExp(REEXPORT_RE.source, REEXPORT_RE.flags);
  while ((m = reRe.exec(text)) !== null) {
    const from = m[3]!;
    for (const spec of splitSpecifiers(m[1]!)) {
      const parsed = parseSpecifier(spec);
      if (!parsed) continue;
      reexports.push({ exported: parsed.local, imported: parsed.imported, from });
    }
  }

  return { consts, reexports };
}

/** Resolve a relative specifier to an indexed file, trying extensions and `index.*`. */
export function resolveModulePath(
  fromFile: string,
  specifier: string,
  index: ExportConstIndex,
  pathPort: RuntimePathPort,
): string | null {
  if (!RELATIVE_SPECIFIER.test(specifier)) return null;
  // Join relative to the importer — do **not** use `resolve` here. On Windows,
  // `path.resolve('/repo/…')` injects the current drive (`D:\repo\…`) while
  // `normalize('/repo/…')` stays `\repo\…`, so index lookups miss.
  const base = pathPort.normalize(pathPort.join(pathPort.dirname(fromFile), specifier));
  const candidates = [
    base,
    ...RESOLVE_EXTENSIONS.map((ext) => `${base}${ext}`),
    ...RESOLVE_EXTENSIONS.map((ext) => pathPort.join(base, `index${ext}`)),
  ];
  for (const candidate of candidates) {
    const normalized = pathPort.normalize(candidate);
    if (index.has(normalized)) return normalized;
  }
  return null;
}

/**
 * Build the project export index: `absolutePath → { NAME: staticValue }`.
 *
 * Re-exports (`export { NS } from './x'`) are followed up to {@link MAX_REEXPORT_DEPTH}
 * hops. Files with no exported static consts are still registered (empty record) so
 * import resolution can tell "known file, nothing exported" from "unknown file".
 */
export function buildProjectExportConstIndex(
  entries: ProjectFileEntry[],
  pathPort: RuntimePathPort,
): ExportConstIndex {
  const index: ExportConstIndex = new Map();
  const reexportsByFile = new Map<string, Reexport[]>();

  for (const { filePath, text } of entries) {
    const key = pathPort.normalize(filePath);
    const { consts, reexports } = collectFileExports(text);
    index.set(key, { ...consts });
    if (reexports.length > 0) reexportsByFile.set(key, reexports);
  }

  for (let depth = 0; depth < MAX_REEXPORT_DEPTH; depth += 1) {
    let progressed = false;
    for (const [file, reexports] of reexportsByFile) {
      const target = index.get(file);
      if (!target) continue;
      for (const re of reexports) {
        if (target[re.exported] !== undefined) continue;
        const resolved = resolveModulePath(file, re.from, index, pathPort);
        const source = resolved ? index.get(resolved) : undefined;
        const value = source?.[re.imported];
        if (value !== undefined) {
          target[re.exported] = value;
          progressed = true;
        }
      }
    }
    if (!progressed) break;
  }

  return index;
}

/**
 * Per-file overlay of imported static consts: `localName → value`.
 *
 * Local bindings shadow imports, so callers merge this **under** the file's own
 * const map (`{ ...importedConsts, ...buildConstStringMap(text) }`).
 */
export function importedConstsForFile(
  text: string,
  filePath: string,
  index: ExportConstIndex,
  pathPort: RuntimePathPort,
): Record<string, string> {
  const out: Record<string, string> = {};
  const re = new RegExp(NAMED_IMPORT_RE.source, NAMED_IMPORT_RE.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const resolved = resolveModulePath(filePath, m[3]!, index, pathPort);
    const consts = resolved ? index.get(resolved) : undefined;
    if (!consts) continue;
    for (const spec of splitSpecifiers(m[1]!)) {
      const parsed = parseSpecifier(spec);
      if (!parsed) continue;
      const value = consts[parsed.imported];
      if (value !== undefined) out[parsed.local] = value;
    }
  }
  return out;
}
