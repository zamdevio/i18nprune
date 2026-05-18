/** Whether the on-disk `files.json` index is usable as a diff baseline. */
export type FilesIndexStatus =
  | { kind: 'ok' }
  | { kind: 'missing' }
  | { kind: 'malformed' }
  | { kind: 'empty' };

export function filesIndexIsUsable(status: FilesIndexStatus): boolean {
  return status.kind === 'ok';
}
