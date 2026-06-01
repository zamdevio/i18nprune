import type { CoreEngineRuntime, RuntimeNetworkCap } from './capabilities.js';
import type { RuntimeKind } from './kind.js';

/**
 * Full host binding for CLI / Workers: project I/O, HTTP, and runtime kind.
 */
export type RuntimeAdapters = CoreEngineRuntime & RuntimeNetworkCap & { kind: RuntimeKind };
