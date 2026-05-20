import type { ParsedProjectReportDocument } from '@i18nprune/report';

/**
 * Report fields that affect hosted findings — excludes per-run host metadata
 * (`generatedAt`, `toolVersion`, `cwd`, `environment`) so share skip policy matches analysis reuse.
 */
export function reportDocumentForShareContentHash(
  doc: ParsedProjectReportDocument,
): Record<string, unknown> {
  const { kind, schemaVersion, summary, details, project } = doc;
  return {
    kind,
    schemaVersion,
    project: {
      sourceLocalePath: project.sourceLocalePath,
      localesDir: project.localesDir,
      srcRoot: project.srcRoot,
      ...(project.sourceLocaleTag !== undefined ? { sourceLocaleTag: project.sourceLocaleTag } : {}),
    },
    summary,
    details,
  };
}
