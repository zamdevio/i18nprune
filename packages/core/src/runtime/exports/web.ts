/**
 * Web (browser) runtime surface — no `node:*` imports.
 */
export { createWebRuntimeAdapters } from '../factory/adapters.web.js';
export { createWebSystemRuntime } from '../web/system.js';
export { webPathRuntime } from '../web/path.js';
export { createWebReadFsRuntime } from '../web/fs.js';
