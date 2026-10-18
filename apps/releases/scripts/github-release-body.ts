#!/usr/bin/env tsx
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';
import type { ReleaseRecordV1, StreamId } from '../src/types/index.js';
import { CONTENT_DIR, loadAllReleaseFiles, siteOrigin } from './lib/utils.js';

/** Preferred stream order in a combined body. */
const STREAM_ORDER: StreamId[] = ['cli', 'core', 'extension'];

const SECTION_ORDER = [
  'breaking',
  'security',
  'added',
  'changed',
  'fixed',
  'removed',
  'performance',
] as const;

const SECTION_LABEL: Record<(typeof SECTION_ORDER)[number], string> = {
  breaking: 'Breaking',
  security: 'Security',
  added: 'Added',
  changed: 'Changed',
  fixed: 'Fixed',
  removed: 'Removed',
  performance: 'Performance',
};

const STREAM_LABEL: Record<string, string> = {
  cli: 'CLI',
  core: 'Core',
  extension: 'Extension',
  desktop: 'Desktop',
};

function streamLabel(stream: string): string {
  return STREAM_LABEL[stream] ?? stream;
}

function parseArgs(argv: string[]) {
  let stream: string | undefined;
  let version: string | undefined;
  let tag: string | undefined;
  let file: string | undefined;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--stream') stream = argv[++i];
    else if (argv[i] === '--version') version = argv[++i];
    else if (argv[i] === '--tag') tag = argv[++i];
    else if (argv[i] === '--file') file = argv[++i];
  }
  return { stream, version, tag, file };
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

/** `v1.1.1` → `1.1.1`; `extension-v0.2.0` → `0.2.0`. */
function versionFromTag(value: string): string | null {
  const match = /(\d+\.\d+\.\d+[0-9A-Za-z.+-]*)$/.exec(value.trim());
  return match ? match[1]! : null;
}

function sectionLines(release: ReleaseRecordV1): string[] {
  const out: string[] = [];
  for (const key of SECTION_ORDER) {
    const items = release.sections?.[key] ?? [];
    if (items.length === 0) continue;
    out.push('', `**${SECTION_LABEL[key]}**`);
    for (const item of items) out.push(`- ${item}`);
  }
  return out;
}

/** Single-stream body (unchanged shape) — link, summary, install, breaking, migration. */
function singleStreamBody(release: ReleaseRecordV1, origin: string): string {
  const url = `${origin}/${release.stream}/${release.version}`;
  const breaking = release.sections?.breaking?.length ?? 0;

  const lines = [
    `Full release notes: ${url}`,
    '',
    '## Summary',
    release.summary,
    '',
    '## Install',
    `\`${release.npm.installSnippet}\``,
  ];

  if (breaking > 0) {
    lines.push('', `> **${breaking} breaking change(s)** — see the portal for details.`);
  }

  if (release.migration?.notes?.length) {
    lines.push('', '## Migration');
    for (const note of release.migration.notes) lines.push(`- ${note}`);
  }

  return `${lines.join('\n')}\n`;
}

/**
 * Combined body for a version shared by several streams (e.g. the lockstep CLI + Core
 * release): one header, every stream that has that version, then a merged migration.
 */
function combinedBody(releases: ReleaseRecordV1[], origin: string): string {
  const breaking = releases.reduce((sum, r) => sum + (r.sections?.breaking?.length ?? 0), 0);

  const lines: string[] = [
    `Full release notes: ${origin}`,
    '',
    `**Streams:** ${releases.map((r) => `${streamLabel(r.stream)} ${r.version}`).join(' · ')}`,
  ];

  if (breaking > 0) {
    lines.push('', `> **${breaking} breaking change(s)** — see the portal for details.`);
  }

  lines.push('', '## Install');
  for (const r of releases) {
    lines.push(`- ${streamLabel(r.stream)}: \`${r.npm.installSnippet}\``);
  }

  for (const r of releases) {
    lines.push('', `## ${streamLabel(r.stream)} v${r.version}`, '', r.summary);
    lines.push(...sectionLines(r));
  }

  const notes = [...new Set(releases.flatMap((r) => r.migration?.notes ?? []))];
  if (notes.length > 0) {
    lines.push('', '## Migration');
    for (const note of notes) lines.push(`- ${note}`);
  }

  return `${lines.join('\n')}\n`;
}

const { stream, version: versionArg, tag, file } = parseArgs(process.argv);
const origin = siteOrigin();

const version = versionArg ?? (tag ? versionFromTag(tag) : null);
if (tag && !version) fail(`Could not parse a version from tag "${tag}".`);

let body: string;

if (file) {
  const release = yaml.parse(fs.readFileSync(path.resolve(file), 'utf8')) as ReleaseRecordV1;
  body = singleStreamBody(release, origin);
} else if (stream) {
  if (!version) {
    fail('Usage: github-release-body.ts --stream cli --version 0.1.0');
  }
  const filePath = path.join(CONTENT_DIR, stream, `${version}.yaml`);
  if (!fs.existsSync(filePath)) fail(`Missing ${filePath}`);
  const release = yaml.parse(fs.readFileSync(filePath, 'utf8')) as ReleaseRecordV1;
  body = singleStreamBody(release, origin);
} else if (version) {
  const releases = loadAllReleaseFiles()
    .filter((entry) => entry.version === version)
    .sort((a, b) => STREAM_ORDER.indexOf(a.stream) - STREAM_ORDER.indexOf(b.stream))
    .map((entry) => entry.data);
  if (releases.length === 0) fail(`No stream has a release YAML for ${version}.`);
  body = combinedBody(releases, origin);
} else {
  fail(
    [
      'Usage:',
      '  github-release-body.ts --version 1.1.1            # combined (all streams at that version)',
      '  github-release-body.ts --tag v1.1.1              # combined (version parsed from tag)',
      '  github-release-body.ts --stream cli --version 1.1.1',
      '  github-release-body.ts --file content/cli/1.1.1.yaml',
    ].join('\n'),
  );
}

process.stdout.write(body);
