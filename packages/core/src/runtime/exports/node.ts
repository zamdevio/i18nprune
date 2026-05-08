/**
 * Node-only runtime surface. Import from `@i18nprune/core/runtime/node` (published: `i18nprune/core/runtime/node`)
 * so Workers never resolve `node:*` through the universal core entry.
 */
export {
  nodePathRuntime,
  nodeReadFsRuntime,
  nodeSystemRuntime,
} from '../node/index.js';
export { createNodeRuntimeAdapters } from '../factory/adapters.node.js';
export { createRuntimeAdaptersForKind } from '../factory/adapters.dispatch.js';
