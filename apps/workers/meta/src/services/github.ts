import type { GitHubRepoV1 } from "../types";

export async function fetchGithubRepo(
  owner: string,
  repo: string,
  token?: string,
): Promise<GitHubRepoV1> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "i18nprune-meta-worker",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!repoRes.ok) {
      return {
        owner,
        repo,
        stars: null,
        forks: null,
        openIssues: null,
        watchers: null,
        contributors: null,
        error: `GitHub repo HTTP ${repoRes.status}`,
      };
    }

    const repoJson = (await repoRes.json()) as {
      stargazers_count?: unknown;
      forks_count?: unknown;
      open_issues_count?: unknown;
      subscribers_count?: unknown;
    };

    let contributors: number | null = null;
    const contributorsRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=100&anon=true`,
      { headers },
    );
    if (contributorsRes.ok) {
      const arr = (await contributorsRes.json()) as unknown;
      contributors = Array.isArray(arr) ? arr.length : null;
    }

    return {
      owner,
      repo,
      stars: typeof repoJson.stargazers_count === "number" ? repoJson.stargazers_count : null,
      forks: typeof repoJson.forks_count === "number" ? repoJson.forks_count : null,
      openIssues: typeof repoJson.open_issues_count === "number" ? repoJson.open_issues_count : null,
      watchers: typeof repoJson.subscribers_count === "number" ? repoJson.subscribers_count : null,
      contributors,
      error: null,
    };
  } catch (error) {
    return {
      owner,
      repo,
      stars: null,
      forks: null,
      openIssues: null,
      watchers: null,
      contributors: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
