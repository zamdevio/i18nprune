import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { GIT_URL } from '@i18nprune/seo';

import type { Author } from '../src/types/author/index.js';
import type { GitBranch } from '../src/types/branch/index.js';
import type { Commit } from '../src/types/commit/index.js';
import type { Summary } from '../src/types/summary/index.js';
import type { GitTag } from '../src/types/tag/index.js';

const dir = dirname(fileURLToPath(import.meta.url));
const root = join(dir, '..');
const dataDir = join(root, 'src/data');
const publicDir = join(root, 'public');
const origin = GIT_URL.replace(/\/$/, '');

type SitemapUrl = { loc: string; lastmod: string };

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(join(dataDir, file), 'utf8')) as T;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toLastmod(value: string, fallback: string): string {
  return value.slice(0, 10) || fallback;
}

function buildSitemapXml(urls: SitemapUrl[]): string {
  const body = urls
    .map(
      (url) => `
  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
  </url>`,
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}
</urlset>
`;
}

function buildSitemapUrls(
  summary: Summary,
  commits: Commit[],
  authors: Author[],
  tags: GitTag[],
  branches: GitBranch[],
): SitemapUrl[] {
  const fallback = toLastmod(summary.syncedAt, new Date().toISOString().slice(0, 10));
  const urls: SitemapUrl[] = [
    { loc: `${origin}/`, lastmod: fallback },
    { loc: `${origin}/timeline`, lastmod: fallback },
    { loc: `${origin}/commits`, lastmod: fallback },
    { loc: `${origin}/authors`, lastmod: fallback },
    { loc: `${origin}/tags`, lastmod: fallback },
    { loc: `${origin}/branches`, lastmod: fallback },
  ];

  for (const commit of commits) {
    urls.push({
      loc: `${origin}/commits/${commit.hash}`,
      lastmod: toLastmod(commit.date, fallback),
    });
  }

  for (const author of authors) {
    urls.push({
      loc: `${origin}/authors/${encodeURIComponent(author.username)}`,
      lastmod: toLastmod(author.lastCommit, fallback),
    });
  }

  for (const tag of tags) {
    urls.push({
      loc: `${origin}/tags/${encodeURIComponent(tag.name)}`,
      lastmod: toLastmod(tag.date, fallback),
    });
  }

  for (const branch of branches) {
    urls.push({
      loc: `${origin}/branches/${encodeURIComponent(branch.name)}`,
      lastmod: toLastmod(branch.lastCommit, fallback),
    });
  }

  return urls;
}

const summary = readJson<Summary>('summary.json');
const commits = readJson<Commit[]>('commits.json');
const authors = readJson<Author[]>('authors.json');
const tags = readJson<GitTag[]>('tags.json');
const branches = readJson<GitBranch[]>('branches.json');

const urls = buildSitemapUrls(summary, commits, authors, tags, branches);

mkdirSync(publicDir, { recursive: true });
const sitemap = buildSitemapXml(urls);
writeFileSync(join(publicDir, 'sitemap.xml'), sitemap, 'utf8');

console.log(`Wrote sitemap → public/sitemap.xml (${urls.length} URLs, ${origin})`);
