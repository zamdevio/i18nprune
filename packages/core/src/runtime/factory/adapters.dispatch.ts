import type { RuntimeFsPort, RuntimeReadFsPort } from '../contracts/index.js';
import type { RuntimeKind } from '../../types/runtime/kind.js';
import type { RuntimeAdapters } from '../../types/runtime/adapters.js';
import { createNodeRuntimeAdapters } from './adapters.node.js';
import { createWebRuntimeAdapters } from './adapters.web.js';
import { createEdgeRuntimeAdapters } from './adapters.edge.js';

export function createRuntimeAdaptersForKind(
  kind: 'node',
  input?: { cwd?: string; now?: () => number },
): RuntimeAdapters;
export function createRuntimeAdaptersForKind(
  kind: Exclude<RuntimeKind, 'node'>,
  input: { fs: RuntimeReadFsPort & Partial<RuntimeFsPort>; cwd?: string; now?: () => number },
): RuntimeAdapters;
export function createRuntimeAdaptersForKind(
  kind: RuntimeKind,
  input?: { fs?: RuntimeReadFsPort & Partial<RuntimeFsPort>; cwd?: string; now?: () => number },
): RuntimeAdapters {
  if (kind === 'node') return createNodeRuntimeAdapters();
  if (!input?.fs) {
    throw new Error(`Runtime "${kind}" requires fs adapter input`);
  }
  return kind === 'web'
    ? createWebRuntimeAdapters({ fs: input.fs, cwd: input.cwd, now: input.now })
    : createEdgeRuntimeAdapters({ fs: input.fs, cwd: input.cwd, now: input.now });
}
