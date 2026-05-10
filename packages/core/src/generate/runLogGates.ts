import type { RunOptions } from '../types/runtime/index.js';

/** Mirrors CLI logger policy for generate human output (no `console` — callers invoke hooks). */
export function generateCanPrintInfo(run: RunOptions | undefined): boolean {
  if (!run) return false;
  return !run.json && !run.quiet && !run.silent;
}

export function generateCanPrintWarn(run: RunOptions | undefined): boolean {
  if (!run) return false;
  return !run.json && !run.silent;
}

export function generateCanPrintPrimary(run: RunOptions | undefined): boolean {
  if (!run) return false;
  return !run.json && !run.silent;
}
