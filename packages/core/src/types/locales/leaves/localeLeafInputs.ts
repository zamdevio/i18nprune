import type { LocaleLeafMode } from './localeLeafMode.js';

export type ApplyLocaleMetadataModeInput = {
  localeJson: unknown;
  sourceMap: Map<string, string>;
  mode: LocaleLeafMode;
  sampleLimit?: number;
};

export type ResolveLocaleLeafModeInput = {
  configMode?: LocaleLeafMode;
  metadataFlag?: boolean;
  stripMetadataFlag?: boolean;
};
