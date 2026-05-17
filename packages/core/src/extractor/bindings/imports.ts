import type { ImportBinding, ImportBindingSource } from '../../types/extractor/bindings/index.js';
import { importBindingScanBlankRanges } from '../shared/jslikeTextRanges.js';
import { IMPORT_BINDING_IDENT_PATTERN as IDENT } from './ident.js';

const U = 'gu';

const IMPORT_TYPE_NAMESPACE_RX = new RegExp(
  String.raw`import\s+type\s*\*\s*as\s+(` + IDENT + String.raw`)\s+from\s*(['"])(?:(?!\2).|\\.)*\2`,
  U,
);

const IMPORT_TYPE_NAMED_RX = new RegExp(
  String.raw`import\s+type\s+\{([^}]*)\}\s+from\s*(['"])(?:(?!\2).|\\.)*\2`,
  U,
);

const IMPORT_TYPE_DEFAULT_RX = new RegExp(
  String.raw`import\s+type\s+(` + IDENT + String.raw`)\s+from\s*(['"])(?:(?!\2).|\\.)*\2`,
  U,
);

const TS_IMPORT_EQUALS_RX = new RegExp(
  String.raw`import\s+(` + IDENT + String.raw`)\s*=\s*require\s*\(\s*(['"])(?:(?!\2).|\\.)*\2\s*\)`,
  U,
);

const NAMESPACE_IMPORT_RX = new RegExp(
  String.raw`import\s*\*\s*as\s+(` + IDENT + String.raw`)\s+from\s*(['"])(?:(?!\2).|\\.)*\2`,
  U,
);

const DEFAULT_AND_NAMED_IMPORT_RX = new RegExp(
  String.raw`import\s+(?!type\b)(` +
    IDENT +
    String.raw`)\s*,\s*\{([^}]*)\}\s+from\s*(['"])(?:(?!\3).|\\.)*\3`,
  U,
);

const NAMED_IMPORT_ONLY_RX = new RegExp(
  String.raw`import\s+(?:type\s+)?\{([^}]*)\}\s+from\s*(['"])(?:(?!\2).|\\.)*\2`,
  U,
);

const DEFAULT_IMPORT_ONLY_RX = new RegExp(
  String.raw`import\s+(?!type\b)(` + IDENT + String.raw`)\s+from\s*(['"])(?:(?!\2).|\\.)*\2`,
  U,
);

const CJS_REQUIRE_DESTRUCT_RX = new RegExp(
  String.raw`(?:const|let|var)\s*\{([^}]*)\}\s*=\s*require\s*\(\s*(['"])(?:(?!\2).|\\.)*\2\s*\)`,
  U,
);

const CJS_REQUIRE_MODULE_RX = new RegExp(
  String.raw`(?:const|let|var)\s+(` + IDENT + String.raw`)\s*=\s*require\s*\(\s*(['"])(?:(?!\2).|\\.)*\2\s*\)`,
  U,
);

const DYNAMIC_IMPORT_DESTRUCT_RX = new RegExp(
  String.raw`(?:const|let|var)\s*\{([^}]*)\}\s*=\s*(?:await\s+)?import\s*\(\s*(['"])(?:(?!\2).|\\.)*\2\s*\)`,
  U,
);

const DYNAMIC_IMPORT_MODULE_RX = new RegExp(
  String.raw`(?:const|let|var)\s+(` +
    IDENT +
    String.raw`)\s*=\s*(?:await\s+)?import\s*\(\s*(['"])(?:(?!\2).|\\.)*\2\s*\)`,
  U,
);

const RX_AS_PAIR = new RegExp(String.raw`^(` + IDENT + String.raw`)\s+as\s+(` + IDENT + String.raw`)$`, 'u');
const RX_IDENT_ONLY = new RegExp(String.raw`^(` + IDENT + String.raw`)$`, 'u');
const RX_TYPE_INLINE = new RegExp(String.raw`^type\s+(` + IDENT + String.raw`)$`, 'u');
const RX_DEFAULT_AS_SEGMENT = new RegExp(String.raw`^default\s+as\s+(` + IDENT + String.raw`)$`, 'u');
const RX_CJS_RENAME = new RegExp(String.raw`^(` + IDENT + String.raw`)\s*:\s*(` + IDENT + String.raw`)$`, 'u');

function isTypeOnlyImportStatement(statement: string): boolean {
  return /^import\s+type\s+/.test(statement.trimStart());
}

function blankScanTextForImportBindings(text: string): string {
  const ranges = importBindingScanBlankRanges(text);
  if (ranges.length === 0) return text;
  const chars = [...text];
  for (const r of ranges) {
    for (let i = r.start; i < r.end; i += 1) chars[i] = ' ';
  }
  return chars.join('');
}

