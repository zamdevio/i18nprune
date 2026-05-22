import { ENV_I18NPRUNE_WORKER_URL } from '@/constants/env.js';
import { DEFAULT_WORKER_API_URL, normalizeWorkerBaseUrl } from '@i18nprune/core';

/** CLI: `--worker-url` wins over `I18NPRUNE_WORKER_URL`, then core production default. */
export function resolveCliShareWorkerBaseUrl(flag?: string): string {
  const raw = flag?.trim() || process.env[ENV_I18NPRUNE_WORKER_URL]?.trim() || DEFAULT_WORKER_API_URL;
  return normalizeWorkerBaseUrl(raw);
}
