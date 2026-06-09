import { z } from 'zod';
import { PROJECT_REPORT_KIND, PROJECT_REPORT_SCHEMA_VERSION } from '../constants/report.js';

/**
 * Canonical project-report Zod schema (source of truth for `@i18nprune/core/report-schema`).
 *
 * Published `@i18nprune/core`
 * and root `i18nprune` bundles include it at build time.
 */
export const projectReportDocumentSchema = z.object({
  kind: z.literal(PROJECT_REPORT_KIND),
  schemaVersion: z.literal(PROJECT_REPORT_SCHEMA_VERSION),
  generatedAt: z.string(),
  toolVersion: z.string(),
  project: z.object({
    cwd: z.string(),
    sourceLocalePath: z.string(),
    localesDir: z.string(),
    srcRoot: z.string(),
    sourceLocaleTag: z.string().optional(),
    environment: z
      .object({
        platform: z.string(),
        arch: z.string(),
        nodeVersion: z.string(),
        osRelease: z.string(),
        distro: z.string().optional(),
        wslDistroName: z.string().optional(),
        runtimeFamily: z.enum(['windows', 'darwin', 'linux', 'linux-wsl', 'edge-worker']).optional(),
      })
      .optional(),
  }),
  summary: z.object({
    missingKeysCount: z.number(),
    dynamicSitesCount: z.number(),
    dynamicSitesActiveCount: z.number().int().nonnegative().optional(),
    dynamicSitesCommentedCount: z.number().int().nonnegative().optional(),
    keyObservationsCount: z.number(),
    sourceFilesScannedCount: z.number().int().nonnegative().optional(),
    ok: z.boolean(),
  }),
  details: z.object({
    missingKeys: z.array(z.string()),
    dynamicSites: z.array(z.unknown()),
    keyObservations: z.array(z.unknown()),
  }),
});

export type ParsedProjectReportDocument = z.infer<typeof projectReportDocumentSchema>;
