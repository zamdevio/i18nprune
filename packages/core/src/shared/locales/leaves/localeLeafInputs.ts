import type { LocaleLeafMode } from '../../../types/locales/leaves/index.js';

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
