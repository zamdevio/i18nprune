import { isReassignedInSource } from './build.js';

/**
 * Per-file assignment ledger for **same-file dataflow hints** (extractor v2,
 * light-dataflow phase).
 *
 * One pass over a file records the raw right-hand side of each `const` / `let`
 * declaration, so a `non_literal` call's identifier can be resolved by following a
 * bounded chain without an AST or a TypeScript program:
 *
 * ```ts
 * const a = 'app.x';
 * const b = a;
 * t(b); // → hint resolvedViaConstAssignment: 'app.x'
 * ```
 *
 * Names that are reassigned anywhere in the file are dropped — the same guard
 * {@link buildConstStringMap} applies to its literal map.
 */
export type AssignmentLedger = {
  /** identifier → raw RHS expression (trimmed); first declaration wins. */
  readonly rhs: ReadonlyMap<string, string>;
};

/** `const` / `let` declaration with the RHS captured up to the terminating `;`. */
const DECL_RE =
  /\b(?:export\s+)?(?:readonly\s+)?(?:const|let)\s+([A-Za-z_$][\w$]*)\s*(?::[^=;]+)?=\s*([^;]+?)\s*;/g;

/** Build the per-file assignment ledger (single pass, O(lines)). */
export function buildAssignmentLedger(source: string): AssignmentLedger {
  const rhs = new Map<string, string>();
  const re = new RegExp(DECL_RE.source, DECL_RE.flags);
  let match: RegExpExecArray | null;
  while ((match = re.exec(source)) !== null) {
    const name = match[1]!;
    if (!rhs.has(name)) rhs.set(name, match[2]!.trim());
  }
  for (const name of [...rhs.keys()]) {
    if (isReassignedInSource(source, name)) rhs.delete(name);
  }
  return { rhs };
}
