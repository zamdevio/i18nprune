export type PrepareHostKind = 'cli-share' | 'web' | 'worker-archive';

export type PrepareHostPolicy = {
  prepareHost: PrepareHostKind;
  useAnalysisCache: boolean;
};
