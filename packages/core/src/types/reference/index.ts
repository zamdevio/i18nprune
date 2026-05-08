/**
 * How JSON key paths that may be referenced only via partial/dynamic templates are treated
 * for destructive or shape-changing operations (fill, sync, cleanup, generate, …).
 */
export type UncertainKeyPolicy = 'protect' | 'allow' | 'warn_only';

/**
 * Secondary signal: locale **string value** appears as a literal substring in `src/`
 * (via ripgrep). Does not prove static key usage; orthogonal to key-path extraction.
 */
export type StringPresencePolicy = 'guard' | 'warn' | 'off';

/**
 * Defaults merged with optional per-operation overrides (see `ReferenceConfig.commands` — property name mirrors config file keys).
 */
export type ReferenceDefaults = {
  /**
   * When false, translation calls inside comments do not contribute uncertain prefixes
   * or runtime evidence (dynamic sites with `commented` / `isCommented`).
   * @default false
   */
  treatCommentedCallSitesAsRuntime?: boolean;
  /**
   * When false, sites with `isSourceFile === false` are ignored for uncertainty.
   * @default false
   */
  treatNonSourceFileSitesAsRuntime?: boolean;
  /**
   * `protect` — do not remove / do not fill / keep extras on sync under uncertain prefixes.
   * `allow` — ignore uncertain-prefix protection (risky).
   * `warn_only` — same protection as `protect` for now; reserved for softer UX.
   * @default 'protect'
   */
  uncertainKeyPolicy?: UncertainKeyPolicy;
  /**
   * `guard` — skip cleanup removal if rg finds the locale string in src.
   * `warn` — log rg hit locations but still allow removal when uncertain policy allows.
   * `off` — do not run rg.
   * @default 'guard'
   */
  stringPresence?: StringPresencePolicy;
  /** Max rg JSON matches recorded per key (performance). @default 5 */
  stringPresenceMaxHitsPerKey?: number;
  /**
   * When true (default), fill skips paths matching `policies.preserve`. Other operations ignore this.
   * @default true
   */
  respectPreserve?: boolean;
};

/**
 * Override block for one **`reference.commands`** entry (same fields as **`ReferenceDefaults`**).
 * Type name uses “Command” because keys mirror config JSON — not every CLI subcommand.
 */
export type ReferenceCommandOverrides = ReferenceDefaults;

/**
 * Per-operation entries under **`reference.commands`** in config.
 * Known keys: **`cleanup`**, **`fill`**, **`sync`**, **`generate`** — each overrides **`defaults`** for that operation only.
 */
export type ReferenceCommands = {
  /** Reference policy when running **`i18nprune cleanup`**. */
  cleanup?: ReferenceCommandOverrides;
  /** Reference policy when running **`i18nprune fill`**. */
  fill?: ReferenceCommandOverrides;
  /** Reference policy when running **`i18nprune sync`**. */
  sync?: ReferenceCommandOverrides;
  /** Reference policy when running **`i18nprune generate`**. */
  generate?: ReferenceCommandOverrides;
};

/** Root **`reference`** namespace: uncertainty + string-presence defaults and per-operation overrides. */
export type ReferenceConfig = {
  /** Baseline policy merged before any **`commands.*`** block. */
  defaults?: ReferenceDefaults;
  /**
   * Per-operation overrides (**`cleanup`**, **`fill`**, **`sync`**, **`generate`**) deep-merged onto **`defaults`**.
   * Unknown keys are preserved for forward compatibility.
   */
  commands?: ReferenceCommands & Record<string, ReferenceCommandOverrides | undefined>;
};

/**
 * Fully merged reference policy for one operation (defaults + optional **`commands.<op>`** slice).
 */
export type EffectiveReferenceConfig = Required<
  Pick<
    ReferenceDefaults,
    | 'treatCommentedCallSitesAsRuntime'
    | 'treatNonSourceFileSitesAsRuntime'
    | 'uncertainKeyPolicy'
    | 'stringPresence'
    | 'stringPresenceMaxHitsPerKey'
    | 'respectPreserve'
  >
>;

/** Config slice required to resolve effective reference policy (matches `I18nPruneConfig.reference`). */
export type ReferenceConfigSource = {
  reference?: ReferenceConfig;
};

/**
 * Aggregated key-path evidence from keySites + dynamic scans for policy-driven operations.
 */
export type KeyReferenceContext = {
  /** Literal + template_resolved keys (after optional per-file comment filtering in orchestrate). */
  provenKeys: ReadonlySet<string>;
  /**
   * Dotted key path prefixes that may cover runtime-only suffixes (`${…}`, partial templates).
   */
  uncertainPrefixes: string[];
};
