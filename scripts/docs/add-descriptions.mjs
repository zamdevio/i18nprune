#!/usr/bin/env node
/**
 * One-shot helper: add VitePress description frontmatter to docs markdown when missing.
 * Run from repo root: node scripts/docs/add-descriptions.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const docsRoot = path.join(repoRoot, 'docs');

function walkMd(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      out.push(...walkMd(full));
      continue;
    }
    if (name.endsWith('.md')) out.push(full);
  }
  return out.sort();
}

function stripMarkdown(text) {
  return text
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateDescription(text, max = 158) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 60 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:\s]+$/, '') + '…';
}

function parseFrontmatter(content) {
  if (!content.startsWith('---\n')) return { hasFm: false, fm: '', body: content };
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) return { hasFm: false, fm: '', body: content };
  return {
    hasFm: true,
    fm: content.slice(4, end),
    body: content.slice(end + 5),
  };
}

function hasDescription(fm) {
  return /^description:\s*.+/m.test(fm);
}

function deriveDescription(body) {
  const lines = body.split('\n');
  let title = '';
  let paragraph = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!title && /^#\s+/.test(trimmed)) {
      title = stripMarkdown(trimmed.replace(/^#\s+/, ''));
      continue;
    }
    if (!title) continue;
    if (!trimmed) {
      if (paragraph) break;
      continue;
    }
    if (
      trimmed.startsWith('```') ||
      trimmed.startsWith('|') ||
      trimmed.startsWith('>') ||
      trimmed.startsWith('<!--') ||
      /^[-*]\s/.test(trimmed) ||
      /^#{1,6}\s/.test(trimmed)
    ) {
      if (paragraph) break;
      continue;
    }
    paragraph += (paragraph ? ' ' : '') + trimmed;
    if (paragraph.length > 200) break;
  }

  const base = stripMarkdown(paragraph || title);
  if (!base) return 'i18nprune documentation.';
  if (paragraph) return truncateDescription(base);
  return truncateDescription(`${title} — i18nprune documentation.`);
}

function yamlQuote(value) {
  if (/^[\w .,;:!?()/'"-]+$/.test(value) && !value.includes('  ')) {
    return value;
  }
  return JSON.stringify(value);
}

function addDescription(content) {
  const { hasFm, fm, body } = parseFrontmatter(content);
  if (hasFm && hasDescription(fm)) return null;

  const description = deriveDescription(body);
  const descLine = `description: ${yamlQuote(description)}`;

  if (hasFm) {
    const nextFm = fm.trimEnd() ? `${fm.trimEnd()}\n${descLine}\n` : `${descLine}\n`;
    return `---\n${nextFm}---\n${body}`;
  }
  return `---\n${descLine}\n---\n\n${body.replace(/^\n+/, '')}`;
}

let updated = 0;
let skipped = 0;

for (const file of walkMd(docsRoot)) {
  const original = fs.readFileSync(file, 'utf8');
  const next = addDescription(original);
  if (next == null) {
    skipped += 1;
    continue;
  }
  fs.writeFileSync(file, next, 'utf8');
  updated += 1;
}

console.log(`docs descriptions: ${updated} updated, ${skipped} already had description`);
