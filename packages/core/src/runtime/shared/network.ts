import type { RuntimeNetworkPort } from '../../types/runtime/network.js';

/** `globalThis.fetch` bound for stable identity (Node, browsers, Workers). */
export function createAmbientNetworkPort(): RuntimeNetworkPort {
  return {
    fetch: globalThis.fetch.bind(globalThis) as typeof globalThis.fetch,
  };
}
