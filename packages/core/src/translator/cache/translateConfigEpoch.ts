import type { I18nPruneConfig } from '../../config/index.js';
import { computeCacheContentHash } from '../../cache/io/hash.js';

type TranslateProviderRow = NonNullable<I18nPruneConfig['translate']>['providers'][number];

function stripProviderSecrets(row: TranslateProviderRow): Record<string, unknown> {
  const out: Record<string, unknown> = { ...row };
  if ('apiKey' in out) delete out.apiKey;
  return out;
}

/** Stable digest of translate policy inputs that affect provider output (secrets excluded). */
export function computeTranslateConfigEpoch(translate: I18nPruneConfig['translate']): string {
  if (translate === undefined) return 'none';
  const payload = {
    primary: translate.primary,
    workers: translate.workers,
    policy: translate.policy,
    providers: translate.providers.map(stripProviderSecrets),
  };
  return computeCacheContentHash(JSON.stringify(payload));
}
