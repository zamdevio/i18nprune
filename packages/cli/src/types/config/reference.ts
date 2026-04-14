/**
 * How JSON key paths that may be referenced only via partial/dynamic templates are treated
 * for destructive or shape-changing commands.
 */
export type UncertainKeyPolicy = 'protect' | 'allow' | 'warn_only';

/**
 * Secondary signal: locale **string value** appears as a literal substring in `src/`
 * (via ripgrep). Does not prove static key usage; orthogonal to key-path extraction.
 */
export type StringPresencePolicy = 'guard' | 'warn' | 'off';

/** Defaults merged with optional per-command overrides. */
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
   * When true (default), fill skips paths matching `policies.preserve`. Other commands ignore this.
   * @default true
   */
  respectPreserve?: boolean;
};

export type ReferenceCommandOverrides = ReferenceDefaults;

export type ReferenceCommands = {
  cleanup?: ReferenceCommandOverrides;
  fill?: ReferenceCommandOverrides;
  sync?: ReferenceCommandOverrides;
  generate?: ReferenceCommandOverrides;
};

export type ReferenceConfig = {
  defaults?: ReferenceDefaults;
  /** Per-command overrides (deep-merge onto defaults). Unknown keys preserved at runtime. */
  commands?: ReferenceCommands & Record<string, ReferenceCommandOverrides | undefined>;
};

/** Effective policy after merging defaults + command overrides. */
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
