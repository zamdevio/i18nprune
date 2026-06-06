import { GIT_LOG_RECORD } from './git.js';

const COMMIT_TYPES = new Set([
  'feat',
  'fix',
  'docs',
  'refactor',
  'test',
  'chore',
  'ci',
  'build',
  'style',
  'perf',
]);

const CONVENTIONAL =
  /^(?<type>[a-z]+)(?:\((?<scope>[^)]+)\))?(?<breaking>!)?: (?<subject>.+)$/i;

const NUMSTAT = /^(\d+|-)\s+(\d+|-)\s+(.+)$/;

export interface FileStat {
  path: string;
  insertions: number;
  deletions: number;
}

export type ParsedCommitType =
  | 'feat'
  | 'chore'
  | 'docs'
  | 'refactor'
  | 'fix'
  | 'test'
  | 'ci';

export interface RawCommit {
  fullHash: string;
  hash: string;
  date: string;
  author: string;
  email: string;
  subject: string;
  body: string;
  insertions: number;
  deletions: number;
  filesChanged: number;
  files: string[];
  fileStats: FileStat[];
}

export function isoWeek(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00Z`);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function parseConventional(subject: string): {
  type: ParsedCommitType;
  scope: string;
  subject: string;
} {
  const match = subject.match(CONVENTIONAL);
  if (!match?.groups) {
    return { type: 'chore', scope: 'misc', subject };
  }

  let rawType = match.groups.type.toLowerCase();
  if (rawType === 'build') rawType = 'ci';

  const type: ParsedCommitType =
    COMMIT_TYPES.has(rawType) && rawType !== 'build' && rawType !== 'style' && rawType !== 'perf'
      ? (rawType as ParsedCommitType)
      : 'chore';

  return {
    type,
    scope: match.groups.scope?.trim() || 'misc',
    subject: match.groups.subject.trim(),
  };
}

function normalizeDate(raw: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw.slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

function applyNumstat(commit: RawCommit, lines: string[]): void {
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const stat = trimmed.match(NUMSTAT);
    if (!stat) continue;
    const add = stat[1] === '-' ? 0 : Number(stat[1]);
    const del = stat[2] === '-' ? 0 : Number(stat[2]);
    commit.fileStats.push({ path: stat[3], insertions: add, deletions: del });
    commit.insertions += add;
    commit.deletions += del;
    commit.filesChanged += 1;
  }
  commit.files = commit.fileStats.map((item) => item.path).slice(0, 80);
  commit.fileStats = commit.fileStats.slice(0, 80);
}

function parseCommitText(text: string): RawCommit | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const newline = trimmed.indexOf('\n');
  const head = newline === -1 ? trimmed : trimmed.slice(0, newline);
  const bodyTail = newline === -1 ? '' : trimmed.slice(newline + 1);

  const parts = head.split('\x1e');
  if (parts.length < 6 || !/^[0-9a-f]{40}$/.test(parts[0])) return null;

  const [fullHash, hash, date, author, email, subject, ...bodyStart] = parts;
  const body = [...bodyStart, bodyTail].filter(Boolean).join('\n').trim();

  return {
    fullHash,
    hash,
    date: normalizeDate(date),
    author,
    email,
    subject,
    body,
    insertions: 0,
    deletions: 0,
    filesChanged: 0,
    files: [],
    fileStats: [],
  };
}

function splitStatsAndText(piece: string): { stats: string[]; text: string } {
  const lines = piece.split('\n');
  const headerIdx = lines.findIndex((line) => /^[0-9a-f]{40}\x1e/.test(line));
  if (headerIdx <= 0) {
    return { stats: [], text: piece.trim() };
  }
  return {
    stats: lines.slice(0, headerIdx),
    text: lines.slice(headerIdx).join('\n').trim(),
  };
}

export function parseGitLog(raw: string): RawCommit[] {
  const pieces = raw.split(GIT_LOG_RECORD).map((piece) => piece.trim()).filter(Boolean);
  const commits: RawCommit[] = [];

  for (let i = 0; i < pieces.length; i += 1) {
    const piece = pieces[i];
    const { stats, text } = i === 0 ? { stats: [], text: piece } : splitStatsAndText(piece);

    if (i > 0 && commits.length > 0) {
      applyNumstat(commits[commits.length - 1], stats);
    }

    const commit = parseCommitText(text);
    if (commit) commits.push(commit);
  }

  return commits;
}

export interface ExportCommit {
  hash: string;
  fullHash: string;
  date: string;
  week: string;
  type: ParsedCommitType;
  scope: string;
  subject: string;
  body: string;
  author: string;
  email: string;
  insertions: number;
  deletions: number;
  filesChanged: number;
  files: string[];
  fileStats: FileStat[];
}

export function toExportCommit(raw: RawCommit): ExportCommit {
  const parsed = parseConventional(raw.subject);
  return {
    hash: raw.hash,
    fullHash: raw.fullHash,
    date: raw.date,
    week: isoWeek(raw.date),
    type: parsed.type,
    scope: parsed.scope,
    subject: parsed.subject,
    body: raw.body,
    author: raw.author,
    email: raw.email,
    insertions: raw.insertions,
    deletions: raw.deletions,
    filesChanged: raw.filesChanged,
    files: raw.files,
    fileStats: raw.fileStats,
  };
}
