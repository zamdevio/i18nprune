import type { RunEmitter } from '../../types/shared/run/index.js';

/** Host hooks for share human stderr lines (`emit` + optional `runId`). */
export type ShareHumanMessageHost = {
  emit?: RunEmitter;
  runId?: string;
};
