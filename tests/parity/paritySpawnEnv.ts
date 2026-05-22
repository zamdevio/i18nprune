/** Stable child env for parity CLI spawns (no color; no npm update notices on stderr). */
export function paritySpawnEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    FORCE_COLOR: '0',
    I18NPRUNE_NO_UPDATE_CHECK: '1',
  };
}
