import chalk from 'chalk';

/** Low-level semantic color tokens; `ansi` composes these into lines and layout. */
export const style = {
  reset: (s: string) => chalk.reset(s),
  bold: (s: string) => chalk.bold(s),
  dim: (s: string) => chalk.dim(s),
  accent: (s: string) => chalk.cyan(s),
  ok: (s: string) => chalk.green(s),
  warn: (s: string) => chalk.yellow(s),
  err: (s: string) => chalk.red(s),
  magenta: (s: string) => chalk.magenta(s),
  blue: (s: string) => chalk.blue(s),
};
