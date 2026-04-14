import type { Context } from '@/types/core/context/index.js';
import type { I18nPruneEnvSnapshot } from '@/types/core/context/env.js';
import type { RunOptions } from '@/types/core/runtime/index.js';

export type ResolvedPathKind = 'file' | 'directory' | 'missing';

export type ConfigSnapshot = {
  kind: 'i18nprune.config';
  cliVersion: string;
  configPath: string | null;
  config: unknown;
  resolvedPaths: Context['paths'];
  /** Which layer last wrote each config field (`file` = from config **file**, not “filesystem file”). */
  fieldSources: Context['meta']['fieldSources'];
  /** Whether each resolved path is a file, directory, or missing on disk. */
  resolvedPathKinds: Record<keyof Context['paths'], ResolvedPathKind>;
  env: I18nPruneEnvSnapshot;
  run: RunOptions;
};
