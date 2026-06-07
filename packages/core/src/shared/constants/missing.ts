/**
 * Default string **`missing`** writes for keys that appear in code but are absent from the target locale JSON
 * when **`config.missing.placeholder`** is omitted. Override in config for a custom sentinel (or empty string).
 * A non-empty default is distinct from an intentional empty UI string so tooling can **`grep`** scaffolded keys.
 */
export const DEFAULT_MISSING_LEAF_PLACEHOLDER = '__I18NPRUNE_MISSING__' as const;
