export { createEdgeSystemRuntime } from './system.js';
export { edgePathRuntime } from './path.js';
export { createEdgeReadFsRuntime } from './fs.js';

import { createEdgeReadFsRuntime } from './fs.js';
import { edgePathRuntime } from './path.js';
import { createEdgeSystemRuntime } from './system.js';
import { createAmbientNetworkPort } from '../shared/network.js';
import type { RuntimeFsPort, RuntimeReadFsPort } from '../contracts/index.js';
import type { RuntimeAdapters } from '../../types/runtime/adapters.js';

export function createRuntimeAdapters(input: {
  fs: RuntimeReadFsPort & Partial<RuntimeFsPort>;
  cwd?: string;
  now?: () => number;
}): RuntimeAdapters {
  return {
    kind: 'edge',
    system: createEdgeSystemRuntime({ cwd: input.cwd, now: input.now }),
    path: edgePathRuntime,
    fs: createEdgeReadFsRuntime(input.fs),
    network: createAmbientNetworkPort(),
  };
}
