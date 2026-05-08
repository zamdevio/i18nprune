import { RESULT_API_VERSION } from '../constants/result.js';
import { getRunOptions } from '../options/runOptions.js';
import { enrichIssuesWithDocHrefs } from './issueDocLinks.js';
import type { CliJsonEnvelope, Issue } from '../../types/json/envelope/index.js';

/** Drop `data.kind` when it duplicates the envelope `kind` (e.g. doctor payload). */
function dataWithoutRedundantKind<K extends string, D>(envelopeKind: K, data: D): D {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) return data;
  if (!('kind' in data)) return data;
  const k = (data as { kind?: unknown }).kind;
  if (k !== envelopeKind) return data;
  const { kind: _omit, ...rest } = data as { kind: unknown } & Record<string, unknown>;
  return rest as D;
}

export function buildCliJsonEnvelope<K extends string, D>(
  kind: K,
  data: D,
  options: { ok: boolean; issues?: Issue[]; cwd?: string; schemaVersion?: string },
): CliJsonEnvelope<K, D> {
  return {
    ok: options.ok,
    kind,
    data: dataWithoutRedundantKind(kind, data),
    issues: enrichIssuesWithDocHrefs(options.issues ?? []),
    meta: {
      apiVersion: RESULT_API_VERSION,
      ...(options.schemaVersion !== undefined ? { schemaVersion: options.schemaVersion } : {}),
      ...(options.cwd !== undefined ? { cwd: options.cwd } : {}),
    },
  };
}

/**
 * Serialize structured CLI stdout for an operation in `--json` mode (function name is historical).
 * Always emits the envelope `{ ok, kind, data, issues, meta }`.
 */
export function stringifyCliCommandJson(input: {
  kind: string;
  data: unknown;
  ok: boolean;
  issues?: Issue[];
  /** Pretty-print with indentation. Defaults to current runtime `jsonPretty` (true when unset). */
  pretty?: boolean;
}): string {
  const { kind, data, ok, issues, pretty } = input;
  const resolvedPretty = pretty ?? getRunOptions().jsonPretty;
  const envelope = buildCliJsonEnvelope(kind, data, {
    ok,
    issues,
    cwd: process.cwd(),
  });
  return resolvedPretty ? JSON.stringify(envelope, null, 2) : JSON.stringify(envelope);
}

/** Serialize a pre-built envelope (same bytes as {@link stringifyCliCommandJson}). */
export function stringifyEnvelope<K extends string, D>(
  envelope: CliJsonEnvelope<K, D>,
  pretty?: boolean,
): string {
  const resolvedPretty = pretty ?? getRunOptions().jsonPretty;
  return resolvedPretty ? JSON.stringify(envelope, null, 2) : JSON.stringify(envelope);
}
