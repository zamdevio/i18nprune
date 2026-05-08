import crypto from 'node:crypto';
import path from 'node:path';

/** Stable project id from normalized project root path. */
export function computeProjectId(projectRoot: string): string {
  const normalized = path.resolve(projectRoot).replace(/\\/g, '/').toLowerCase();
  return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

/** Content hash helper for future file-level cache records. */
export function computeContentHash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}
