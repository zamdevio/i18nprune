import { cacheLine, line, scanLine, style, tipLine, verboseLine, type LogFormatOptions } from '@/utils/ansi/index.js';
import { getRunOptions } from '@i18nprune/core';
import type { RunOptions } from '@i18nprune/core';
import type { LoggerMask } from '@/types/core/logger/index.js';
import type { HeaderOptions } from '@/types/utils/ansi/index.js';
import { canEmit, resolveRun } from '@/utils/logger/policy.js';

export * from '@/utils/logger/policy.js';

export type { LoggerMask } from '@/types/core/logger/index.js';
export type { HeaderOptions, LogLevel } from '@/types/utils/ansi/index.js';

function baseRun(run?: RunOptions): RunOptions {
  return run ?? getRunOptions();
}

function effective(run: RunOptions | undefined, mask?: LoggerMask): RunOptions {
  return resolveRun(baseRun(run), mask);
}

function logFormat(run: RunOptions): LogFormatOptions {
  return {
    noLogChannel: Boolean(run.noLogChannel),
    noLogPrefix: Boolean(run.noLogPrefix),
  };
}

/**
 * Process-wide CLI logger. Pass **`run`** (or **`ctx.run`**) when you already have **`Context`**;
 * otherwise **`getRunOptions()`** is used. Optional **`mask`** merges per-call (e.g. force one line
 * through by passing `{ quiet: false }` — rare).
 */
export const logger = {
  /** `[i18nprune] [info] …` — respects info gate. */
  info(msg: string, run?: RunOptions, mask?: LoggerMask): void {
    const r = effective(run, mask);
    if (!canEmit(r, 'info')) return;
    console.log(line('info', msg, logFormat(r)));
  },

  /** `[i18nprune] [notice] …` — warn-styled but respects the info gate. */
  notice(msg: string, run?: RunOptions, mask?: LoggerMask): void {
    const r = effective(run, mask);
    if (!canEmit(r, 'notice')) return;
    console.warn(line('notice', msg, logFormat(r)));
  },

  /** `[i18nprune] [warn] …` — still prints in quiet unless silent/json. */
  warn(msg: string, run?: RunOptions, mask?: LoggerMask): void {
    const r = effective(run, mask);
    if (!canEmit(r, 'warn')) return;
    console.warn(line('warn', msg, logFormat(r)));
  },

  /** `[i18nprune] [scan] …` — source walk skip reasons (`--debug-scan` sink); stderr, **hidden under `--quiet`** (like `info`). */
  scan(msg: string, run?: RunOptions, mask?: LoggerMask): void {
    const r = effective(run, mask);
    if (!canEmit(r, 'scan')) return;
    console.warn(scanLine(msg, logFormat(r)));
  },

  /** `[i18nprune] [cache] …` — opt-in report-cache diagnostics (`--debug-cache`). */
  cache(msg: string, run?: RunOptions, mask?: LoggerMask): void {
    const r = effective(run, mask);
    if (!canEmit(r, 'cache')) return;
    console.log(cacheLine(msg, logFormat(r)));
  },

  /** Indented cache detail (dim only; parent line carries `[cache]`). Gated by `--debug-cache`. */
  cacheDetail(msg: string, run?: RunOptions, mask?: LoggerMask): void {
    const r = effective(run, mask);
    if (!canEmit(r, 'cache')) return;
    console.log(style.dim(msg));
  },

  /** `[i18nprune] [verbose] …` — share view `--verbose`; prints under `--quiet`. */
  verbose(msg: string, run?: RunOptions, mask?: LoggerMask, options?: { dim?: boolean }): void {
    const r = effective(run, mask);
    if (!canEmit(r, 'verbose')) return;
    if (msg === '') {
      console.log('');
      return;
    }
    console.log(verboseLine(msg, options?.dim !== false, logFormat(r)));
  },

  /** `[i18nprune] [tip] …` — actionable hints (orange tag; hidden under `--quiet` / `--json`). */
  tip(msg: string, run?: RunOptions, mask?: LoggerMask): void {
    const r = effective(run, mask);
    if (!canEmit(r, 'tip')) return;
    console.log(tipLine(msg, logFormat(r)));
  },

  /** Always prints (stderr). */
  err(msg: string, run?: RunOptions): void {
    const r = baseRun(run);
    console.error(line('error', msg, logFormat(r)));
  },

  /** Dim secondary lines. */
  detail(msg: string, run?: RunOptions, mask?: LoggerMask): void {
    const r = effective(run, mask);
    if (!canEmit(r, 'detail')) return;
    console.log(style.dim(msg));
  },

  /** Unstyled stdout — primary channel (e.g. raw success text). */
  plain(msg: string, run?: RunOptions, mask?: LoggerMask): void {
    const r = effective(run, mask);
    if (!canEmit(r, 'primary')) return;
    console.log(msg);
  },

  /** Already-styled primary line (ANSI in `msg`). */
  primary(msg: string, run?: RunOptions, mask?: LoggerMask): void {
    const r = effective(run, mask);
    if (!canEmit(r, 'primary')) return;
    console.log(msg);
  },

  decorative: {
    dim(msg: string, run?: RunOptions, mask?: LoggerMask): void {
      const r = effective(run, mask);
      if (!canEmit(r, 'decorative')) return;
      console.log(style.dim(msg));
    },
    blank(run?: RunOptions, mask?: LoggerMask): void {
      const r = effective(run, mask);
      if (!canEmit(r, 'decorative')) return;
      console.log('');
    },
    /** Box header from `header()` builder. */
    printHeader(
      title: string,
      buildHeader: (t: string, o?: HeaderOptions) => string,
      options: HeaderOptions | undefined,
      run?: RunOptions,
      mask?: LoggerMask,
    ): void {
      const r = effective(run, mask);
      if (!canEmit(r, 'banner')) return;
      console.log(buildHeader(title, options));
    },
  },
};
