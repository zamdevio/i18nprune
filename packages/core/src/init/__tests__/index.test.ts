import { describe, expect, it } from 'vitest';
import {
  buildInitConfigTemplate,
  configFileNameForFormat,
  defaultInitConfigFileName,
} from '../index.js';

describe('init core helpers', () => {
  it('builds config template and file names', () => {
    const tpl = buildInitConfigTemplate();
    expect(tpl).toContain("from 'i18nprune/core/config'");
    expect(tpl).toContain('satisfies Partial<I18nPruneConfig>');
    expect(tpl).toContain('exclude:');
    expect(tpl).toContain("preset: 'production'");
    expect(tpl).toContain('useDefaultSkip: true');
    expect(tpl).toContain('translate:');
    expect(tpl).toContain("primary: 'google'");
    expect(tpl).toContain('providers:');
    expect(tpl).toContain('policy:');
    expect(tpl).toContain('workers: 32');
    expect(tpl).toContain('functions: ["t"]');
    expect(tpl).toContain('mymemory');
    expect(tpl).toContain('contactEmail');
    expect(configFileNameForFormat('i18nprune.config', 'mjs')).toBe('i18nprune.config.mjs');
    expect(defaultInitConfigFileName('i18nprune.config')).toBe('i18nprune.config.ts');
  });

  it('rich template includes optional namespaces', () => {
    const tpl = buildInitConfigTemplate({ rich: true });
    expect(tpl).toContain('patching:');
    expect(tpl).toContain('enabled: false');
    expect(tpl).toContain('scanner:');
    expect(tpl).toContain('cache:');
    expect(tpl).toContain('localeLeaves:');
    expect(tpl).toContain('missing:');
    expect(tpl).toContain('placeholder:');
    expect(tpl).toContain('reference:');
    expect(tpl).toContain('Per-command overrides');
    expect(tpl).toContain('policy:');
    expect(tpl).toContain('routing:');
    expect(tpl).not.toContain('noLocaleMeta:');
    expect(tpl).toContain('output:');
    expect(tpl).toContain('satisfies Partial<I18nPruneConfig>');
  });

  it('next-intl preset targets messages/ + hook names', () => {
    const tpl = buildInitConfigTemplate({ preset: 'next-intl' });
    expect(tpl).toContain('messages/en.json');
    expect(tpl).toContain('messages');
    expect(tpl).toContain('"useTranslations"');
    expect(tpl).toContain('"t"');
  });

  it('i18next preset adds i18n.t entrypoint', () => {
    const tpl = buildInitConfigTemplate({ preset: 'i18next' });
    expect(tpl).toContain('"i18n.t"');
  });

  it('allows custom import specifier', () => {
    const tpl = buildInitConfigTemplate('my-org/i18n-config');
    expect(tpl).toContain("from 'my-org/i18n-config'");
  });
});
