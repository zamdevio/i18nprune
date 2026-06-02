import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** Shared cache root for real dist/cli.js test spawns (cross-OS temp directory). */
export function i18npruneTestHomeRoot(): string {
  return path.join(os.tmpdir(), 'i18nprune');
}

/** Standard child-process env for CLI tests that execute dist/cli.js directly. */
export function cliSpawnEnv(extraEnv?: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const home = i18npruneTestHomeRoot();
  fs.mkdirSync(home, { recursive: true });
  return {
    ...process.env,
    FORCE_COLOR: '0',
    I18NPRUNE_HOME: home,
    ...extraEnv,
  };
}
