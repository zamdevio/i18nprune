import fs from 'node:fs';
import path from 'node:path';
import { select } from '@inquirer/prompts';
import { getArgvJsonFlag } from '@/core/context/globals.js';
import { logger } from '@/utils/logger/index.js';
import { shouldSkipInteractivePrompts } from '@/utils/interactive/index.js';
import {
  getExplicitConfigPath,
  listDiscoveredConfigFiles,
  setChosenImplicitPath,
} from '@/config/resolve/scan.js';

/**
 * Call once per CLI invocation (e.g. `preAction`) before loading config.
 * Resolves duplicate config files: interactive pick, or exit 1 when non-interactive.
 */
export async function ensureConfigPathResolved(cwd = process.cwd()): Promise<void> {
  const explicit = getExplicitConfigPath();
  if (explicit) {
    const abs = path.isAbsolute(explicit) ? explicit : path.resolve(cwd, explicit);
    if (!fs.existsSync(abs)) {
      setChosenImplicitPath(null);
      return;
    }
    const discovered = listDiscoveredConfigFiles(cwd);
    const others = discovered.filter((p) => path.resolve(p) !== path.resolve(abs));
    if (others.length > 0) {
      logger.warn(
        `Multiple i18nprune config files in this directory; using ${path.basename(abs)} from --config. Ignored: ${others.map((p) => path.basename(p)).join(', ')}`,
      );
    }
    setChosenImplicitPath(abs);
    return;
  }

  const found = listDiscoveredConfigFiles(cwd);
  if (found.length === 0) {
    setChosenImplicitPath(null);
    return;
  }
  if (found.length === 1) {
    setChosenImplicitPath(found[0]!);
    return;
  }

  const nonInteractive = shouldSkipInteractivePrompts() || getArgvJsonFlag();
  if (nonInteractive) {
    logger.err(
      `Multiple i18nprune config files found: ${found.map((p) => path.basename(p)).join(', ')}. Pick one with --config <path> or remove the extras.`,
    );
    process.exit(1);
  }

  const chosen = await select({
    message: 'Which config file should i18nprune use?',
    choices: found.map((p) => ({
      value: p,
      name: path.relative(cwd, p) || p,
    })),
  });
  setChosenImplicitPath(chosen);
}
