import { createHash } from 'node:crypto';

export function fingerprintSource(source: string): string {
  return createHash('sha256').update(source).digest('hex').slice(0, 16);
}
