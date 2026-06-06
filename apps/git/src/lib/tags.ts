import type { GitTag } from '../types';

export function tagProfilePath(name: string): string {
  return `/tags/${encodeURIComponent(name)}`;
}

export function findTagByName(tags: GitTag[], name: string): GitTag | undefined {
  const decoded = decodeURIComponent(name);
  return tags.find((tag) => tag.name === decoded);
}

export function tagNeighbors(
  tags: GitTag[],
  name: string,
): { prev: GitTag | null; next: GitTag | null } {
  const index = tags.findIndex((tag) => tag.name === name);
  if (index < 0) return { prev: null, next: null };
  return {
    prev: index > 0 ? tags[index - 1] : null,
    next: index < tags.length - 1 ? tags[index + 1] : null,
  };
}
