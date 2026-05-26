import { projectReportDocumentSchema } from '@i18nprune/report-schema';
import { ISSUE_SHARE_REMOTE_REPORT_REJECTED } from '../../shared/constants/issueCodes.js';
import { assertReportShareWithinLimit } from '../../share/payload/limits.js';
import { sha256HexBytes } from '../../share/util/sha256.js';
import { stableStringify } from '../../share/util/stableJson.js';
import type { ValidateReportIngestResult } from '../../types/report/ingest.js';
import { reportDocumentForShareContentHash } from './reportSemantic.js';

function utf8Bytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/** Worker `POST /v1/reports` JSON ingest validation (schema + share manifest fields). */
export async function validateReportIngest(input: { reportDocument: unknown }): Promise<ValidateReportIngestResult> {
  const checked = projectReportDocumentSchema.safeParse(input.reportDocument);
  if (!checked.success) {
    return {
      ok: false,
      issues: [
        {
          severity: 'error',
          code: ISSUE_SHARE_REMOTE_REPORT_REJECTED,
          message: `Report document does not match project report schema: ${checked.error.message}`,
        },
      ],
    };
  }

  const document = checked.data as unknown as Record<string, unknown>;
  const uploadSerialized = stableStringify(checked.data);
  const uploadBytes = utf8Bytes(uploadSerialized);
  const tooLarge = assertReportShareWithinLimit(uploadBytes.byteLength);
  if (tooLarge) {
    return { ok: false, issues: [tooLarge] };
  }
  const semanticCanonical = stableStringify(reportDocumentForShareContentHash(checked.data));
  const payloadContentHash = await sha256HexBytes(utf8Bytes(semanticCanonical));
  const toolVersion = typeof document.toolVersion === 'string' ? document.toolVersion : 'unknown';
  const generatedAt = typeof document.generatedAt === 'string' ? document.generatedAt : new Date().toISOString();
  const schemaVersion = typeof document.schemaVersion === 'number' ? document.schemaVersion : 0;

  return {
    ok: true,
    document,
    serialized: uploadSerialized,
    manifest: {
      kind: 'report',
      byteSize: uploadBytes.byteLength,
      payloadContentHash,
      schemaVersion,
      toolVersion,
      generatedAt,
    },
  };
}
