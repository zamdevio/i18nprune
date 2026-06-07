import { guessGitHubLogin } from './github.js';

export interface GitHubUserProfile {
  login: string;
  html_url: string;
  avatar_url: string;
  name: string | null;
  bio: string | null;
  followers: number;
  following: number;
}

export interface GitHubUserFetchResult {
  profile: GitHubUserProfile | null;
  rateLimited: boolean;
}

export interface GitHubEnrichmentSummary {
  total: number;
  enriched: number;
  notFound: number;
  skippedAfterRateLimit: number;
  rateLimited: boolean;
}

export interface GitHubEnrichmentResult<
  T extends { name: string; username: string; email: string; githubUrl: string },
> {
  authors: Array<T & AuthorGitHubFields>;
  summary: GitHubEnrichmentSummary;
}

const USER_AGENT = 'i18nprune-git-analytics-sync';

function githubRequestHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': USER_AGENT,
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function isRateLimited(response: Response): boolean {
  const remaining = response.headers.get('x-ratelimit-remaining');
  if (remaining === '0') return true;
  return response.status === 403 || response.status === 429;
}

export async function fetchGitHubUser(login: string): Promise<GitHubUserFetchResult> {
  const handle = login.trim();
  if (!handle) return { profile: null, rateLimited: false };

  try {
    const response = await fetch(`https://api.github.com/users/${encodeURIComponent(handle)}`, {
      headers: githubRequestHeaders(),
    });

    if (isRateLimited(response)) {
      return { profile: null, rateLimited: true };
    }

    if (!response.ok) {
      return { profile: null, rateLimited: false };
    }

    const data = (await response.json()) as {
      login?: string;
      html_url?: string;
      avatar_url?: string;
      name?: string | null;
      bio?: string | null;
      followers?: number;
      following?: number;
    };

    if (!data.login || !data.html_url || !data.avatar_url) {
      return { profile: null, rateLimited: false };
    }

    return {
      profile: {
        login: data.login,
        html_url: data.html_url,
        avatar_url: data.avatar_url,
        name: data.name ?? null,
        bio: data.bio ?? null,
        followers: data.followers ?? 0,
        following: data.following ?? 0,
      },
      rateLimited: false,
    };
  } catch {
    return { profile: null, rateLimited: false };
  }
}

export interface AuthorGitHubFields {
  githubLogin: string | null;
  githubUrl: string;
  displayName: string;
  avatarUrl: string | null;
  followers: number | null;
  following: number | null;
  bio: string | null;
}

export async function enrichAuthorsWithGitHub<
  T extends { name: string; username: string; email: string; githubUrl: string },
>(authors: T[]): Promise<GitHubEnrichmentResult<T>> {
  const enriched: Array<T & AuthorGitHubFields> = [];
  let rateLimited = false;
  let enrichedCount = 0;
  let notFoundCount = 0;
  let skippedAfterRateLimit = 0;

  for (const author of authors) {
    if (rateLimited) {
      enriched.push(fallbackGitHubFields(author));
      skippedAfterRateLimit += 1;
      continue;
    }

    const login = guessGitHubLogin(author.name, author.username);
    const result = await fetchGitHubUser(login);

    if (result.rateLimited) {
      rateLimited = true;
      console.warn('GitHub API rate limit reached — skipping remaining profile fetches.');
      enriched.push(fallbackGitHubFields(author));
      skippedAfterRateLimit += 1;
      continue;
    }

    if (!result.profile) {
      notFoundCount += 1;
      enriched.push(fallbackGitHubFields(author, login));
      continue;
    }

    enrichedCount += 1;
    enriched.push({
      ...author,
      githubLogin: result.profile.login,
      githubUrl: result.profile.html_url,
      displayName: result.profile.name ?? author.name,
      avatarUrl: result.profile.avatar_url,
      followers: result.profile.followers,
      following: result.profile.following,
      bio: result.profile.bio,
    });
  }

  return {
    authors: enriched,
    summary: {
      total: authors.length,
      enriched: enrichedCount,
      notFound: notFoundCount,
      skippedAfterRateLimit,
      rateLimited,
    },
  };
}

function fallbackGitHubFields<
  T extends { name: string; username: string; email: string; githubUrl: string },
>(author: T, login?: string): T & AuthorGitHubFields {
  return {
    ...author,
    githubLogin: login ?? guessGitHubLogin(author.name, author.username),
    githubUrl: author.githubUrl,
    displayName: author.name,
    avatarUrl: null,
    followers: null,
    following: null,
    bio: null,
  };
}

export function formatGitHubEnrichmentSummary(summary: GitHubEnrichmentSummary): string {
  const parts = [
    `${summary.enriched} enriched`,
    `${summary.notFound} not found`,
  ];
  if (summary.skippedAfterRateLimit > 0) {
    parts.push(`${summary.skippedAfterRateLimit} skipped (rate limit)`);
  }
  if (summary.rateLimited) {
    parts.push('rate limited');
  }
  return parts.join(' · ');
}
