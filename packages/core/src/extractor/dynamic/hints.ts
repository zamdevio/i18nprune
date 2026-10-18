import { buildConstStringMap } from '../constmap/build.js';
import { buildAssignmentLedger, type AssignmentLedger } from '../constmap/assignments.js';
import { analyzeTemplateCall } from '../shared/templateAnalysis.js';

export type NonLiteralDynamicHints = {
  /** Display-only: local was assigned from a fully resolved same-file template. */
  resolvedViaConstAssignment?: string;
  /** Display-only: ternary/conditional assignment branch literals or resolved templates. */
  branchLiterals?: string[];
};

const SIMPLE_IDENT = /^[A-Za-z_$][\w$]*$/;

/** Follow at most this many identifier→identifier hops before giving up (chain cap). */
const MAX_ASSIGNMENT_HOPS = 2;

/**
 * Best-effort same-file hints for `non_literal` sites. Never promotes keys to proven.
 *
 * Follows a bounded same-file assignment chain (`const a = 'app.x'; const b = a; t(b)`)
 * via the {@link AssignmentLedger} — one ledger build per file, then O(hops) lookups.
 */
export function nonLiteralHintsForFirstArg(
  source: string,
  firstArgRaw: string,
  constMap: Record<string, string>,
  ledger: AssignmentLedger = buildAssignmentLedger(source),
): NonLiteralDynamicHints {
  const arg = firstArgRaw.trim();
  if (SIMPLE_IDENT.test(arg)) return hintsForIdentifier(arg, constMap, ledger, 0);
  return hintsFromRhs(arg, constMap);
}

function hintsForIdentifier(
  ident: string,
  constMap: Record<string, string>,
  ledger: AssignmentLedger,
  hops: number,
): NonLiteralDynamicHints {
  const rhs = ledger.rhs.get(ident);
  if (rhs === undefined) return {};
  // Identifier→identifier: follow one more hop, up to the cap.
  if (SIMPLE_IDENT.test(rhs)) {
    if (hops >= MAX_ASSIGNMENT_HOPS) return {};
    return hintsForIdentifier(rhs, constMap, ledger, hops + 1);
  }
  return hintsFromRhs(rhs, constMap);
}

function hintsFromRhs(rhs: string, constMap: Record<string, string>): NonLiteralDynamicHints {
  const ternary = rhs.match(/^[\s\S]+\?\s*([\s\S]+?)\s*:\s*([\s\S]+)$/);
  if (ternary) {
    const branches = [ternary[1]!, ternary[2]!]
      .map((b) => resolveHintLiteral(b.trim(), constMap))
      .filter((b): b is string => b !== null);
    if (branches.length > 0) return { branchLiterals: branches };
  }
  const resolved = resolveHintLiteral(rhs, constMap);
  if (resolved) return { resolvedViaConstAssignment: resolved };
  return {};
}

function resolveHintLiteral(fragment: string, constMap: Record<string, string>): string | null {
  const quoted = fragment.match(/^(['"])([\s\S]*)\1$/);
  if (quoted) return quoted[2]!;
  const tpl = fragment.match(/^`([\s\S]*)`$/);
  if (!tpl) return null;
  const analysis = analyzeTemplateCall(tpl[1]!, constMap);
  return analysis.classification === 'fully_resolved' ? analysis.resolvedKey : null;
}

/** Convenience for tests — rebuilds the const map and ledger when not supplied. */
export function nonLiteralHintsForCall(
  source: string,
  firstArgRaw: string,
): NonLiteralDynamicHints {
  return nonLiteralHintsForFirstArg(
    source,
    firstArgRaw,
    buildConstStringMap(source),
    buildAssignmentLedger(source),
  );
}
