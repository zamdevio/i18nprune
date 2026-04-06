/**
 * A translation call whose first argument is not a static string literal
 * (or a template we cannot resolve to a single key). Validate does not treat these as keys.
 */
export type DynamicKeySite = {
  kind: 'non_literal' | 'template_interpolation' | 'empty_call';
  /** Function name as configured (e.g. `t`). */
  functionName: string;
  /** Short excerpt for logs / JSON (single line). */
  preview: string;
};
