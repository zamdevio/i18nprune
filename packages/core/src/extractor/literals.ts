import { resolvedKeysFromObservations, scanKeyObservations } from './keySites/scan.js';

/**
 * Collect exact literal translation keys from source text (quoted and simple templates).
 * Implemented via {@link scanKeyObservations} for parity with the keySites model.
 */
export function exactLiteralKeys(text: string, functions: string[], constMap: Record<string, string>): Set<string> {
  return resolvedKeysFromObservations(scanKeyObservations(text, functions, constMap));
}

