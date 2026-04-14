import {
  PROJECT_REPORT_SCHEMA_VERSION,
  projectReportDocumentSchema,
} from '@zamdevio/i18nprune/report';
import { ZodError } from 'zod';
import type { ProjectReportDocument } from '../../types/index.js';

export type PayloadErrorKind = 'missing' | 'parse' | 'schema' | 'version';

export type PayloadLoadResult =
  | { ok: true; doc: ProjectReportDocument }
  | { ok: false; kind: PayloadErrorKind; message: string; detail?: string };

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

function formatZodDetail(err: ZodError): string {
  try {
    return err.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('\n');
  } catch {
    return err.message;
  }
}

function schemaVersionMismatchHint(parsed: unknown): string | undefined {
  if (!isRecord(parsed)) return undefined;
  const v = parsed.schemaVersion;
  if (typeof v !== 'number') return undefined;
  if (v === PROJECT_REPORT_SCHEMA_VERSION) return undefined;
  const newer = v > PROJECT_REPORT_SCHEMA_VERSION;
  const upgrade =
    newer ?
      'Upgrade i18nprune to a version that ships this report UI, then regenerate `report --format html`.'
    : 'This report is older than this viewer. Regenerate with your current CLI, or open the HTML produced by the same i18nprune version that created the JSON.';
  return [
    `Payload has schemaVersion ${v}; this viewer expects ${PROJECT_REPORT_SCHEMA_VERSION}.`,
    upgrade,
    'Tip: `i18nprune report --format json` + `i18nprune report --from report.json --format html` keeps JSON and HTML on the same schema.',
  ].join('\n');
}

/**
 * Parse and validate a project report JSON string. No dev mock fallbacks — for manual import and tooling.
 */
export function validatePayloadString(raw: string): PayloadLoadResult {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return {
      ok: false,
      kind: 'parse',
      message: 'Report JSON is empty.',
      detail: 'Paste output from `i18nprune report --format json` or choose a `.json` file produced by the CLI.',
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed) as unknown;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      kind: 'parse',
      message: 'Input is not valid JSON.',
      detail: msg,
    };
  }

  const checked = projectReportDocumentSchema.safeParse(parsed);
  if (checked.success) {
    return { ok: true, doc: checked.data as ProjectReportDocument };
  }

  const versionHint = schemaVersionMismatchHint(parsed);

  if (versionHint) {
    return {
      ok: false,
      kind: 'version',
      message: 'Report schema version does not match this viewer.',
      detail: `${versionHint}\n\n---\nValidation detail:\n${formatZodDetail(checked.error)}`,
    };
  }

  return {
    ok: false,
    kind: 'schema',
    message: 'Payload does not match the project report schema.',
    detail: [
      'Use JSON from `i18nprune report --format json` without hand-editing, or compare shape with `docs/report/payload` and `packages/report`.',
      '',
      formatZodDetail(checked.error),
    ].join('\n'),
  };
}
