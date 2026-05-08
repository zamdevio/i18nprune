/**
 * HTTP surface for translation backends and future remote tooling.
 * Hosts supply `globalThis.fetch` (Node 18+, Workers, browsers) or a test double.
 */
export type RuntimeNetworkPort = {
  fetch: typeof globalThis.fetch;
};
