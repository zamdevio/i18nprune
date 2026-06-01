export type TranslateFailureOutcome =
  | 'rate_limited'
  | 'quota_exceeded'
  | 'transient_network'
  | 'provider_unavailable'
  | 'auth_failure'
  | 'malformed_response'
  | 'unknown_hard_stop';

export type ProviderAttemptOutcome =
  | 'success'
  | 'rate_limited'
  | 'network_error'
  | 'non_retryable_error';
