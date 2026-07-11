import { describe, expect, it } from 'vitest';
import { ISSUE_LOCALE_PLACEHOLDER_SENTINEL_LEAK } from '../../constants/issueCodes.js';
import {
  buildGenerateSentinelRepairRecords,
  containsPlaceholderSentinelLeak,
  isSentinelLeakPending,
  issuesFromSentinelLeakHits,
  planSentinelLeakGenerateRepairs,
  repairSentinelLeaksCopyFromSource,
  scanLocaleForSentinelLeaks,
  applySentinelLeakRepairsToLocaleJson,
} from '../sentinelLeak.js';

describe('sentinelLeak', () => {
  it('scanLocaleForSentinelLeaks detects tight and spaced sentinels on plain leaves', () => {
    const localeJson = {
      dashboard: {
        recentActivity: {
          meta: '__ I18NPRUNE_0 __ · __ I18NPRUNE_1 __',
        },
        title: 'ok',
      },
      footer: '__I18NPRUNE_0__',
    };
    const hits = scanLocaleForSentinelLeaks(localeJson, { localeCode: 'ar' });
    expect(hits).toHaveLength(2);
    expect(hits.map((h) => h.path).sort()).toEqual([
      'dashboard.recentActivity.meta',
      'footer',
    ]);
    expect(hits.every((h) => h.localeCode === 'ar')).toBe(true);
  });

  it('scanLocaleForSentinelLeaks reads metadata `.value` leaves', () => {
    const localeJson = {
      app: {
        greeting: {
          value: '__ I18NPRUNE_0 __',
          confidence: 0.9,
          status: 'translated',
        },
      },
    };
    const hits = scanLocaleForSentinelLeaks(localeJson, { localeCode: 'fr' });
    expect(hits).toEqual([
      expect.objectContaining({
        path: 'app.greeting',
        value: '__ I18NPRUNE_0 __',
        localeCode: 'fr',
      }),
    ]);
  });

  it('repairSentinelLeaksCopyFromSource copies non-leak source over leaked target', () => {
    const source = new Map([
      ['a', '{{who}} · {{status}}'],
      ['b', '__ I18NPRUNE_0 __'],
    ]);
    const target = new Map([
      ['a', '__ I18NPRUNE_0 __ · __ I18NPRUNE_1 __'],
      ['b', '__ I18NPRUNE_0 __'],
    ]);
    const { next, repairs } = repairSentinelLeaksCopyFromSource(source, target);
    expect(next.get('a')).toBe('{{who}} · {{status}}');
    expect(next.get('b')).toBe('__ I18NPRUNE_0 __');
    expect(repairs).toEqual([
      {
        path: 'a',
        mode: 'copy_source',
        from: '__ I18NPRUNE_0 __ · __ I18NPRUNE_1 __',
        to: '{{who}} · {{status}}',
      },
    ]);
  });

  it('planSentinelLeakGenerateRepairs classifies placeholder-only vs translate', () => {
    const hits = [
      { path: 'fmt', value: '__I18NPRUNE_0__', localeCode: 'ar' },
      { path: 'body', value: '__ I18NPRUNE_0 __', localeCode: 'ar' },
    ];
    const source = new Map([
      ['fmt', '{{who}} · {{status}}'],
      ['body', 'Hello {{name}}'],
    ]);
    expect(planSentinelLeakGenerateRepairs(hits, source)).toEqual([
      { path: 'fmt', mode: 'placeholder_copy', sourceValue: '{{who}} · {{status}}' },
      { path: 'body', mode: 'translate', sourceValue: 'Hello {{name}}' },
    ]);
  });

  it('isSentinelLeakPending treats leaked values as incomplete', () => {
    expect(isSentinelLeakPending(undefined)).toBe(false);
    expect(isSentinelLeakPending('translated')).toBe(false);
    expect(isSentinelLeakPending('__I18NPRUNE_0__')).toBe(true);
    expect(isSentinelLeakPending('__ I18NPRUNE_0 __')).toBe(true);
  });

  it('buildGenerateSentinelRepairRecords maps hits to JSON rows with from/sourceValue/to', () => {
    const hits = [
      { path: 'meta', value: '__ I18NPRUNE_0 __', localeCode: 'ar' },
      { path: 'title', value: '__I18NPRUNE_1__', localeCode: 'ar' },
    ];
    const planned = planSentinelLeakGenerateRepairs(hits, new Map([
      ['meta', '{{who}}'],
      ['title', 'Hello'],
    ]));
    const rows = buildGenerateSentinelRepairRecords(hits, planned, 'ar', '/tmp/ar.json');
    expect(rows).toEqual([
      expect.objectContaining({
        path: 'meta',
        mode: 'placeholder_copy',
        from: '__ I18NPRUNE_0 __',
        sourceValue: '{{who}}',
        to: '{{who}}',
        localeCode: 'ar',
        localeFile: '/tmp/ar.json',
      }),
      expect.objectContaining({
        path: 'title',
        mode: 'translate',
        from: '__I18NPRUNE_1__',
        sourceValue: 'Hello',
        localeCode: 'ar',
      }),
    ]);
    expect(rows[1]?.to).toBeUndefined();
  });

  it('issuesFromSentinelLeakHits groups by locale with paths and suggestion commands', () => {
    const issues = issuesFromSentinelLeakHits([
      { path: 'a', value: '__I18NPRUNE_0__', localeCode: 'ar' },
      { path: 'b', value: '__ I18NPRUNE_1 __', localeCode: 'ar' },
    ]);
    expect(issues).toEqual([
      expect.objectContaining({
        severity: 'warning',
        code: ISSUE_LOCALE_PLACEHOLDER_SENTINEL_LEAK,
        localeCode: 'ar',
        paths: ['a', 'b'],
        suggestion: {
          commands: [
            'i18nprune sync --target ar',
            'i18nprune generate --metadata --target ar',
          ],
        },
      }),
    ]);
    expect(issues[0]!.message).toContain('__I18NPRUNE_*');
  });

  it('applySentinelLeakRepairsToLocaleJson preserves structured leaf metadata', () => {
    const localeJson = {
      app: {
        title: {
          value: '__ I18NPRUNE_0 __',
          status: 'translated',
          confidence: 0.8,
        },
      },
    };
    const next = applySentinelLeakRepairsToLocaleJson(localeJson, [
      {
        path: 'app.title',
        mode: 'copy_source',
        from: '__ I18NPRUNE_0 __',
        to: '{{pageTitle}}',
      },
    ]);
    expect(next).toEqual({
      app: {
        title: {
          value: '{{pageTitle}}',
          status: 'translated',
          confidence: 0.8,
        },
      },
    });
  });

  it('containsPlaceholderSentinelLeak re-export matches placeholders module', () => {
    expect(containsPlaceholderSentinelLeak('plain')).toBe(false);
    expect(containsPlaceholderSentinelLeak('__ I18NPRUNE_2 __')).toBe(true);
  });
});
