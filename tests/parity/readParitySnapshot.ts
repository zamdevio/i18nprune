import fs from 'node:fs';

/** Committed snapshots use LF; normalize CRLF from Windows git checkout before byte compare. */
export function readParitySnapshotText(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
}
