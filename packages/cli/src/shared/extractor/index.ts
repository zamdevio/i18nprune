export { toExtractorScanInput } from './scanInput.js';
export type { ExtractorProjectScanInput } from '@/types/shared/extractor/index.js';

export {
  analyzeDynamicKeysFromSourceText,
  findDynamicKeySites,
  scanProjectDynamicKeySites,
} from './dynamic.js';

export {
  literalKeyUsageFromObservations,
  scanProjectKeyObservations,
  scanProjectLiteralKeyUsage,
} from './keySites.js';
