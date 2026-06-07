#!/usr/bin/env node
/**
 * IndexNow ping CLI — notify Bing / protocol partners after deploy.
 *
 * Usage:
 *   INDEXNOW_KEY=... pnpm indexnow:ping -- --preset releases --version 0.1.3 --dry-run
 *   INDEXNOW_KEY=... pnpm indexnow:ping -- --urls https://releases.i18nprune.dev/cli/0.1.3
 */
import {
  buildIndexNowPayload,
  RELEASES_INDEXNOW_HOST,
  submitIndexNow,
} from '@i18nprune/seo';

import { urlsFromReleaseVersion } from './urls-from-releases.mts';

type CliOptions = {
  dryRun: boolean;
  host: string;
  preset: string | null;
  urls: string[];
  version: string | null;
};

function parseArgs(argv: string[]): CliOptions {
  let dryRun = false;
  let host = RELEASES_INDEXNOW_HOST;
  let preset: string | null = null;
  let version: string | null = null;
  const urls: string[] = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--') continue;
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (arg === '--preset') {
      preset = argv[++i] ?? null;
      continue;
    }
    if (arg === '--version') {
      version = argv[++i] ?? null;
      continue;
    }
    if (arg === '--host') {
      host = argv[++i] ?? host;
      continue;
    }
    if (arg === '--urls') {
      const raw = argv[++i] ?? '';
      urls.push(...raw.split(',').map((u) => u.trim()).filter(Boolean));
      continue;
    }
    console.error(`Unknown flag: ${arg}`);
    process.exit(1);
  }

  return { dryRun, host, preset, urls, version };
}

function resolveUrlList(opts: CliOptions): string[] {
  if (opts.urls.length > 0) return opts.urls;
  if (opts.preset === 'releases') {
    if (!opts.version) {
      console.error('--preset releases requires --version X.Y.Z');
      process.exit(1);
    }
    return urlsFromReleaseVersion(opts.version);
  }
  console.error('Provide --urls or --preset releases --version X.Y.Z');
  process.exit(1);
}

const opts = parseArgs(process.argv.slice(2));
const key = process.env.INDEXNOW_KEY?.trim() ?? '';

if (!opts.dryRun && key.length === 0) {
  console.error('INDEXNOW_KEY is required (set env var or use --dry-run)');
  process.exit(1);
}

const urlList = resolveUrlList(opts);
const payload = buildIndexNowPayload({ host: opts.host, key: key || '<INDEXNOW_KEY>', urlList });

if (opts.dryRun) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

const result = await submitIndexNow({ host: opts.host, key, urlList });
if (!result.ok) {
  console.error(`IndexNow ping failed: HTTP ${result.status}${result.body ? ` — ${result.body}` : ''}`);
  process.exit(2);
}

console.log(`IndexNow OK — HTTP ${result.status}, ${urlList.length} URL(s) for ${payload.host}`);
