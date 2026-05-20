import { emitRunMessage } from '../../shared/run/index.js';
import type { RunEmitter } from '../../types/shared/run/index.js';

export type ShareCacheDebugLine = {
  level: 'info' | 'detail';
  message: string;
};

/** Emits `[cache]` run messages for share when the host enabled `--debug-cache`. */
export function emitShareCacheDebug(input: {
  emit: RunEmitter | undefined;
  runId: string | undefined;
  enabled: boolean;
  lines: readonly ShareCacheDebugLine[];
}): void {
  if (!input.enabled) return;
  for (const line of input.lines) {
    emitRunMessage(input.emit, {
      op: 'share',
      runId: input.runId,
      channel: 'cache',
      level: line.level === 'detail' ? 'detail' : 'info',
      message: line.message,
    });
  }
}
