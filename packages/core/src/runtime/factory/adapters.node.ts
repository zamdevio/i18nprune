import type { RuntimeAdapters } from '../../types/runtime/adapters.js';
import { createRuntimeAdapters as createNodeAdapters } from '../node/index.js';

export function createNodeRuntimeAdapters(): RuntimeAdapters {
  return createNodeAdapters();
}
