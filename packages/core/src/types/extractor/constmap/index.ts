import type { ConstSubstitutionStep } from '../keySites/index.js';

/** Result of resolving `${IDENT}` placeholders in a template fragment. */
export type ResolveKeyPlaceholdersTraceResult = {
  /** Fully resolved dotted key, or `null` if a placeholder could not be substituted. */
  resolved: string | null;
  /** Ordered substitutions applied from `constMap`. */
  substitutions: ConstSubstitutionStep[];
  /** Fragment after the last successful step, if resolution failed mid-way. */
  remainder: string;
};

