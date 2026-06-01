import { describe, expect, it } from 'vitest';
import {
  collectPlatformPathWarnings,
  findWindowsReservedSegment,
  isLikelyWindowsLongPath,
  isUncNetworkPath,
  normalizePathKeyForCache,
} from '../platform.js';

describe('shared/path/platform', () => {
  it('normalizes cache keys with NFC and posix slashes', () => {
    const nfd = 'café';
    const nfc = nfd.normalize('NFC');
    expect(normalizePathKeyForCache(`C:\\Proj\\${nfd}`)).toBe(normalizePathKeyForCache(`c:/proj/${nfc}`));
  });

  it('detects Windows reserved segment names', () => {
    expect(findWindowsReservedSegment('locales/con.json')).toBe('con.json');
    expect(findWindowsReservedSegment('messages/en/app.json')).toBeNull();
  });

  it('warns on long and UNC paths', () => {
    const long = 'C:\\' + 'a'.repeat(300);
    const warnings = collectPlatformPathWarnings([{ label: 'Locales', absolutePath: long }]);
    expect(warnings.some((w) => w.code === 'i18nprune.paths.windows_long_path')).toBe(true);
    expect(isUncNetworkPath('\\\\server\\share\\proj')).toBe(true);
    expect(isLikelyWindowsLongPath(long)).toBe(true);
  });
});
