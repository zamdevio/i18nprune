/** Shared GitHub URL builders for commit and file links. */

export function commitGitHubUrl(repoUrl: string | null, fullHash: string): string | null {
  if (!repoUrl || !fullHash) return null;
  return `${repoUrl.replace(/\/$/, '')}/commit/${fullHash}`;
}

export function commitFileBlobUrl(
  repoUrl: string | null,
  fullHash: string,
  filePath: string,
): string | null {
  if (!repoUrl || !fullHash || !filePath) return null;
  const normalized = filePath.replace(/^\//, '');
  return `${repoUrl.replace(/\/$/, '')}/blob/${fullHash}/${normalized}`;
}
