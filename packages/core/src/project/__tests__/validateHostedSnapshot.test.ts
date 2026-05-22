import { describe, expect, it } from 'vitest';
import { HOSTED_PROJECT_SNAPSHOT_SCHEMA_VERSION } from '../../shared/constants/project.js';
import { validateHostedProjectIngestBody } from '../validate/hostedSnapshot.js';

describe('validateHostedProjectIngestBody', () => {
  it('rejects missing extraction', () => {
    const out = validateHostedProjectIngestBody({
      schemaVersion: HOSTED_PROJECT_SNAPSHOT_SCHEMA_VERSION,
      snapshot: {
        projectId: 'a',
        projectHash: 'b',
        uploadedAt: new Date().toISOString(),
        zipBytes: 1,
        fileCount: 1,
        textFileCount: 1,
        detectedConfigPath: null,
        detectedConfigRaw: null,
        tree: [],
        resolvedConfig: null,
        sourceLocaleJson: { x: 1 },
        localeJsonByTag: {},
        extraction: null,
      },
    });
    expect(out.ok).toBe(false);
  });

  it('preserves processorContext on validated envelope', () => {
    const out = validateHostedProjectIngestBody({
      schemaVersion: HOSTED_PROJECT_SNAPSHOT_SCHEMA_VERSION,
      processorContext: { surface: 'cli', toolVersion: '9.9.9', sdkVersion: '0.1.0' },
      snapshot: {
        projectId: 'a',
        projectHash: 'b',
        uploadedAt: new Date().toISOString(),
        zipBytes: 1,
        fileCount: 1,
        textFileCount: 1,
        detectedConfigPath: null,
        detectedConfigRaw: null,
        tree: [],
        resolvedConfig: null,
        sourceLocaleJson: { x: 1 },
        localeJsonByTag: {},
        extraction: {
          configHash: 'h',
          sourceLocalePath: 'locales/en.json',
          srcRoot: 'src',
          localesDir: 'locales',
          resolvedKeys: [],
          keyObservationsCount: 0,
          dynamicSitesCount: 0,
          keyObservationsPreview: [],
          dynamicSitesPreview: [],
        },
      },
    });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.envelope.processorContext?.toolVersion).toBe('9.9.9');
    }
  });
});
