import { cliSpawnEnv } from '../helpers/cliEnv.js';

/** Stable child env for parity CLI spawns (`NO_COLOR=1`; no npm update notices on stderr). */
export function paritySpawnEnv(): NodeJS.ProcessEnv {
  return cliSpawnEnv({ I18NPRUNE_NO_UPDATE_CHECK: '1', NO_COLOR: '1' });
}
