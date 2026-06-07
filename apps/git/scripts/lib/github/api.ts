import { guessGitHubLogin } from './index.js';
import { GitHubProfileCache } from './cache.js';

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
  unreachable: boolean;
}

export interface GitHubEnrichmentSummary {
  total: number;
  enriched: number;
  notFound: number;
  skippedAfterRateLimit: number;
  cacheHits: number;
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
  if (!handle) return { profile: null, rateLimited: false, unreachable: false };

  try {
    const response = await fetch(`https://api.github.com/users/${encodeURIComponent(handle)}`, {
      headers: githubRequestHeaders(),
    });

    if (isRateLimited(response)) {
      return { profile: null, rateLimited: true, unreachable: false };
    }

    if (!response.ok) {
      return { profile: null, rateLimited: false, unreachable: false };
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
      return { profile: null, rateLimited: false, unreachable: false };
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
      unreachable: false,
    };
  } catch {
    return { profile: null, rateLimited: false, unreachable: true };
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

export type GitHubEnrichmentOptions = {
  forceRefresh?: boolean;
  cache?: GitHubProfileCache;
};

export async function enrichAuthorsWithGitHub<
  T extends { name: string; username: string; email: string; githubUrl: string },
>(authors: T[], options: GitHubEnrichmentOptions = {}): Promise<GitHubEnrichmentResult<T>> {
  const forceRefresh = Boolean(options.forceRefresh);
  const cache = options.cache ?? GitHubProfileCache.load();

  const enriched: Array<T & AuthorGitHubFields> = [];
  let rateLimited = false;
  let enrichedCount = 0;
  let notFoundCount = 0;
  let skippedAfterRateLimit = 0;
  let cacheHits = 0;

  for (const author of authors) {
    if (rateLimited) {
      const login = guessGitHubLogin(author.name, author.username);
      const sticky = cache.getStickyEnriched(login);
      if (sticky?.profile) {
        enriched.push(applyProfile(author, sticky.profile));
        enrichedCount += 1;
        cacheHits += 1;
        continue;
      }
      enriched.push(fallbackGitHubFields(author));
      skippedAfterRateLimit += 1;
      continue;
    }

    const login = guessGitHubLogin(author.name, author.username);

    const cachedEnriched = cache.getFreshEnriched(login, forceRefresh);
    if (cachedEnriched?.profile) {
      enriched.push(applyProfile(author, cachedEnriched.profile));
      enrichedCount += 1;
      cacheHits += 1;
      continue;
    }

    const cachedNotFound = cache.getFreshNotFound(login, forceRefresh);
    if (cachedNotFound) {
      notFoundCount += 1;
      cacheHits += 1;
      enriched.push(fallbackGitHubFields(author, login));
      continue;
    }

    const result = await fetchGitHubUser(login);

    if (result.rateLimited || result.unreachable) {
      rateLimited = rateLimited || result.rateLimited;
      const sticky = cache.getStickyEnriched(login);
      if (sticky?.profile) {
        enriched.push(applyProfile(author, sticky.profile));
        enrichedCount += 1;
        cacheHits += 1;
        if (result.rateLimited) {
          console.warn('GitHub API rate limit reached — using cached profiles where available.');
        }
        continue;
      }
      if (result.rateLimited) {
        rateLimited = true;
        console.warn('GitHub API rate limit reached — skipping remaining profile fetches.');
      }
      enriched.push(fallbackGitHubFields(author, login));
      skippedAfterRateLimit += 1;
      continue;
    }

    if (!result.profile) {
      notFoundCount += 1;
      cache.setNotFound(login);
      enriched.push(fallbackGitHubFields(author, login));
      continue;
    }

    enrichedCount += 1;
    cache.setEnriched(login, result.profile);
    enriched.push(applyProfile(author, result.profile));
  }

  cache.save();

  return {
    authors: enriched,
    summary: {
      total: authors.length,
      enriched: enrichedCount,
      notFound: notFoundCount,
      skippedAfterRateLimit,
      cacheHits,
      rateLimited,
    },
  };
}

function applyProfile<
  T extends { name: string; username: string; email: string; githubUrl: string },
>(author: T, profile: GitHubUserProfile): T & AuthorGitHubFields {
  return {
    ...author,
    githubLogin: profile.login,
    githubUrl: profile.html_url,
    displayName: profile.name ?? author.name,
    avatarUrl: profile.avatar_url,
    followers: profile.followers,
    following: profile.following,
    bio: profile.bio,
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
  if (summary.cacheHits > 0) {
    parts.push(`${summary.cacheHits} cache hit(s)`);
  }
  if (summary.skippedAfterRateLimit > 0) {
    parts.push(`${summary.skippedAfterRateLimit} skipped (rate limit)`);
  }
  if (summary.rateLimited) {
    parts.push('rate limited');
  }
  return parts.join(' · ');
}
