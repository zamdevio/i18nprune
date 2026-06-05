import { FALLBACK_CLI_VERSION, META_WORKER_URL } from '../constants.js';

interface MetaV1ForOg {
  ok: true;
  github: {
    owner?: string;
    repo?: string;
    stars?: number | null;
    forks?: number | null;
    contributors?: number | null;
    error?: string | null;
  };
  npm?: {
    cli?: { version?: string | null };
  };
}

const METADATA_URL = `${META_WORKER_URL}/v1/meta`;

export const OG_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=3600, s-maxage=300, stale-while-revalidate=86400',
  'X-Robots-Tag': 'noindex',
} as const;

function formatStars(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '';
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return v.toLocaleString('en-US');
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export type OgStarsState =
  | { kind: 'live'; stars: number; repoLabel: string }
  | { kind: 'fallback' }
  | { kind: 'offline' };

export type OgMetaResult = { starsState: OgStarsState; cliVersion: string };

function repoLabelFromMeta(json: MetaV1ForOg): string {
  const owner = json.github?.owner;
  const repo = json.github?.repo;
  if (typeof owner === 'string' && owner.length > 0 && typeof repo === 'string' && repo.length > 0) {
    return `${owner}/${repo}`;
  }
  return 'zamdevio/i18nprune';
}

function resolveGithubStarsState(json: MetaV1ForOg): OgStarsState {
  if (json.github?.error) return { kind: 'offline' };
  const stars = json.github?.stars;
  if (typeof stars === 'number' && Number.isFinite(stars) && stars >= 0) {
    return { kind: 'live', stars, repoLabel: repoLabelFromMeta(json) };
  }
  return { kind: 'fallback' };
}

export async function fetchOgMeta(): Promise<OgMetaResult> {
  const fallbackVersion = FALLBACK_CLI_VERSION;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(METADATA_URL, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      cf: { cacheTtl: 120, cacheEverything: true },
    });
    clearTimeout(timeout);
    if (!res.ok) return { starsState: { kind: 'offline' }, cliVersion: fallbackVersion };
    const json = (await res.json()) as MetaV1ForOg;
    const cliRaw = json?.ok === true ? json.npm?.cli?.version : undefined;
    const cliVersion =
      typeof cliRaw === 'string' && cliRaw.length > 0 ? cliRaw : fallbackVersion;
    if (json?.ok !== true) {
      return { starsState: { kind: 'fallback' }, cliVersion };
    }
    return { starsState: resolveGithubStarsState(json), cliVersion };
  } catch {
    return { starsState: { kind: 'offline' }, cliVersion: fallbackVersion };
  }
}

/** Middle dot as XML entity (insert raw — never pass through escapeXml). */
const DOT = '&#183;';

/** GitHub-style star sized to match 13px mono label (aligned with pipeline dots at cy=-4). */
function githubStarIcon(): string {
  return `<g transform="translate(0, -4)"><path d="M0 -8 L2.4 -2.2 L8.8 -2.2 L3.2 1.4 L5.2 7.2 L0 4.6 L-5.2 7.2 L-3.2 1.4 L-8.8 -2.2 L-2.4 -2.2 Z" fill="#00e599"/></g>`;
}

/** Star + label for the live GitHub strip. */
function liveStarsStrip(starsLabel: string): string {
  return `
    <g transform="translate(872, 26)" font-family="'JetBrains Mono', monospace" font-size="13" fill="#00e599">
      ${githubStarIcon()}
      <text x="20" y="0" font-weight="500">${escapeXml(`${starsLabel} stars`)}</text>
    </g>`;
}

