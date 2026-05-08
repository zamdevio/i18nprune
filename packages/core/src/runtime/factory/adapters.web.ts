import type { RuntimeFsPort, RuntimeReadFsPort } from '../contracts/index.js';
import type { RuntimeAdapters } from '../../types/runtime/adapters.js';
import { createRuntimeAdapters as createWebAdapters } from '../web/index.js';

export function createWebRuntimeAdapters(input: {
  fs: RuntimeReadFsPort & Partial<RuntimeFsPort>;
  cwd?: string;
  now?: () => number;
}): RuntimeAdapters {
  return createWebAdapters(input);
}
