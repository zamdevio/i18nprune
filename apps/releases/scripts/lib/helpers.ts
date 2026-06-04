import type { ErrorObject } from 'ajv';
import type { ReleaseRecordV1 } from '../../src/types/index.js';

export function formatAjvErrors(errors: ErrorObject[] | null | undefined): string[] {
  if (!errors?.length) return [];
  return errors.map((e) => {
    const where = e.instancePath || '(root)';
    const extra = e.params && Object.keys(e.params).length ? ` ${JSON.stringify(e.params)}` : '';
    return `${where}: ${e.message}${extra}`;
  });
}

export function validateReleaseIdentity(
  filePath: string,
  releaseStream: string,
  filenameVersion: string,
  data: ReleaseRecordV1,
): string[] {
  const issues: string[] = [];
  if (data.stream !== releaseStream) {
    issues.push(`stream field "${data.stream}" does not match folder "${releaseStream}"`);
  }
  if (data.version !== filenameVersion) {
    issues.push(`version field "${data.version}" does not match filename "${filenameVersion}"`);
  }
  return issues.map((msg) => `${filePath}: ${msg}`);
}
