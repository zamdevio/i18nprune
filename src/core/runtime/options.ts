import type { RunOptions } from '@/types/core/runtime/index.js';

let run: RunOptions = { json: false, quiet: false, silent: false };

export function resetRunOptions(): void {
  run = { json: false, quiet: false, silent: false };
}

export function setRunOptions(partial: Partial<RunOptions>): void {
  run = { ...run, ...partial };
}

export function getRunOptions(): RunOptions {
  return run;
}
