import fs from 'node:fs';
import { i18npruneTestHomeRoot } from '../helpers/cliEnv.js';

/**
 * In-process CLI tests (`resolveContext`, command envelopes) read cache via
 * `resolveI18nPruneCacheRootDir()` — same as spawned `dist/cli.js` tests must
 * not write under `~/.i18nprune`.
 */
const testHome = i18npruneTestHomeRoot();
fs.mkdirSync(testHome, { recursive: true });
process.env.I18NPRUNE_HOME = testHome;
