import { resolveKeyPlaceholdersWithTrace } from '../constmap/resolve.js';
import { tryResolveTemplatePrefixBeforeUnknown } from '../dynamic/rebuild.js';
import { findTranslationCallSites } from '../shared/calls.js';
import { offsetInCommentRanges } from '../shared/jslikeTextRanges.js';
import type { KeyObservation, SourceSpan } from '../../types/extractor/keySites/index.js';
import { lineNumberAtIndex } from './line.js';
import type { ScanKeyObservationsOptions } from '../../types/extractor/keySites/scan.js';

function spanAtOffset(
  text: string,
  offset: number,
  functionName: string | undefined,
  isMultilineCall: boolean,
): SourceSpan {
  return {
    line: lineNumberAtIndex(text, offset),
    functionName,
    isMultilineCall,
    charOffset: offset,
  };
}
/**
 * Scan source text for translation call patterns; emit structured observations.
 * Matches {@link import('../shared/literals.js').exactLiteralKeys} resolution rules (quoted literals + backtick templates).
 */
export function scanKeyObservations(
  text: string,
  functions: string[],
  constMap: Record<string, string>,
  options?: ScanKeyObservationsOptions,
): KeyObservation[] {
  const out: KeyObservation[] = [];
  const calls = findTranslationCallSites(text, functions);
  const ranges = options?.commentRanges;
  for (const call of calls) {
    if (ranges?.length && offsetInCommentRanges(call.matchIndex, ranges)) continue;
    if (call.isEmptyCall) continue;
    const arg = call.firstArgRaw.trim();
    const stringMatch = arg.match(/^(['"])([\s\S]*)\1$/);
    if (stringMatch) {
      const key = stringMatch[2]!;
      out.push({
        kind: 'literal',
        resolvedKey: key,
        raw: key,
        span: spanAtOffset(text, call.matchIndex, call.functionName, call.isMultilineCall),
      });
      continue;
    }
    const tplMatch = arg.match(/^`([\s\S]*)`$/);
    if (!tplMatch) continue;
    const templateRaw = tplMatch[1]!;
    const trace = resolveKeyPlaceholdersWithTrace(templateRaw, constMap);
    const span = spanAtOffset(text, call.matchIndex, call.functionName, call.isMultilineCall);

    if (trace.resolved !== null) {
      out.push({
        kind: 'template_resolved',
        resolvedKey: trace.resolved,
        templateRaw,
        substitutions: trace.substitutions,
        span,
      });
    } else {
      const unresolved: string[] = [];
      const rem = trace.remainder;
      const ph = /\$\{([A-Za-z_$][\w$]*)\}/g;
      let pm: RegExpExecArray | null;
      while ((pm = ph.exec(rem)) !== null) {
        unresolved.push(pm[1]!);
      }
      const uncertainPrefix = tryResolveTemplatePrefixBeforeUnknown(templateRaw, constMap) ?? undefined;
      out.push({
        kind: 'template_partial',
        templateRaw,
        substitutions: trace.substitutions,
        unresolvedPlaceholders: unresolved,
        span,
        ...(uncertainPrefix !== undefined ? { uncertainPrefix } : {}),
      });
    }
  }

  return out;
}

/** Resolved dotted keys suitable for sets / parity with {@link import('../shared/literals.js').exactLiteralKeys}. */
export function resolvedKeysFromObservations(observations: KeyObservation[]): Set<string> {
  const keys = new Set<string>();
  for (const o of observations) {
    if (o.kind === 'literal' || o.kind === 'template_resolved') {
      keys.add(o.resolvedKey);
    }
  }
  return keys;
}

