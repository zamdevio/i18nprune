import fs from 'node:fs';
import path from 'node:path';
import { select } from '@inquirer/prompts';
import { getArgvJsonFlag } from '@/core/context/globals.js';
import { logger } from '@/utils/logger/index.js';
import { shouldSkipInteractivePrompts } from '@/utils/interactive/index.js';
import { CLI_NAME } from '@/constants/cli.js';
import {
  getExplicitConfigPath,
  listDiscoveredConfigFiles,
  setChosenImplicitPath,
  SUPPORTED_CONFIG_EXTENSIONS,
} from '@/config/resolve/scan.js';

function formatExplicitConfigError(
  cwd: string,
  requestedAbs: string,
  reason: 'missing' | 'not_file' | 'bad_ext',
): void {
  const discovered = listDiscoveredConfigFiles(cwd);
  const rel = path.relative(cwd, requestedAbs);
  const display = rel && !rel.startsWith('..') ? rel : requestedAbs;

  if (reason === 'missing') {
    logger.err(`Config file not found: ${display}`);
  } else if (reason === 'not_file') {
    logger.err(`Config path is not a regular file: ${display}`);
  } else {
    logger.err(
      `Unsupported config file extension for ${path.basename(requestedAbs)} — use .ts, .mts, .cts, .js, .mjs, or .cjs (JSON configs are not supported).`,
    );
  }

  if (discovered.length > 0) {
    const names = discovered.map((p) => path.relative(cwd, p) || path.basename(p)).join(', ');
    logger.info(
      `Discovered ${CLI_NAME} config file(s) in this directory: ${names}. Omit -c/--config to use one of them, or pass a path that exists.`,
    );
  } else {
    logger.err(`No ${CLI_NAME}.config.* file found in ${cwd}.`);
  }
}

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
      formatExplicitConfigError(cwd, abs, 'missing');
      process.exit(1);
      return;
    }
    const st = fs.statSync(abs);
    if (!st.isFile()) {
      setChosenImplicitPath(null);
      formatExplicitConfigError(cwd, abs, 'not_file');
      process.exit(1);
      return;
    }
    const ext = path.extname(abs).toLowerCase();
    if (!SUPPORTED_CONFIG_EXTENSIONS.has(ext)) {
      setChosenImplicitPath(null);
      formatExplicitConfigError(cwd, abs, 'bad_ext');
      process.exit(1);
      return;
    }
    const discovered = listDiscoveredConfigFiles(cwd);
    const others = discovered.filter((p) => path.resolve(p) !== path.resolve(abs));
    if (others.length > 0) {
      logger.warn(
        `Multiple ${CLI_NAME} config files in this directory; using ${path.basename(abs)} from --config. Ignored: ${others.map((p) => path.basename(p)).join(', ')}`,
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
      `Multiple ${CLI_NAME} config files found: ${found.map((p) => path.basename(p)).join(', ')}. Pick one with --config <path> or remove the extras.`,
    );
    process.exit(1);
  }

  const chosen = await select({
    message: `Which config file should ${CLI_NAME} use?`,
    choices: found.map((p) => ({
      value: p,
      name: path.relative(cwd, p) || p,
    })),
  });
  setChosenImplicitPath(chosen);
}
