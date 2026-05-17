import type { InitFilesystemHost } from '../../types/init/index.js';
import type { InitPresetScore, InitProjectSignals } from '../../types/init/index.js';
import { readInitPackageJson } from './packageJson.js';
import { readInitTopologySignals } from './localeTopology.js';
import { scoreInitPresets } from './scorePresets.js';

export type InitDetectResult = {
  signals: InitProjectSignals;
  scores: InitPresetScore[];
};

/**
 * Scan **`projectRoot`** for **`package.json`** markers and locale-directory topology, then score presets.
 *
 * @param host - Filesystem + path ports (**synchronous** ports required).
 * @param projectRoot - Absolute project directory.
 * @returns Structured signals plus preset scores (descending by **`score`**).
 *
 * @remarks No **`console.*`**, no **`process.*`** — uses host ports only.
 */
export function detectInitProject(host: InitFilesystemHost, projectRoot: string): InitDetectResult {
  const packageJson = readInitPackageJson(host, projectRoot);
  const topology = readInitTopologySignals(host, projectRoot);
  const signals: InitProjectSignals = { packageJson, topology };
  const scores = scoreInitPresets(signals);
  return { signals, scores };
}
