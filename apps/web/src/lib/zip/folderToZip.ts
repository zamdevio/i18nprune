import { zipSync } from 'fflate';
import { shouldSkipPathForFolderZip } from './zipIgnorePaths';

type FileWithPath = File & { webkitRelativePath?: string };

function normalizedRelativePath(file: File): string {
  const rel = (file as FileWithPath).webkitRelativePath?.replace(/\\/g, '/') || file.name;
  const segs = rel.split('/').filter(Boolean);
  // For folder uploads, flatten from "<folder>/*" to "*" so config/source paths stay top-level.
  if ((file as FileWithPath).webkitRelativePath && segs.length > 1) {
    return segs.slice(1).join('/');
  }
  return rel;
}

export async function filesToZipBytes(files: File[]): Promise<Uint8Array> {
  const out: Record<string, Uint8Array> = {};
  for (const f of files) {
    const rel = normalizedRelativePath(f);
    if (shouldSkipPathForFolderZip(rel)) continue;
    out[rel] = new Uint8Array(await f.arrayBuffer());
  }
  if (Object.keys(out).length === 0) {
    throw new Error('No files left after excluding dependency/build folders (e.g. node_modules, .git). Pick a smaller folder or a .zip.');
  }
  return zipSync(out, { level: 6 });
}
