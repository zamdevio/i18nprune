import chalk from 'chalk';
import type { RunOptions } from '@i18nprune/core';

const identity = (s: string) => s;

/** Low-level semantic color tokens; `ansi` composes these into lines and layout. */
const chalkStyle = {
  reset: (s: string) => chalk.reset(s),
  bold: (s: string) => chalk.bold(s),
  dim: (s: string) => chalk.dim(s),
  accent: (s: string) => chalk.cyan(s),
  ok: (s: string) => chalk.green(s),
  warn: (s: string) => chalk.yellow(s),
  err: (s: string) => chalk.red(s),
  magenta: (s: string) => chalk.magenta(s),
  blue: (s: string) => chalk.blue(s),
  /** Orange — tip / hint channel (distinct from yellow warn). */
  tip: (s: string) => chalk.hex('#FF8C00')(s),
};

const plainStyle = {
  reset: identity,
  bold: identity,
  dim: identity,
  accent: identity,
  ok: identity,
  warn: identity,
  err: identity,
  magenta: identity,
  blue: identity,
  tip: identity,
};

/** Mutable style object — call {@link configureStyleFromRun} from the CLI `preAction` hook. */
export const style = { ...chalkStyle };

/** Apply `RunOptions.noColor` (identity wrappers vs chalk). */
export function configureStyleFromRun(run: Pick<RunOptions, 'noColor'>): void {
  const next = run.noColor ? plainStyle : chalkStyle;
  Object.assign(style, next);
}
