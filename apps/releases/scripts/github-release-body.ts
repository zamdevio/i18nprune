#!/usr/bin/env tsx
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';
import type { ReleaseRecordV1 } from '../src/types/index.js';
import { CONTENT_DIR, siteOrigin } from './lib/utils.js';

function parseArgs(argv: string[]) {
  let stream: string | undefined;
  let version: string | undefined;
  let file: string | undefined;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--stream') stream = argv[++i];
    else if (argv[i] === '--version') version = argv[++i];
    else if (argv[i] === '--file') file = argv[++i];
  }
  return { stream, version, file };
}

const { stream, version, file } = parseArgs(process.argv);
const origin = siteOrigin();

let release: ReleaseRecordV1;
if (file) {
  release = yaml.parse(fs.readFileSync(path.resolve(file), 'utf8')) as ReleaseRecordV1;
} else if (stream && version) {
  const p = path.join(CONTENT_DIR, stream, `${version}.yaml`);
  if (!fs.existsSync(p)) {
    console.error(`Missing ${p}`);
    process.exit(1);
  }
  release = yaml.parse(fs.readFileSync(p, 'utf8')) as ReleaseRecordV1;
} else {
  console.error('Usage: github-release-body.ts --stream cli --version 0.1.0');
  console.error('   or: github-release-body.ts --file content/cli/0.1.0.yaml');
  process.exit(1);
}

const s = release.stream;
const v = release.version;
const url = `${origin}/${s}/${v}`;
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
  for (const note of release.migration.notes) {
    lines.push(`- ${note}`);
  }
}

process.stdout.write(`${lines.join('\n')}\n`);