function splitImportSpecifiers(clause: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (let i = 0; i < clause.length; i += 1) {
    const c = clause[i]!;
    if (c === '{' || c === '[' || c === '(') depth += 1;
    else if (c === '}' || c === ']' || c === ')') depth -= 1;
    else if (c === ',' && depth === 0) {
      const t = cur.trim();
      if (t) out.push(t);
      cur = '';
      continue;
    }
    cur += c;
  }
  const tail = cur.trim();
  if (tail) out.push(tail);
  return out;
}

/**
 * Locals bound via `import { default as name } from '…'` (ESM re-export of default).
 */
export function parseEsmDefaultAsLocals(clause: string): string[] {
  const out: string[] = [];
  for (const raw of splitImportSpecifiers(clause)) {
    const seg = raw.trim();
    if (!seg) continue;
    const m = seg.match(RX_DEFAULT_AS_SEGMENT);
    if (m) out.push(m[1]!);
  }
  return out;
}

/**
 * Parse ESM named import clause specifiers into imported/local pairs.
 *
 * @remarks Skips `type Foo` inline type-only specifiers and `default as x` (see
 * {@link parseEsmDefaultAsLocals}).
 */
export function parseEsmNamedImportClause(clause: string): Array<{ imported: string; local: string }> {
  const pairs: Array<{ imported: string; local: string }> = [];
  for (const raw of splitImportSpecifiers(clause)) {
    const seg = raw.trim();
    if (!seg) continue;
    if (RX_TYPE_INLINE.test(seg)) continue;
    if (RX_DEFAULT_AS_SEGMENT.test(seg)) continue;

    const asMatch = seg.match(RX_AS_PAIR);
    if (asMatch) {
      pairs.push({ imported: asMatch[1]!, local: asMatch[2]! });
      continue;
    }
    const ident = seg.match(RX_IDENT_ONLY);
    if (ident) {
      const name = ident[1]!;
      pairs.push({ imported: name, local: name });
    }
  }
  return pairs;
}

/**
 * Parse CJS `require` destructuring clause into property/local pairs.
 *
 * @remarks Uses `:` rename syntax (`{ t: newT }`), not `as`.
 */
export function parseCjsDestructuringClause(clause: string): Array<{ imported: string; local: string }> {
  const pairs: Array<{ imported: string; local: string }> = [];
  for (const raw of splitImportSpecifiers(clause)) {
    const seg = raw.trim();
    if (!seg) continue;
    const rename = seg.match(RX_CJS_RENAME);
    if (rename) {
      pairs.push({ imported: rename[1]!, local: rename[2]! });
      continue;
    }
    const ident = seg.match(RX_IDENT_ONLY);
    if (ident) {
      const name = ident[1]!;
      pairs.push({ imported: name, local: name });
    }
  }
  return pairs;
}

function pushNamed(
  out: ImportBinding[],
  imported: string,
  local: string,
  source: ImportBindingSource,
  typeOnly?: true,
): void {
  out.push(
    typeOnly === true
      ? { kind: 'named', imported, local, source, isTypeOnly: true }
      : { kind: 'named', imported, local, source },
  );
}

function pushModule(
  out: ImportBinding[],
  local: string,
  moduleKind: 'default' | 'namespace',
  source: ImportBindingSource,
  typeOnly?: true,
): void {
  out.push(
    typeOnly === true
      ? { kind: 'module', local, moduleKind, source, isTypeOnly: true }
      : { kind: 'module', local, moduleKind, source },
  );
}

/**
 * Scan JS/TS-like source for import bindings relevant to translation helper detection.
 *
 * @remarks Pure — no IO. Regex-based; comments and string/template literals are blanked first
 * (see {@link importBindingScanBlankRanges}) to cut false positives. May still
 * miss edge cases (nested braces in clauses, etc.). Does not follow non-literal `require(expr)` /
 * `import(expr)` specifiers.
 */
