import { ENV_CI, ENV_I18NPRUNE_NO_UPDATE_CHECK } from '@/constants/env.js';

function truthyEnv(v: string | undefined): boolean {
  if (v === undefined) return false;
  const x = v.trim().toLowerCase();
  return x === '1' || x === 'true' || x === 'yes';
}

function ciLike(): boolean {
  return truthyEnv(process.env[ENV_CI]);
}

/** Skip registry lookup (opt-out or CI — avoids noise and extra network in pipelines). */
export function shouldSkipUpdateCheck(): boolean {
  if (truthyEnv(process.env[ENV_I18NPRUNE_NO_UPDATE_CHECK])) return true;
  if (ciLike()) return true;
  return false;
}
