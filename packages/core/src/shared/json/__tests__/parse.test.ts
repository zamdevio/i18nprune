import { describe, expect, it } from 'vitest';
import { I18nPruneJsonParseError, parseJsonText, tryParseJsonText } from '../parse.js';

describe('parseJsonText', () => {
  it('parses valid JSON', () => {
    expect(parseJsonText('{"ok":true}')).toEqual({ ok: true });
  });

  it('throws a typed error with file and location context', () => {
    expect(() => parseJsonText('{\n  "ok": true,\n}', { filePath: '/tmp/bad.json' })).toThrow(
      I18nPruneJsonParseError,
    );
    expect(() => parseJsonText('{\n  "ok": true,\n}', { filePath: '/tmp/bad.json' })).toThrow(
      /Invalid JSON in \/tmp\/bad\.json at line \d+, column \d+:/,
    );
  });

  it('returns typed failures without throwing in try mode', () => {
    const result = tryParseJsonText('{"ok":}', { filePath: '/tmp/bad.json' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.filePath).toBe('/tmp/bad.json');
      expect(result.error.code).toBe('IO');
    }
  });
});
