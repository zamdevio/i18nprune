#!/usr/bin/env node
/**
 * IndexNow ping CLI — notify Bing / protocol partners after deploy.
 *
 * Usage:
 *   INDEXNOW_KEY=... pnpm indexnow:releases -- --stream cli --version 0.1.3 --dry-run
 *   INDEXNOW_KEY=... pnpm indexnow:releases -- --stream cli:0.1.3,core:0.1.4 --dry-run
 *   INDEXNOW_KEY=... pnpm indexnow:docs -- --dry-run
 */
import { buildIndexNowPayload, submitIndexNow } from '@i18nprune/seo';

import {
  defaultHostForPreset,
  isIndexNowPreset,
  resolveIndexNowPreset,
} from './presets.mts';

type CliOptions = {
  dryRun: boolean;
  host: string | undefined;
  preset: string | null;
  streams: string[];
  urls: string[];
  version: string | null;
};

function parseArgs(argv: string[]): CliOptions {
  let dryRun = false;
  let host: string | undefined;
  let preset: string | null = null;
  let version: string | null = null;
  const streams: string[] = [];
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
    if (arg === '--stream') {
      const next = argv[++i];
      if (next) streams.push(next);
      continue;
    }
    if (arg === '--host') {
      const nextHost = argv[++i];
      if (nextHost) host = nextHost;
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

  return { dryRun, host, preset, streams, urls, version };
}

function resolveRun(opts: CliOptions): { host: string; urlList: string[] } {
  if (opts.urls.length > 0) {
    return { host: opts.host ?? defaultHostForPreset(opts.preset), urlList: opts.urls };
  }
  if (opts.preset && isIndexNowPreset(opts.preset)) {
    try {
      return resolveIndexNowPreset({
        preset: opts.preset,
        version: opts.version,
        streams: opts.streams,
      });
    } catch (err) {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    }
  }
  console.error(
    'Provide --urls or --preset releases|docs|landing|git (releases: --version and/or --stream)',
  );
  process.exit(1);
}

const opts = parseArgs(process.argv.slice(2));
const key = process.env.INDEXNOW_KEY?.trim() ?? '';

if (!opts.dryRun && key.length === 0) {
  console.error('INDEXNOW_KEY is required (set env var or use --dry-run)');
  process.exit(1);
}

const { host, urlList } = resolveRun(opts);
const payload = buildIndexNowPayload({ host, key: key || '<INDEXNOW_KEY>', urlList });

if (opts.dryRun) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

const result = await submitIndexNow({ host, key, urlList });
if (!result.ok) {
  console.error(`IndexNow ping failed: HTTP ${result.status}${result.body ? ` — ${result.body}` : ''}`);
  process.exit(2);
}

console.log(`IndexNow OK — HTTP ${result.status}, ${urlList.length} URL(s) for ${payload.host}`);
