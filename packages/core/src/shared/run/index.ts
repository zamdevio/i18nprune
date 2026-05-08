import type { Issue } from '../../types/json/envelope/index.js';
import type {
  FillProgressEvent,
  GenerateProgressEvent,
  OperationId,
  RunEmitter,
  RunEvent,
  SyncProgressEvent,
  ValidateProgressEvent,
} from '../../types/shared/run/index.js';
import { normalizeUnknownError } from '../errors/index.js';

export type { RunEmitter, RunEvent } from '../../types/shared/run/index.js';

export const noopRunEmitter: RunEmitter = () => {};

/** Emit a `run.*` event (guarded; never throws). */
export function emitRunEvent(emit: RunEmitter | undefined, event: RunEvent): void {
  if (!emit) return;
  try {
    emit(event);
  } catch {
    // Intentionally swallow: core must not crash on host event handling.
  }
}

export function nowMs(): number {
  return Date.now();
}

/** Narrow a run event to any `run.progress.*` variant. */
export function isProgressEvent(
  event: RunEvent,
): event is GenerateProgressEvent | FillProgressEvent | SyncProgressEvent | ValidateProgressEvent {
  return event.type.startsWith('run.progress.');
}

/** Emit `run.error` events for a list of structured issues. */
export function emitIssuesAsRunErrors(
  emit: RunEmitter | undefined,
  input: { op: OperationId; runId?: string; issues: readonly Issue[]; at?: number; recoverable: boolean },
): void {
  const at = input.at ?? nowMs();
  for (const issue of input.issues) {
    emitRunEvent(emit, {
      type: 'run.error',
      op: input.op,
      runId: input.runId,
      at,
      issue,
      recoverable: input.recoverable,
    });
  }
}

/** Emit one synthetic `run.error` issue from an unknown thrown value. */
export function emitRunErrorFromUnknown(
  emit: RunEmitter | undefined,
  input: { op: OperationId; runId?: string; err: unknown; code: string; at?: number; recoverable: boolean },
): void {
  const normalized = normalizeUnknownError(input.err, {
    when: 'Run error',
    defaultCode: 'INTERNAL',
  });
  emitRunEvent(emit, {
    type: 'run.error',
    op: input.op,
    runId: input.runId,
    at: input.at ?? nowMs(),
    issue: {
      severity: 'error',
      code: input.code,
      message: normalized.message,
    },
    recoverable: input.recoverable,
  });
}

