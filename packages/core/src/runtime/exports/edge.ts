/**
 * Edge (Workers, etc.) runtime surface — no `node:*` imports.
 */
export { createEdgeRuntimeAdapters } from '../factory/adapters.edge.js';
export { createEdgeSystemRuntime } from '../edge/system.js';
export { edgePathRuntime } from '../edge/path.js';
export { createEdgeReadFsRuntime } from '../edge/fs.js';
