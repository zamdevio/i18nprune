import type { Issue } from '../../json/envelope/index.js';
import type { ParsedProjectUpload } from '../upload.js';

export type BuildProjectSnapshotShellResult =
  | { ok: true; parsed: ParsedProjectUpload }
  | { ok: false; issues: Issue[] };
