import { header, line, scanLine, style } from '@/utils/ansi/index.js';
import { getRunOptions } from '@i18nprune/core';
import type { RunOptions } from '@/types/core/runtime/index.js';
import type { LoggerMask } from '@/types/core/logger/index.js';
import type { HeaderOptions, LogLevel } from '@/types/utils/ansi/index.js';
import { canEmit, resolveRun } from '@/utils/logger/policy.js';

export * from '@/utils/logger/policy.js';

export type { LoggerMask, LogLevel, HeaderOptions };

function baseRun(run?: RunOptions): RunOptions {
  return run ?? getRunOptions();
}

function effective(run: RunOptions | undefined, mask?: LoggerMask): RunOptions {
  return resolveRun(baseRun(run), mask);
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
    console.log(line('info', msg));
  },

  /** `[i18nprune] [warn] …` — still prints in quiet unless silent/json. */
  warn(msg: string, run?: RunOptions, mask?: LoggerMask): void {
    const r = effective(run, mask);
    if (!canEmit(r, 'warn')) return;
    console.warn(line('warn', msg));
  },

  /** `[i18nprune] [scan] …` — source walk skip reasons (`--debug-scan` sink); stderr, **hidden under `--quiet`** (like `info`). */
  scan(msg: string, run?: RunOptions, mask?: LoggerMask): void {
    const r = effective(run, mask);
    if (!canEmit(r, 'scan')) return;
    console.warn(scanLine(msg));
  },

  /** Always prints (stderr). */
  err(msg: string): void {
    console.error(line('error', msg));
  },

  /** Deprecated alias — use `err`. */
  error(msg: string): void {
    console.error(line('error', msg));
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

/** Bound logger for a fixed **`RunOptions`** (e.g. `ctx.run`) — same API, no repeated `run` arg. */
export function loggerFor(run: RunOptions) {
  return {
    info: (msg: string, mask?: LoggerMask) => logger.info(msg, run, mask),
    warn: (msg: string, mask?: LoggerMask) => logger.warn(msg, run, mask),
    scan: (msg: string, mask?: LoggerMask) => logger.scan(msg, run, mask),
    err: logger.err,
    error: logger.error,
    detail: (msg: string, mask?: LoggerMask) => logger.detail(msg, run, mask),
    plain: (msg: string, mask?: LoggerMask) => logger.plain(msg, run, mask),
    primary: (msg: string, mask?: LoggerMask) => logger.primary(msg, run, mask),
    decorative: {
      dim: (msg: string, mask?: LoggerMask) => logger.decorative.dim(msg, run, mask),
      blank: (mask?: LoggerMask) => logger.decorative.blank(run, mask),
      printHeader: (
        title: string,
        buildHeader: (t: string, o?: HeaderOptions) => string,
        options?: HeaderOptions,
        mask?: LoggerMask,
      ) => logger.decorative.printHeader(title, buildHeader, options, run, mask),
    },
  };
}

/** Box header — uses decorative gate. */
export function printHeader(title: string, options?: HeaderOptions, run?: RunOptions, mask?: LoggerMask): void {
  logger.decorative.printHeader(title, header, options, run, mask);
}

export { style };
