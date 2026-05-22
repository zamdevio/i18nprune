/**
 * Conservative detector for Durable Object storage quota / limit failures.
 * Avoid matching generic 500s so `STORAGE_QUOTA_EXCEEDED` stays trustworthy.
 */
export function storageErrorSignature(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.replace(/\d+/g, 'N').slice(0, 240);
}

export function isDurableObjectStorageError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (msg.length === 0) return false;

  const hasStorage =
    msg.includes('storage') ||
    msg.includes('sqlite') ||
    msg.includes('durable object') ||
    msg.includes('durable_object');

  const hasLimit =
    msg.includes('quota') ||
    msg.includes('limit') ||
    msg.includes('exceeded') ||
    msg.includes('too large') ||
    msg.includes('no space') ||
    msg.includes('full') ||
    msg.includes('capacity');

  if (hasStorage && hasLimit) return true;
  if (msg.includes('storage api exceeded')) return true;
  if (msg.includes('object exceeded') && msg.includes('size')) return true;

  return false;
}
