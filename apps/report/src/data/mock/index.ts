import { PROJECT_REPORT_SCHEMA_VERSION } from '../../constants/report.js';
import { PROJECT_REPORT_KIND, type ProjectReportDocument } from '../../types/index.js';

export const MOCK_PROJECT_REPORT: ProjectReportDocument = {
  kind: PROJECT_REPORT_KIND,
  schemaVersion: PROJECT_REPORT_SCHEMA_VERSION,
  generatedAt: new Date().toISOString(),
  toolVersion: 'dev',
  project: {
    cwd: '/example/project',
    sourceLocalePath: '/example/project/locales/en.json',
    localesDir: '/example/project/locales',
    srcRoot: '/example/project/src',
    sourceLocaleTag: 'en',
    environment: {
      platform: 'linux',
      arch: 'x64',
      nodeVersion: 'v22.0.0',
      osRelease: '6.6',
      distro: 'Ubuntu',
    },
  },
  summary: {
    missingKeysCount: 2,
    dynamicSitesCount: 1,
    keyObservationsCount: 5,
    sourceFilesScannedCount: 42,
    ok: false,
  },
  details: {
    missingKeys: ['a.b.missing', 'x.y'],
    dynamicSites: [
      {
        kind: 'template',
        filePath: 'src/App.tsx',
        line: 12,
        functionName: 't',
        preview: 't(`dyn.${id}`)',
      },
    ],
    keyObservations: [
      {
        key: 'hello.world',
        filePath: 'src/main.tsx',
        line: 4,
        preview: "t('hello.world')",
      },
    ],
  },
};