export function renderOgSvg(state: OgStarsState, cliVersion: string): string {
  const starsLabel =
    state.kind === 'live'
      ? formatStars(state.stars)
      : state.kind === 'offline'
        ? '--'
        : null;
  const trustDisplay =
    state.kind === 'live'
      ? state.stars > 0
        ? escapeXml(`${starsLabel!} engineers trust it on GitHub`)
        : `Early ${DOT} ${escapeXml(state.repoLabel)} on GitHub`
      : state.kind === 'offline'
        ? `-- ${DOT} Metadata unavailable`
        : `Open source ${DOT} MIT licensed`;
  const starsStrip =
    state.kind === 'live'
      ? liveStarsStrip(starsLabel!)
      : state.kind === 'offline'
        ? `
    <g transform="translate(872, 26)" font-family="'JetBrains Mono', monospace" font-size="13" fill="#5a7a6a">
      <text x="0" y="0" font-weight="500">${escapeXml(`${starsLabel} stars`)}</text>
    </g>`
        : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#04140f"/>
      <stop offset="100%" stop-color="#020a08"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="0%" r="60%">
      <stop offset="0%" stop-color="#00e599" stop-opacity="0.25"/>
      <stop offset="60%" stop-color="#00e599" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="text-grad" x1="0" y1="0" x2="1" y2="0.6">
      <stop offset="0%" stop-color="#00e599"/>
      <stop offset="60%" stop-color="#33ffb3"/>
      <stop offset="100%" stop-color="#9affe0"/>
    </linearGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="#0a3a2a" stroke-width="1" stroke-opacity="0.35"/>
    </pattern>
    <filter id="blur"><feGaussianBlur stdDeviation="20"/></filter>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <g transform="translate(80, 90)">
    <rect width="220" height="40" rx="20" fill="#0a1a14" stroke="#1a3a2a" stroke-width="1"/>
    <circle cx="22" cy="20" r="5" fill="#00e599"/>
    <text x="38" y="26" font-family="'JetBrains Mono', monospace" font-size="14" fill="#7ac8a8">v${escapeXml(cliVersion)} ${DOT} stable</text>
  </g>

  <g transform="translate(80, 158)">
    <rect width="56" height="56" rx="14" fill="#1f8f73"/>
    <path d="M22 16 H16 V40 H22" stroke="white" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M26 28 L32 34 L42 22" stroke="white" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="76" y="40" font-family="'Outfit', sans-serif" font-weight="700" font-size="34" fill="#f0fff7">i18nprune</text>
  </g>

  <g transform="translate(80, 302)">
    <text font-family="'Outfit', sans-serif" font-weight="700" font-size="84" letter-spacing="-3" fill="#f0fff7">
      <tspan x="0" dy="0">The ESLint for</tspan>
      <tspan x="0" dy="98" fill="url(#text-grad)">production i18n.</tspan>
    </text>
  </g>

  <text x="80" y="520" font-family="'IBM Plex Sans', sans-serif" font-size="24" fill="#7ac8a8" font-weight="500">
    Compiler-grade static analysis ${DOT} validate ${DOT} sync ${DOT} prune ${DOT} in CI, on the edge.
  </text>

  <g transform="translate(80, 555)">
    <rect width="1040" height="48" rx="14" fill="#0a1a14" stroke="#1a3a2a" stroke-width="1"/>
    <g transform="translate(20, 30)" font-family="'JetBrains Mono', monospace" font-size="13" fill="#7ac8a8">
      <circle cx="0" cy="-4" r="4" fill="#00e599"/>
      <text x="12" y="0">SOURCE CODE</text>
      <circle cx="110" cy="-4" r="4" fill="#00e599"/>
      <text x="122" y="0">AST SCAN</text>
      <circle cx="200" cy="-4" r="4" fill="#00e599"/>
      <text x="212" y="0">VALIDATE</text>
      <circle cx="290" cy="-4" r="4" fill="#00e599"/>
      <text x="302" y="0">SYNC</text>
      <circle cx="360" cy="-4" r="4" fill="#00e599"/>
      <text x="372" y="0">SHIP</text>
    </g>
    ${starsStrip}
  </g>

  <text x="1120" y="100" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="14" fill="#3a5a4a">
    ${trustDisplay}
  </text>
</svg>`;
}

/** Fetch meta worker data and render the 1200×630 share-card SVG. */
export async function buildOgSvg(): Promise<string> {
  const { starsState, cliVersion } = await fetchOgMeta();
  return renderOgSvg(starsState, cliVersion);
}
