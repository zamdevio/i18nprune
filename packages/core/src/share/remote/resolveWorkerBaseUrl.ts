import { DEFAULT_WORKER_API_URL } from '../../shared/constants/links.js';
import { normalizeWorkerBaseUrl } from '../policy/policy.js';

/**
 * Normalizes a host-supplied worker API origin, or {@link DEFAULT_WORKER_API_URL} when omitted.
 * Env / CLI flags are resolved by the host before calling share ops.
 */
export function resolveShareWorkerBaseUrl(workerUrl?: string): string {
  const raw = workerUrl?.trim() || DEFAULT_WORKER_API_URL;
  return normalizeWorkerBaseUrl(raw);
}
