export { createWebSystemRuntime } from './system.js';
export { webPathRuntime } from './path.js';
export { createWebReadFsRuntime } from './fs.js';

import { createWebReadFsRuntime } from './fs.js';
import { webPathRuntime } from './path.js';
import { createWebSystemRuntime } from './system.js';
import { createAmbientNetworkPort } from '../shared/network.js';
import type { RuntimeFsPort, RuntimeReadFsPort } from '../contracts/index.js';
import type { RuntimeAdapters } from '../../types/runtime/adapters.js';

export function createRuntimeAdapters(input: {
  fs: RuntimeReadFsPort & Partial<RuntimeFsPort>;
  cwd?: string;
  now?: () => number;
}): RuntimeAdapters {
  return {
    kind: 'web',
    system: createWebSystemRuntime({ cwd: input.cwd, now: input.now }),
    path: webPathRuntime,
    fs: createWebReadFsRuntime(input.fs),
    network: createAmbientNetworkPort(),
  };
}
