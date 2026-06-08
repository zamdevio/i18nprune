import { buildConstStringMap } from '../../constmap/build.js';
import { findTranslationCallSites } from '../../shared/calls.js';
import { dynamicTemplateFieldsFromAnalysis } from '../../shared/templateDynamicFields.js';
import { nonLiteralHintsForFirstArg } from '../hints.js';
import type { NonLiteralDynamicHints } from '../hints.js';
import type { DynamicKeySite } from '../../../types/extractor/dynamic/index.js';
import { commentRangesForJsLikeText, offsetInCommentRanges } from '../../shared/jslikeTextRanges.js';
import { offsetToLineColumn, snippetRange } from '../helpers.js';
import { analyzeTemplateCall } from '../../shared/templateAnalysis.js';

const PREVIEW = 72;

/** Extensions this provider handles (lowercase, with dot). */
export const JAVASCRIPT_LIKE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.vue',
  '.svelte',
]);

export function isJavascriptLikePath(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  const dot = lower.lastIndexOf('.');
  if (dot < 0) return false;
  return JAVASCRIPT_LIKE_EXTENSIONS.has(lower.slice(dot));
}

/**
 * Find dynamic key sites in a single file's text. Sets `filePath`, line/column, comment flags.
 */
export function findDynamicKeySitesInJavascriptFile(
  text: string,
  functions: string[],
  filePath: string,
): DynamicKeySite[] {
  const commentRanges = commentRangesForJsLikeText(text);
  const constMap = buildConstStringMap(text);
  const raw = findDynamicKeySitesRaw(text, functions, constMap);
  const out: DynamicKeySite[] = [];

  for (const site of raw) {
    const at = site.matchIndex;
    const commented = offsetInCommentRanges(at, commentRanges);
    const { line, column } = offsetToLineColumn(text, at);
    const kind = commented ? 'commented' : site.kind;

    out.push({
      kind,
      functionName: site.functionName,
      preview: snippetRange(text, at, site.closeParenIndex + 1, PREVIEW),
      filePath,
      line,
      column,
      isMultilineCall: site.isMultilineCall,
      isCommented: commented,
      isSourceFile: true,
      ...rawSiteToDynamicFields(site),
    });
  }

  return out;
}

type RawSite = {
  kind: 'non_literal' | 'template_interpolation' | 'empty_call';
  functionName: string;
  matchIndex: number;
  closeParenIndex: number;
  isMultilineCall: boolean;
  templateFields?: ReturnType<typeof dynamicTemplateFieldsFromAnalysis>;
  nonLiteralHints?: NonLiteralDynamicHints;
};

function rawSiteToDynamicFields(site: RawSite): Partial<DynamicKeySite> {
  return { ...site.templateFields, ...site.nonLiteralHints };
}

/**
 * Returns candidate dynamic sites. Template literals whose `${}` segments are all resolvable
 * from `constMap` are omitted (fully static after rebuild).
 */
function findDynamicKeySitesRaw(
  text: string,
  functions: string[],
  constMap: Record<string, string>,
): RawSite[] {
  const out: RawSite[] = [];
  const calls = findTranslationCallSites(text, functions);
  for (const call of calls) {
    const at = call.matchIndex;
    if (call.isEmptyCall) {
      out.push({
        kind: 'empty_call',
        functionName: call.functionName,
        matchIndex: at,
        closeParenIndex: call.closeParenIndex,
        isMultilineCall: call.isMultilineCall,
      });
      continue;
    }
    const arg = call.firstArgRaw.trim();
    const first = arg[0];
    if (first === "'" || first === '"') continue;
    if (first === '`' && arg.endsWith('`')) {
      const inner = arg.slice(1, -1);
      if (!/\$\{/.test(inner)) continue;
      const analysis = analyzeTemplateCall(inner, constMap);
      if (analysis.classification === 'fully_resolved') continue;
      out.push({
        kind: 'template_interpolation',
        functionName: call.functionName,
        matchIndex: at,
        closeParenIndex: call.closeParenIndex,
        isMultilineCall: call.isMultilineCall,
        templateFields: dynamicTemplateFieldsFromAnalysis(analysis),
      });
      continue;
    }
    out.push({
      kind: 'non_literal',
      functionName: call.functionName,
      matchIndex: at,
      closeParenIndex: call.closeParenIndex,
      isMultilineCall: call.isMultilineCall,
      nonLiteralHints: nonLiteralHintsForFirstArg(text, arg, constMap),
    });
  }
  return out;
}

/**
 * Merged text: no real file path; comment detection is disabled (positions are not meaningful across files).
 */
export function findDynamicKeySitesInJavascriptMergedText(
  text: string,
  functions: string[],
): DynamicKeySite[] {
  const constMap = buildConstStringMap(text);
  const raw = findDynamicKeySitesRaw(text, functions, constMap);
  return raw.map((site) => ({
    kind: site.kind,
    functionName: site.functionName,
    preview: snippetRange(text, site.matchIndex, site.closeParenIndex + 1, PREVIEW),
    isMultilineCall: site.isMultilineCall,
    ...rawSiteToDynamicFields(site),
  }));
}

