import type { RuntimeFsPort, RuntimeReadFsPort } from '../contracts/index.js';
import type { RuntimeAdapters } from '../../types/runtime/adapters.js';
import { createRuntimeAdapters as createEdgeAdapters } from '../edge/index.js';

export function createEdgeRuntimeAdapters(input: {
  fs: RuntimeReadFsPort & Partial<RuntimeFsPort>;
  cwd?: string;
  now?: () => number;
}): RuntimeAdapters {
  return createEdgeAdapters(input);
}
