import { projectReportDocumentSchema } from '@i18nprune/report';
import { ISSUE_SHARE_REMOTE_REPORT_REJECTED } from '../../shared/constants/issueCodes.js';
import type { Issue } from '../../types/json/envelope/index.js';
import type { ShareReportManifest } from '../../types/share/manifest.js';
import { sha256HexBytes } from '../../share/util/sha256.js';
import { stableStringify } from '../../share/util/stableJson.js';
import { reportDocumentForShareContentHash } from './reportSemantic.js';

function utf8Bytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export type PrepareReportPayloadResult =
  | { ok: true; document: Record<string, unknown>; serialized: string; manifest: ShareReportManifest }
  | { ok: false; issues: Issue[] };

/**
 * Validates and hashes a report document for hosted ingest (`POST /v1/reports`) and `runShare({ kind: 'report' })`.
 * CLI `report` command output can be passed here before upload.
 */
export async function prepareReportPayload(input: { reportDocument: unknown }): Promise<PrepareReportPayloadResult> {
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
