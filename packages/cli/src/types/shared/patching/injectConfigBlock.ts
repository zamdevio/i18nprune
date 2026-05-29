export type PatchingConfigInjectionStatus =
  | 'updated'
  | 'skipped_existing'
  | 'skipped_unrecognized'
  | 'skipped_unsure'
  | 'skipped_multiple_configs'
  | 'skipped_no_config_file';

export type PatchingConfigInjectionAssessment = {
  safe: boolean;
  reason?: string;
};

export type EnsurePatchingConfigBlockResult = {
  status: PatchingConfigInjectionStatus;
  configUpdated: boolean;
  suggestedSnippet: string;
  configFilePath?: string;
  skipReason?: string;
};

export type EnsurePatchingConfigBlockOptions = {
  /** Replace an existing block when required path fields are empty (used by **`patch --fix`**). */
  refreshIfIncomplete?: boolean;
};
