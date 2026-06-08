import { findTranslationCallSites } from '../shared/calls.js';
import { analyzeTemplateCall } from '../shared/templateAnalysis.js';
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
    const analysis = analyzeTemplateCall(templateRaw, constMap);
    const span = spanAtOffset(text, call.matchIndex, call.functionName, call.isMultilineCall);

    if (analysis.classification === 'fully_resolved' && analysis.resolvedKey !== null) {
      out.push({
        kind: 'template_resolved',
        resolvedKey: analysis.resolvedKey,
        templateRaw,
        substitutions: analysis.substitutions,
        span,
      });
    } else {
      out.push({
        kind: 'template_partial',
        templateRaw,
        substitutions: analysis.substitutions,
        unresolvedPlaceholders: analysis.unresolvedPlaceholders,
        span,
        // Pairs with a dynamic `template_interpolation` site; reference merge uses dynamic prefix once.
        dynamicRef: { line: span.line },
        ...(analysis.staticPrefix !== null ? { uncertainPrefix: analysis.staticPrefix } : {}),
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

