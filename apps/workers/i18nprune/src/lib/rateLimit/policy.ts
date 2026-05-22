import {
  UPLOAD_RATE_LIMIT_PER_DAY,
  UPLOAD_RATE_LIMIT_PER_HOUR,
} from '../constants/rateLimit.js';

export type UploadRateLimitCounts = { hour: number; day: number };

export type UploadRateLimitLimits = { perHour: number; perDay: number };

export function uploadRateLimitDecision(
  counts: UploadRateLimitCounts,
  limits: UploadRateLimitLimits = { perHour: UPLOAD_RATE_LIMIT_PER_HOUR, perDay: UPLOAD_RATE_LIMIT_PER_DAY },
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  if (counts.hour > limits.perHour) {
    return { allowed: false, retryAfterSeconds: 3600 };
  }
  if (counts.day > limits.perDay) {
    return { allowed: false, retryAfterSeconds: 86_400 };
  }
  return { allowed: true };
}
