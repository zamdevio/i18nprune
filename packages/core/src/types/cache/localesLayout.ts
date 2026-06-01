import type { LocalesLayoutMode, LocalesLayoutStructure } from '../locales/layout.js';

/** Layout fingerprint stored in `files.json` (`mode` + `structure` + config paths). */
export type CachedLocalesLayout = {
  mode: LocalesLayoutMode;
  structure: LocalesLayoutStructure;
  directory: string;
  source: string;
};
