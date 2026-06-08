import type { ConstSubstitutionStep } from '../../types/extractor/keySites/index.js';
import type {
  TemplateCallAnalysis,
  TemplateCallClassification,
} from '../../types/extractor/template/index.js';

/** Optional template metadata attached to dynamic `template_interpolation` sites. */
export type DynamicTemplateFields = {
  /** Same value as legacy `resolvedPrefix` — longest static dotted prefix before runtime holes. */
  staticPrefix?: string;
  resolvedPrefix?: string;
  runtimeSegments?: string[];
  classification?: TemplateCallClassification;
  constSubstitutions?: ConstSubstitutionStep[];
};

/**
 * Map shared template analysis to dynamic-site JSON / CLI fields.
 * Keeps `resolvedPrefix` for reference-context merge while exposing `staticPrefix` for display.
 */
export function dynamicTemplateFieldsFromAnalysis(
  analysis: TemplateCallAnalysis,
): DynamicTemplateFields {
  const fields: DynamicTemplateFields = {
    classification: analysis.classification,
  };
  if (analysis.substitutions.length > 0) {
    fields.constSubstitutions = analysis.substitutions;
  }
  if (analysis.runtimeSegments.length > 0) {
    fields.runtimeSegments = analysis.runtimeSegments;
  }
  if (analysis.staticPrefix !== null) {
    fields.staticPrefix = analysis.staticPrefix;
    fields.resolvedPrefix = analysis.staticPrefix;
  }
  return fields;
}
