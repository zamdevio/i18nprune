import { fetchMetaV1, type MetaV1Ok } from "./meta";

export type GitHubRepoMeta = {
  stars: number | null;
  forks: number | null;
  openIssues: number | null;
  watchers: number | null;
  contributors: number | null;
  apiError: string | null;
};

function asNum(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function githubPayloadToRepoMeta(github: MetaV1Ok["github"]): GitHubRepoMeta {
  return {
    stars: asNum(github.stars),
    forks: asNum(github.forks),
    openIssues: asNum(github.openIssues),
    watchers: asNum(github.watchers),
    contributors: asNum(github.contributors),
    apiError: typeof github.error === "string" ? github.error : null,
  };
}

export function emptyGitHubMeta(message: string): GitHubRepoMeta {
  return {
    stars: null,
    forks: null,
    openIssues: null,
    watchers: null,
    contributors: null,
    apiError: message,
  };
}

export function formatCount(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return "—";
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return v.toLocaleString("en-US");
}

export async function fetchGitHubMeta(): Promise<GitHubRepoMeta> {
  const snap = await fetchMetaV1();
  if (snap?.ok === true && snap.github) {
    return githubPayloadToRepoMeta(snap.github);
  }
  return emptyGitHubMeta("Meta worker unavailable");
}
