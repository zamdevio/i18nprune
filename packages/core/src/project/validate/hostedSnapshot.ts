import { HOSTED_PROJECT_SNAPSHOT_SCHEMA_VERSION } from '../../shared/constants/project.js';
import {
  ISSUE_PROJECT_HOSTED_SNAPSHOT_INVALID,
  ISSUE_PROJECT_HOSTED_SNAPSHOT_SCHEMA_VERSION,
} from '../../shared/constants/issueCodes.js';
import type {
  HostedProjectIngestEnvelope,
  ValidateHostedProjectIngestResult,
} from '../../types/project/prepare.js';
import type { Issue } from '../../types/json/envelope/index.js';
import type { ProjectSnapshot } from '../../types/project/upload.js';

function err(message: string, code: string = ISSUE_PROJECT_HOSTED_SNAPSHOT_INVALID): Issue {
  return { severity: 'error', code, message };
}

function assertSnapshotReady(snapshot: ProjectSnapshot): Issue[] {
  const issues: Issue[] = [];
  if (!snapshot.projectId?.trim()) issues.push(err('snapshot.projectId is required'));
  if (!snapshot.projectHash?.trim()) issues.push(err('snapshot.projectHash is required'));
  if (!snapshot.extraction) {
    issues.push(err('snapshot.extraction is required (prepare must run before ingest)'));
    return issues;
  }
  if (!snapshot.sourceLocaleJson || typeof snapshot.sourceLocaleJson !== 'object') {
    issues.push(err('snapshot.sourceLocaleJson must be a JSON object'));
  }
  if (!Array.isArray(snapshot.extraction.resolvedKeys)) {
    issues.push(err('snapshot.extraction.resolvedKeys must be an array'));
  }
  return issues;
}

/** Validates primary `POST /v1/projects` JSON body before worker DO persist. */
export function validateHostedProjectIngestBody(body: unknown): ValidateHostedProjectIngestResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, issues: [err('Expected JSON object ingest body')] };
  }
  const raw = body as Record<string, unknown>;
  const schemaVersion = raw.schemaVersion;
  if (schemaVersion !== HOSTED_PROJECT_SNAPSHOT_SCHEMA_VERSION) {
    return {
      ok: false,
      issues: [
        err(
          `schemaVersion must be ${String(HOSTED_PROJECT_SNAPSHOT_SCHEMA_VERSION)}`,
          ISSUE_PROJECT_HOSTED_SNAPSHOT_SCHEMA_VERSION,
        ),
      ],
    };
  }
  const snapshot = raw.snapshot;
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return { ok: false, issues: [err('snapshot is required')] };
  }
  const snapIssues = assertSnapshotReady(snapshot as ProjectSnapshot);
  if (snapIssues.length > 0) return { ok: false, issues: snapIssues };

  const prepareMeta = raw.prepareMeta;
  if (prepareMeta !== undefined && (typeof prepareMeta !== 'object' || Array.isArray(prepareMeta))) {
    return { ok: false, issues: [err('prepareMeta must be an object when provided')] };
  }

  return {
    ok: true,
    envelope: {
      schemaVersion: HOSTED_PROJECT_SNAPSHOT_SCHEMA_VERSION,
      snapshot: snapshot as ProjectSnapshot,
      ...(prepareMeta && typeof prepareMeta === 'object' ? { prepareMeta: prepareMeta as HostedProjectIngestEnvelope['prepareMeta'] } : {}),
    },
  };
}
