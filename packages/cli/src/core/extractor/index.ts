export { exactLiteralKeys } from '@/core/extractor/literals.js';
export {
  scanKeyObservations,
  resolvedKeysFromObservations,
  scanProjectKeyObservations,
  literalKeyUsageFromObservations,
  scanProjectLiteralKeyUsage,
} from '@/core/extractor/keySites/index.js';
export type { ProjectLiteralKeyUsage } from '@/types/core/extractor/keySites/index.js';
export { findDynamicKeySites } from '@/core/extractor/dynamic/index.js';
export { usedRootsFromText } from '@/core/extractor/roots.js';
export { buildFunctionsPattern, escapeRegex } from '@/core/extractor/pattern.js';
