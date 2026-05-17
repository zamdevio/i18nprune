import { describe, it, expect } from 'vitest';
import { parseI18nPruneConfig, ConfigValidationError } from '@i18nprune/core/config';

describe('parseI18nPruneConfig', () => {
  it('parses minimal valid config', () => {
    const c = parseI18nPruneConfig({
      locales: {
        source: 'locales/en.json',
        directory: 'locales',
      },
      src: 'src',
      functions: ['t'],
    });
    expect(c.locales.source).toBe('locales/en.json');
    expect(c.functions).toEqual(['t']);
  });

  it('accepts optional noLocaleMeta', () => {
    const c = parseI18nPruneConfig({
      locales: {
        source: 'locales/en.json',
        directory: 'locales',
      },
      src: 'src',
      functions: ['t'],
      noLocaleMeta: true,
    });
    expect(c.noLocaleMeta).toBe(true);
  });

  it('rejects empty functions', () => {
    expect(() =>
      parseI18nPruneConfig({
        locales: {
          source: 'a',
          directory: 'b',
        },
        src: 'c',
        functions: [],
      }),
    ).toThrow(ConfigValidationError);
  });

  it('accepts scanner config object', () => {
    const c = parseI18nPruneConfig({
      locales: {
        source: 'locales/en.json',
        directory: 'locales',
      },
      src: 'src',
      functions: ['t'],
      scanner: {
        mode: 'concurrent',
        concurrency: 24,
        hardCap: 64,
      },
    });
    expect(c.scanner?.mode).toBe('concurrent');
    expect(c.scanner?.concurrency).toBe(24);
    expect(c.scanner?.hardCap).toBe(64);
  });

  it('accepts exclude with preset, dirs, extensions, patterns, and useDefaultSkip', () => {
    const c = parseI18nPruneConfig({
      locales: {
        source: 'locales/en.json',
        directory: 'locales',
      },
      src: 'src',
      functions: ['t'],
      exclude: {
        preset: 'production',
        useDefaultSkip: true,
        dirs: ['fixtures', /_vendors?_/i],
        extensions: ['d.ts', /\.stories\.tsx$/],
        patterns: [/^src\/generated\//],
      },
    });
    expect(c.exclude?.useDefaultSkip).toBe(true);
    expect(c.exclude?.preset).toBe('production');
    expect(c.exclude?.dirs?.length).toBe(2);
    expect(c.exclude?.extensions?.length).toBe(2);
    expect(c.exclude?.patterns?.length).toBe(1);
  });

  it('accepts missing command namespace', () => {
    const c = parseI18nPruneConfig({
      locales: {
        source: 'locales/en.json',
        directory: 'locales',
      },
      src: 'src',
      functions: ['t'],
      missing: { placeholder: '[NEW]' },
    });
    expect(c.missing?.placeholder).toBe('[NEW]');
  });

  it('rejects translate.workers object shape (number only)', () => {
    expect(() =>
      parseI18nPruneConfig({
        locales: {
          source: 'locales/en.json',
          directory: 'locales',
        },
        src: 'src',
        functions: ['t'],
        translate: {
          primary: 'google',
          providers: [{ id: 'google' }],
          workers: { max: 4 },
        },
      } as unknown),
    ).toThrow(ConfigValidationError);
  });

  it('rejects translate.concurrency (removed)', () => {
    expect(() =>
      parseI18nPruneConfig({
        locales: {
          source: 'locales/en.json',
          directory: 'locales',
        },
        src: 'src',
        functions: ['t'],
        translate: {
          primary: 'google',
          providers: [{ id: 'google' }],
          concurrency: { maxWorkers: 3 },
        },
      } as unknown),
    ).toThrow(ConfigValidationError);
  });

  it('accepts reference namespace', () => {
    const c = parseI18nPruneConfig({
      locales: {
        source: 'locales/en.json',
        directory: 'locales',
      },
      src: 'src',
      functions: ['t'],
      reference: {
        defaults: { uncertainKeyPolicy: 'protect', stringPresence: 'warn' },
        commands: { generate: { respectPreserve: false } },
      },
    });
    expect(c.reference?.defaults?.uncertainKeyPolicy).toBe('protect');
    expect(c.reference?.commands?.generate?.respectPreserve).toBe(false);
  });

  it('accepts unknown keys under reference.commands (passthrough forward compatibility)', () => {
    const c = parseI18nPruneConfig({
      locales: {
        source: 'locales/en.json',
        directory: 'locales',
      },
      src: 'src',
      functions: ['t'],
      reference: {
        commands: {
          legacyFillAlias: {},
          futureOp: { uncertainKeyPolicy: 'warn_only' },
        },
      },
    } as Record<string, unknown>);
    expect((c.reference?.commands as Record<string, unknown>)?.futureOp).toEqual({
      uncertainKeyPolicy: 'warn_only',
    });
  });

  it('rejects unknown keys under missing (strict)', () => {
    expect(() =>
      parseI18nPruneConfig({
        locales: {
          source: 'locales/en.json',
          directory: 'locales',
        },
        src: 'src',
        functions: ['t'],
        missing: { typo: 1 },
      } as unknown),
    ).toThrow(ConfigValidationError);
  });

  const minimalGoogleTranslate = {
    primary: 'google' as const,
    providers: [{ id: 'google' as const }],
  };

  it('accepts translate.providers + primary (llm row)', () => {
    const c = parseI18nPruneConfig({
      locales: {
        source: 'locales/en.json',
        directory: 'locales',
      },
      src: 'src',
      functions: ['t'],
      translate: {
        primary: 'llm',
        providers: [
          { id: 'google' },
          {
            id: 'llm',
            baseUrl: 'https://api.example.com/v1',
            model: 'gpt-test',
          },
        ],
      },
    });
    expect(c.translate?.primary).toBe('llm');
    const llm = c.translate?.providers.find((p) => p.id === 'llm');
    expect(llm).toMatchObject({ model: 'gpt-test', baseUrl: 'https://api.example.com/v1' });
    expect(c.translate?.policy?.routing).toBe('single');
  });

  it('rejects duplicate translate.providers id values', () => {
    expect(() =>
      parseI18nPruneConfig({
        locales: {
          source: 'locales/en.json',
          directory: 'locales',
        },
        src: 'src',
        functions: ['t'],
        translate: {
          primary: 'google',
          providers: [{ id: 'google' }, { id: 'google' }],
        },
      }),
    ).toThrow(ConfigValidationError);
  });

  it('rejects primary with no enabled matching row', () => {
    expect(() =>
      parseI18nPruneConfig({
        locales: {
          source: 'locales/en.json',
          directory: 'locales',
        },
        src: 'src',
        functions: ['t'],
        translate: {
          primary: 'llm',
          providers: [{ id: 'google' }, { id: 'llm', enabled: false }],
        },
      }),
    ).toThrow(ConfigValidationError);
  });

  it('defaults translate.workers when workers key omitted', () => {
    const c = parseI18nPruneConfig({
      locales: {
        source: 'locales/en.json',
        directory: 'locales',
      },
      src: 'src',
      functions: ['t'],
      translate: minimalGoogleTranslate,
    });
    expect(c.translate?.workers).toBe(1);
  });

  it('accepts translate.workers as a bare positive int', () => {
    const c = parseI18nPruneConfig({
      locales: {
        source: 'locales/en.json',
        directory: 'locales',
      },
      src: 'src',
      functions: ['t'],
      translate: { ...minimalGoogleTranslate, workers: 8 },
    });
    expect(c.translate?.workers).toBe(8);
  });

  it('accepts translate.policy.routing auto at parse time (resolver rejects until implemented)', () => {
    const c = parseI18nPruneConfig({
      locales: {
        source: 'locales/en.json',
        directory: 'locales',
      },
      src: 'src',
      functions: ['t'],
      translate: {
        primary: 'google',
        providers: [{ id: 'google' }],
        policy: { routing: 'auto' },
      },
    });
    expect(c.translate?.policy?.routing).toBe('auto');
  });

  it('rejects stray keys on google row', () => {
    expect(() =>
      parseI18nPruneConfig({
        locales: {
          source: 'locales/en.json',
          directory: 'locales',
        },
        src: 'src',
        functions: ['t'],
        translate: {
          primary: 'google',
          providers: [{ id: 'google', typo: true }],
        },
      } as unknown),
    ).toThrow(ConfigValidationError);
  });

  describe('translate.policy verb dictionary', () => {
    const baseTranslate = {
      primary: 'google' as const,
      providers: [{ id: 'google' as const }, { id: 'mymemory' as const }],
    };

    it('applies all defaults when policy is omitted', () => {
      const c = parseI18nPruneConfig({
        locales: {
          source: 'locales/en.json',
          directory: 'locales',
        },
        src: 'src',
        functions: ['t'],
        translate: baseTranslate,
      });
      expect(c.translate?.policy).toMatchObject({
        routing: 'single',
        onRateLimit: 'backoff',
        onTransientFailure: 'retry',
        onQuotaExceeded: 'fallback',
        onAuthFailure: 'abort',
        onProviderUnavailable: 'fallback',
        onIdentityOutput: 'flag',
        onIncompleteRun: 'confirm',
        handoff: 'auto',
      });
    });

    it('defaults maxAttempts to providers.length when omitted', () => {
      const c = parseI18nPruneConfig({
        locales: {
          source: 'locales/en.json',
          directory: 'locales',
        },
        src: 'src',
        functions: ['t'],
        translate: baseTranslate,
      });
      expect(c.translate?.policy?.maxAttempts).toBe(2);
    });

    it('keeps an explicit maxAttempts over the providers.length default', () => {
      const c = parseI18nPruneConfig({
        locales: {
          source: 'locales/en.json',
          directory: 'locales',
        },
        src: 'src',
        functions: ['t'],
        translate: { ...baseTranslate, policy: { maxAttempts: 7 } },
      });
      expect(c.translate?.policy?.maxAttempts).toBe(7);
    });

    it('accepts every locked verb across all on* keys', () => {
      const c = parseI18nPruneConfig({
        locales: {
          source: 'locales/en.json',
          directory: 'locales',
        },
        src: 'src',
        functions: ['t'],
        translate: {
          ...baseTranslate,
          policy: {
            routing: 'auto',
            onRateLimit: 'fallback',
            onTransientFailure: 'abort',
            onQuotaExceeded: 'prompt',
            onAuthFailure: 'prompt',
            onProviderUnavailable: 'abort',
            onIdentityOutput: 'fallback',
            onIncompleteRun: 'write',
            handoff: 'off',
            maxAttempts: 3,
          },
        },
      });
      expect(c.translate?.policy).toMatchObject({
        routing: 'auto',
        onRateLimit: 'fallback',
        onTransientFailure: 'abort',
        onQuotaExceeded: 'prompt',
        onAuthFailure: 'prompt',
        onProviderUnavailable: 'abort',
        onIdentityOutput: 'fallback',
        onIncompleteRun: 'write',
        handoff: 'off',
        maxAttempts: 3,
      });
    });

    it('rejects unknown verbs (e.g. legacy "fail")', () => {
      expect(() =>
        parseI18nPruneConfig({
          locales: {
            source: 'locales/en.json',
            directory: 'locales',
          },
          src: 'src',
          functions: ['t'],
          translate: {
            ...baseTranslate,
            policy: { onRateLimit: 'fail' },
          },
        } as unknown),
      ).toThrow(ConfigValidationError);
    });

    it('rejects legacy onRateLimitResponse key (renamed to onRateLimit)', () => {
      expect(() =>
        parseI18nPruneConfig({
          locales: {
            source: 'locales/en.json',
            directory: 'locales',
          },
          src: 'src',
          functions: ['t'],
          translate: {
            ...baseTranslate,
            policy: { onRateLimitResponse: 'backoff' },
          },
        } as unknown),
      ).toThrow(ConfigValidationError);
    });

    it('rejects unknown policy keys via .strict()', () => {
      expect(() =>
        parseI18nPruneConfig({
          locales: {
            source: 'locales/en.json',
            directory: 'locales',
          },
          src: 'src',
          functions: ['t'],
          translate: {
            ...baseTranslate,
            policy: { onTypo: 'abort' },
          },
        } as unknown),
      ).toThrow(ConfigValidationError);
    });

    it('rejects non-positive maxAttempts', () => {
      expect(() =>
        parseI18nPruneConfig({
          locales: {
            source: 'locales/en.json',
            directory: 'locales',
          },
          src: 'src',
          functions: ['t'],
          translate: {
            ...baseTranslate,
            policy: { maxAttempts: 0 },
          },
        }),
      ).toThrow(ConfigValidationError);
    });
  });
});
