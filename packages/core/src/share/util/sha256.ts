import { I18nPruneError } from '../../shared/errors/internal.js';

function bufferToHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** SHA-256 hex digest of raw bytes (Web Crypto). */
export async function sha256HexBytes(bytes: Uint8Array): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new I18nPruneError(
      'Web Crypto API (globalThis.crypto.subtle) is required for share payload hashing.',
      'INTERNAL',
      { issueCode: 'i18nprune.share.zip_failed' },
    );
  }
  const digest = await subtle.digest({ name: 'SHA-256' }, new Uint8Array(bytes));
  return bufferToHex(new Uint8Array(digest));
}
