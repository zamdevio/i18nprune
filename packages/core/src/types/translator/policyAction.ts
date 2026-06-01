import type { ProviderHealthMonitor } from '../../shared/translator/utils/providerHealth.js';
import type { TranslatePolicy, TranslatePolicyVerb } from './policy.js';
import type { TranslateFailureOutcome } from './policyOutcomes.js';

export type TranslatePolicyAction = {
  readonly verb: TranslatePolicyVerb;
  readonly escalatedFrom?: TranslatePolicyVerb;
  readonly reason: string;
};

export type ResolveProviderActionInput = {
  readonly outcome: TranslateFailureOutcome;
  readonly policy: TranslatePolicy;
  readonly health: ProviderHealthMonitor;
  readonly providerId: string;
  readonly escalationThreshold?: number;
  readonly hint?: { readonly retryAfterMs?: number };
};
