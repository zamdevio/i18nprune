/** Shared CLI flags for `i18nprune kits` subcommands. */
export type KitsSharedOptions = {
  target?: string;
  out?: string;
  failOn?: string;
  maxDynamic?: number;
  baseline?: string;
  saveBaseline?: string;
};

export type KitsDynamicOptions = KitsSharedOptions & {
  contains?: string;
};

export type KitsIdenticalOptions = KitsSharedOptions & {
  raw?: boolean;
  strict?: boolean;
};

export type KitsHonestOptions = KitsSharedOptions & {
  focus?: string;
  strict?: boolean;
};

export type KitsPrOptions = KitsSharedOptions & {
  focus?: string;
};

export type KitsBaselineSignal = {
  missingLiteralKeys?: number;
  dynamicKeySites?: number;
  sourceIdenticalLeaves?: number;
};
