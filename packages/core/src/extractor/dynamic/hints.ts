import { buildConstStringMap } from '../constmap/build.js';
import { analyzeTemplateCall } from '../shared/templateAnalysis.js';

export type NonLiteralDynamicHints = {
  /** Display-only: local was assigned from a fully resolved same-file template. */
  resolvedViaConstAssignment?: string;
  /** Display-only: ternary/conditional assignment branch literals or resolved templates. */
  branchLiterals?: string[];
};

/**
 * Best-effort same-file hints for `non_literal` sites. Never promotes keys to proven.
 */
export function nonLiteralHintsForFirstArg(
  source: string,
  firstArgRaw: string,
  constMap: Record<string, string>,
): NonLiteralDynamicHints {
  const ident = firstArgRaw.trim().match(/^([A-Za-z_$][\w$]*)$/)?.[1];
  if (!ident) return hintsFromInlineExpression(firstArgRaw.trim(), constMap);
  return hintsFromIdentifierAssignment(source, ident, constMap);
}

function hintsFromIdentifierAssignment(
  source: string,
  ident: string,
  constMap: Record<string, string>,
): NonLiteralDynamicHints {
  const esc = ident.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const assignRe = new RegExp(`\\b(?:const|let)\\s+${esc}\\s*=\\s*([^;]+);`);
  const m = assignRe.exec(source);
  if (!m) return {};
  return hintsFromRhs(m[1]!.trim(), constMap);
}

function hintsFromInlineExpression(expr: string, constMap: Record<string, string>): NonLiteralDynamicHints {
  return hintsFromRhs(expr, constMap);
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

/** Convenience for tests — rebuilds const map when not supplied. */
export function nonLiteralHintsForCall(
  source: string,
  firstArgRaw: string,
): NonLiteralDynamicHints {
  return nonLiteralHintsForFirstArg(source, firstArgRaw, buildConstStringMap(source));
}
