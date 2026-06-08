import { partitionTemplateHoles } from '../constmap/partition.js';
import { resolveKeyPlaceholdersWithTrace } from '../constmap/resolve.js';
import { tryResolveTemplatePrefixBeforeUnknown } from '../dynamic/rebuild.js';
import type {
  TemplateCallAnalysis,
  TemplateCallClassification,
} from '../../types/extractor/template/index.js';

const SIMPLE_IDENT = /^[A-Za-z_$][\w$]*$/;

/**
 * Single per-call template analysis shared by keySites and dynamic extraction.
 * Keeps const-fold vs runtime-hole semantics explicit before dual-pass merge.
 */
export function analyzeTemplateCall(
  templateRaw: string,
  constMap: Record<string, string>,
): TemplateCallAnalysis {
  const partition = partitionTemplateHoles(templateRaw, constMap);
  const trace = resolveKeyPlaceholdersWithTrace(templateRaw, constMap);

  let classification: TemplateCallClassification;
  if (partition.runtime.length === 0) {
    classification = 'fully_resolved';
  } else if (partition.constResolved.length > 0) {
    classification = 'mixed_const_runtime';
  } else {
    classification = 'runtime_only';
  }

  const unresolvedPlaceholders: string[] = [];
  for (const hole of partition.runtime) {
    if (SIMPLE_IDENT.test(hole.expr)) {
      unresolvedPlaceholders.push(hole.expr);
    }
  }

  const staticPrefix =
    classification === 'fully_resolved'
      ? null
      : tryResolveTemplatePrefixBeforeUnknown(templateRaw, constMap);

  return {
    templateRaw,
    classification,
    partition,
    substitutions: trace.substitutions,
    resolvedKey: trace.resolved,
    staticPrefix,
    runtimeSegments: partition.runtime.map((hole) => hole.expr),
    unresolvedPlaceholders,
  };
}
