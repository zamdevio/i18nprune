import type { CliGlobalOverrides } from '@/types/core/context/index.js';
import type { I18nPruneEnvSnapshot } from '@/types/core/context/env.js';
import { I18NPRUNE_ENV_KEYS } from '@/constants/env.js';

/**
 * CLI argv / process flags that are not part of merged `I18nPruneConfig` (path overrides use `CliGlobalOverrides`).
 */
let overrides: CliGlobalOverrides = {};

export function setCliGlobalOverrides(next: CliGlobalOverrides): void {
  overrides = { ...overrides, ...next };
}

export function getCliGlobalOverrides(): CliGlobalOverrides {
  return overrides;
}

export function resetCliGlobals(): void {
  overrides = {};
  argvJsonFlag = false;
}

/**
 * Whether the user passed global **`--json`** on argv (set before `setRunOptions`).
 * Used for duplicate-config non-interactive resolution; independent of per-command JSON output.
 */
let argvJsonFlag = false;

export function setArgvJsonFlag(value: boolean): void {
  argvJsonFlag = value;
}

export function getArgvJsonFlag(): boolean {
  return argvJsonFlag;
}

/** `--yes` on the root command → non-interactive `init` / skip create prompts. */
let yesFromArgv = false;

export function setCliYesFlag(value: boolean): void {
  yesFromArgv = value;
}

export function getCliYesFlag(): boolean {
  return yesFromArgv;
}

/** Snapshot of `I18NPRUNE_*` for `config --json` / debugging. */
export function getI18nPruneEnvSnapshot(): I18nPruneEnvSnapshot {
  return Object.fromEntries(I18NPRUNE_ENV_KEYS.map((k) => [k, process.env[k]])) as I18nPruneEnvSnapshot;
}
