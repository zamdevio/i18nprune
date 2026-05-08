export { nodeSystemRuntime } from './system.js';
export { nodePathRuntime } from './path.js';
export { nodeReadFsRuntime } from './fs.js';
import { nodeReadFsRuntime } from './fs.js';
import { nodePathRuntime } from './path.js';
import { nodeSystemRuntime } from './system.js';
import { createAmbientNetworkPort } from '../shared/network.js';
import type { RuntimeAdapters } from '../../types/runtime/adapters.js';

export function createRuntimeAdapters(): RuntimeAdapters {
  return {
    kind: 'node',
    system: nodeSystemRuntime,
    path: nodePathRuntime,
    fs: nodeReadFsRuntime,
    network: createAmbientNetworkPort(),
  };
}