export function scanImportBindings(text: string): ImportBinding[] {
  const scanText = blankScanTextForImportBindings(text);
  const out: ImportBinding[] = [];

  let m: RegExpExecArray | null;

  const typeNsRe = new RegExp(IMPORT_TYPE_NAMESPACE_RX.source, U);
  while ((m = typeNsRe.exec(scanText)) !== null) {
    pushModule(out, m[1]!, 'namespace', 'esm', true);
  }

  const typeNamedRe = new RegExp(IMPORT_TYPE_NAMED_RX.source, U);
  while ((m = typeNamedRe.exec(scanText)) !== null) {
    const clause = m[1]!;
    for (const pair of parseEsmNamedImportClause(clause)) {
      pushNamed(out, pair.imported, pair.local, 'esm', true);
    }
    for (const local of parseEsmDefaultAsLocals(clause)) {
      pushModule(out, local, 'default', 'esm', true);
    }
  }

  const typeDefRe = new RegExp(IMPORT_TYPE_DEFAULT_RX.source, U);
  while ((m = typeDefRe.exec(scanText)) !== null) {
    pushModule(out, m[1]!, 'default', 'esm', true);
  }

  const tsEqRe = new RegExp(TS_IMPORT_EQUALS_RX.source, U);
  while ((m = tsEqRe.exec(scanText)) !== null) {
    pushModule(out, m[1]!, 'default', 'ts_import_equals');
  }

  const nsRe = new RegExp(NAMESPACE_IMPORT_RX.source, U);
  while ((m = nsRe.exec(scanText)) !== null) {
    const stmt = m[0];
    if (isTypeOnlyImportStatement(stmt)) continue;
    pushModule(out, m[1]!, 'namespace', 'esm');
  }

  const dnRe = new RegExp(DEFAULT_AND_NAMED_IMPORT_RX.source, U);
  while ((m = dnRe.exec(scanText)) !== null) {
    const stmt = m[0];
    if (isTypeOnlyImportStatement(stmt)) continue;
    pushModule(out, m[1]!, 'default', 'esm');
    const clause = m[2]!;
    for (const pair of parseEsmNamedImportClause(clause)) {
      pushNamed(out, pair.imported, pair.local, 'esm');
    }
    for (const local of parseEsmDefaultAsLocals(clause)) {
      pushModule(out, local, 'default', 'esm');
    }
  }

  const namedRe = new RegExp(NAMED_IMPORT_ONLY_RX.source, U);
  while ((m = namedRe.exec(scanText)) !== null) {
    const stmt = m[0];
    if (isTypeOnlyImportStatement(stmt)) continue;
    const clause = m[1]!;
    for (const pair of parseEsmNamedImportClause(clause)) {
      pushNamed(out, pair.imported, pair.local, 'esm');
    }
    for (const local of parseEsmDefaultAsLocals(clause)) {
      pushModule(out, local, 'default', 'esm');
    }
  }

  const defRe = new RegExp(DEFAULT_IMPORT_ONLY_RX.source, U);
  while ((m = defRe.exec(scanText)) !== null) {
    const stmt = m[0];
    if (isTypeOnlyImportStatement(stmt)) continue;
    pushModule(out, m[1]!, 'default', 'esm');
  }

  const cjsDestRe = new RegExp(CJS_REQUIRE_DESTRUCT_RX.source, U);
  while ((m = cjsDestRe.exec(scanText)) !== null) {
    for (const pair of parseCjsDestructuringClause(m[1]!)) {
      pushNamed(out, pair.imported, pair.local, 'cjs_require');
    }
  }

  const cjsModRe = new RegExp(CJS_REQUIRE_MODULE_RX.source, U);
  while ((m = cjsModRe.exec(scanText)) !== null) {
    const clauseStart = m.index!;
    const pre = scanText.slice(Math.max(0, clauseStart - 32), clauseStart + 1);
    if (/\{\s*$/u.test(pre)) continue;
    pushModule(out, m[1]!, 'default', 'cjs_require');
  }

  const dynDestRe = new RegExp(DYNAMIC_IMPORT_DESTRUCT_RX.source, U);
  while ((m = dynDestRe.exec(scanText)) !== null) {
    for (const pair of parseCjsDestructuringClause(m[1]!)) {
      pushNamed(out, pair.imported, pair.local, 'dynamic_import');
    }
  }

  const dynModRe = new RegExp(DYNAMIC_IMPORT_MODULE_RX.source, U);
  while ((m = dynModRe.exec(scanText)) !== null) {
    const clauseStart = m.index!;
    const pre = scanText.slice(Math.max(0, clauseStart - 32), clauseStart + 1);
    if (/\{\s*$/u.test(pre)) continue;
    pushModule(out, m[1]!, 'default', 'dynamic_import');
  }

  return dedupeBindings(out);
}

function dedupeBindings(bindings: ImportBinding[]): ImportBinding[] {
  const seen = new Set<string>();
  const out: ImportBinding[] = [];
  for (const b of bindings) {
    const key =
      b.kind === 'named'
        ? `named:${b.source}:${b.imported}:${b.local}:${b.isTypeOnly === true ? 't' : 'r'}`
        : `module:${b.source}:${b.local}:${b.moduleKind}:${b.isTypeOnly === true ? 't' : 'r'}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(b);
  }
  return out;
}
