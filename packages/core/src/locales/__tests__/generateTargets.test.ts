import { describe, expect, it } from 'vitest';
import { createNodeRuntimeAdapters } from '../../runtime/exports/node.js';
import { I18nPruneError } from '../../shared/errors/index.js';
import { assertGenerateTargetCodes } from '../generateTargets.js';

describe('assertGenerateTargetCodes', () => {
  const rt = createNodeRuntimeAdapters();
  const sourcePath = '/proj/locales/en.json';

  it('passes for valid non-source catalog codes', () => {
    expect(() =>
      assertGenerateTargetCodes({
        commandName: 'generate',
        codes: ['fr', 'de'],
        sourceLocalePath: sourcePath,
        path: rt.path,
      }),
    ).not.toThrow();
  });

  it('throws for source locale slug', () => {
    expect(() =>
      assertGenerateTargetCodes({
        commandName: 'generate',
        codes: ['en'],
        sourceLocalePath: sourcePath,
        path: rt.path,
      }),
    ).toThrow(I18nPruneError);
  });

  it('throws for unknown code', () => {
    expect(() =>
      assertGenerateTargetCodes({
        commandName: 'generate',
        codes: ['zz-invalid-locale-test'],
        sourceLocalePath: sourcePath,
        path: rt.path,
      }),
    ).toThrow(I18nPruneError);
  });
});
