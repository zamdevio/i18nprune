import type { RunOptions } from '@i18nprune/core';
import type { LogGate } from '@/types/core/logger/index.js';

/**
 * Central policy: every **`logger.*`** call resolves a **`RunOptions`** (global or passed-in) and asks **`canEmit(run, gate)`** before printing.
 * Optional **`mask`** on each call merges on top of the resolved run (per-call overrides).
 *
 * | Predicate | Meaning |
 * |-----------|---------|
 * | `isJsonMode` | Machine-readable mode; no styled human UI. |
 * | `canPrintCommandBanner` | Top box banner per command — **on** in **quiet**; **off** in **silent** / **JSON**. |
 * | `canPrintDecorative` | Dim hints, extra blank lines (stricter than banner — **off** in **quiet**). |
 * | `canPrintInfo` | `[i18nprune] [info]` lines. |
 * | `canPrintNotice` | `[i18nprune] [notice]` lines; warning-styled but hidden with info under **quiet**. |
 * | `canPrintWarn` | `[i18nprune] [warn]` (still **on** in quiet; **off** in silent). |
 * | `canPrintScanDebug` | **`[scan]`** (`--debug-scan` traces) — **off** under **`--quiet`**, **`--silent`**, **`--json`**. |
 * | `canPrintDetail` | Dim / secondary prose. |
 * | `canPrintPrimary` | Main human payload (lists, “Wrote …”). |
 * | `canPrintProgress` | TTY stderr progress. |
 */

export type { LogGate } from '@/types/core/logger/index.js';

export function isJsonMode(run: RunOptions): boolean {
  return run.json;
}

/** Top-of-command box header: show in **quiet**; hide in **silent** and **JSON** only. */
export function canPrintCommandBanner(run: RunOptions): boolean {
  return !run.json && !run.silent;
}

export function canPrintDecorative(run: RunOptions): boolean {
  return !run.json && !run.quiet && !run.silent;
}

export function canPrintInfo(run: RunOptions): boolean {
  return !run.json && !run.quiet && !run.silent;
}

export function canPrintNotice(run: RunOptions): boolean {
  return canPrintInfo(run);
}

export function canPrintWarn(run: RunOptions): boolean {
  return !run.json && !run.silent;
}

/** **`--debug-scan`** trace lines: only reach here when `--debug-scan` wired a sink; treat like **`info`** visibility (suppress under **`--quiet`**). */
export function canPrintScanDebug(run: RunOptions): boolean {
  return !run.json && !run.quiet && !run.silent;
}

export function canPrintDetail(run: RunOptions): boolean {
  return !run.json && !run.quiet && !run.silent;
}

export function canPrintPrimary(run: RunOptions): boolean {
  return !run.json && !run.silent;
}

export function canPrintProgress(run: RunOptions): boolean {
  return !run.json && !run.quiet && !run.silent;
}

/** Single entry for gate checks — use in custom code paths if needed. */
export function canEmit(run: RunOptions, gate: LogGate): boolean {
  switch (gate) {
    case 'info':
      return canPrintInfo(run);
    case 'notice':
      return canPrintNotice(run);
    case 'warn':
      return canPrintWarn(run);
    case 'detail':
      return canPrintDetail(run);
    case 'primary':
      return canPrintPrimary(run);
    case 'decorative':
      return canPrintDecorative(run);
    case 'banner':
      return canPrintCommandBanner(run);
    case 'progress':
      return canPrintProgress(run);
    case 'scan':
      return canPrintScanDebug(run);
    default:
      return false;
  }
}

/** Merge `base` with optional per-call `mask` (e.g. `{ quiet: false }` for one line). */
export function resolveRun(
  base: RunOptions,
  mask?: Partial<RunOptions>,
): RunOptions {
  return mask ? { ...base, ...mask } : base;
}
