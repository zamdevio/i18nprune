import fs from 'node:fs';
import path from 'node:path';
import { COMMIT_TYPES } from '../lib/parse.js';
import { DATA_DIR, GIT_APP_ROOT } from '../lib/paths.js';

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

const COMMIT_TYPE_SET = new Set<string>(COMMIT_TYPES);
const PHASE_COLORS = new Set(['teal', 'gray', 'purple', 'coral']);
const ISO_WEEK_RE = /^\d{4}-W\d{2}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const FULL_HASH_RE = /^[0-9a-f]{40}$/;
const SHORT_HASH_RE = /^[0-9a-f]{7,40}$/;

function formatDataPath(filePath: string): string {
  const relative = path.relative(GIT_APP_ROOT, filePath);
  return relative && !relative.startsWith('..') ? relative : path.basename(filePath);
}

function formatReadError(error: unknown): string {
  if (error instanceof SyntaxError) return error.message;
  if (error instanceof Error) return error.message;
  return String(error);
}

function reportFatal(message: string): never {
  console.error(message);
  console.error('');
  console.error('Run pnpm git:sync to regenerate src/data/*.json.');
  process.exit(1);
}

function readJsonFile(filePath: string): JsonValue {
  const label = formatDataPath(filePath);
  if (!fs.existsSync(filePath)) {
    reportFatal(`Missing data file: ${label}`);
  }

  let raw: string;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    reportFatal(`Cannot read ${label}: ${formatReadError(error)}`);
  }

  try {
    return JSON.parse(raw) as JsonValue;
  } catch (error) {
    reportFatal(`Invalid JSON in ${label}: ${formatReadError(error)}`);
  }
}

function isRecord(value: JsonValue): value is Record<string, JsonValue> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasField(record: Record<string, JsonValue>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function checkString(
  errors: string[],
  record: Record<string, JsonValue>,
  key: string,
  label: string,
): string | undefined {
  if (!hasField(record, key)) {
    errors.push(`${label}.${key} is required`);
    return undefined;
  }
  const value = record[key];
  if (typeof value !== 'string' || value.length === 0) {
    errors.push(`${label}.${key} must be a non-empty string`);
    return undefined;
  }
  return value;
}

function checkNullableString(
  errors: string[],
  record: Record<string, JsonValue>,
  key: string,
  label: string,
): void {
  if (!hasField(record, key)) {
    errors.push(`${label}.${key} is required (use null when unavailable)`);
    return;
  }
  const value = record[key];
  if (value !== null && typeof value !== 'string') {
    errors.push(`${label}.${key} must be a string or null`);
  }
}

function checkNumber(
  errors: string[],
  record: Record<string, JsonValue>,
  key: string,
  label: string,
): number | undefined {
  if (!hasField(record, key)) {
    errors.push(`${label}.${key} is required`);
    return undefined;
  }
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    errors.push(`${label}.${key} must be a finite number`);
    return undefined;
  }
  return value;
}

function checkNullableNumber(
  errors: string[],
  record: Record<string, JsonValue>,
  key: string,
  label: string,
): void {
  if (!hasField(record, key)) {
    errors.push(`${label}.${key} is required (use null when unavailable)`);
    return;
  }
  const value = record[key];
  if (value !== null && (typeof value !== 'number' || !Number.isFinite(value))) {
    errors.push(`${label}.${key} must be a finite number or null`);
  }
}

function checkBoolean(
  errors: string[],
  record: Record<string, JsonValue>,
  key: string,
  label: string,
): boolean | undefined {
  if (!hasField(record, key)) {
    errors.push(`${label}.${key} is required`);
    return undefined;
  }
  const value = record[key];
  if (typeof value !== 'boolean') {
    errors.push(`${label}.${key} must be a boolean`);
    return undefined;
  }
  return value;
}

function checkStringArray(
  errors: string[],
  record: Record<string, JsonValue>,
  key: string,
  label: string,
): string[] | undefined {
  if (!hasField(record, key)) {
    errors.push(`${label}.${key} is required`);
    return undefined;
  }
  const value = record[key];
  if (!Array.isArray(value)) {
    errors.push(`${label}.${key} must be an array`);
    return undefined;
  }
  for (let i = 0; i < value.length; i += 1) {
    if (typeof value[i] !== 'string') {
      errors.push(`${label}.${key}[${i}] must be a string`);
    }
  }
  return value as string[];
}

function checkHashPair(
  errors: string[],
  record: Record<string, JsonValue>,
  shortKey: string,
  fullKey: string,
  label: string,
): { shortHash?: string; fullHash?: string } {
  const shortHash = checkString(errors, record, shortKey, label);
  const fullHash = checkString(errors, record, fullKey, label);
  if (!shortHash || !fullHash) return { shortHash, fullHash };

  if (!SHORT_HASH_RE.test(shortHash)) {
    errors.push(`${label}.${shortKey} must be a lowercase hex git hash prefix`);
  }
  if (!FULL_HASH_RE.test(fullHash)) {
    errors.push(`${label}.${fullKey} must be a 40-character lowercase hex git hash`);
  }
  if (!fullHash.startsWith(shortHash)) {
    errors.push(`${label}.${fullKey} must start with ${label}.${shortKey} (${shortHash} vs ${fullHash})`);
  }
  return { shortHash, fullHash };
}

function checkDate(errors: string[], value: string | undefined, label: string): void {
  if (!value) return;
  if (!DATE_RE.test(value)) {
    errors.push(`${label} must be YYYY-MM-DD`);
  }
}

function checkIsoWeek(errors: string[], value: string | undefined, label: string): void {
  if (!value) return;
  if (!ISO_WEEK_RE.test(value)) {
    errors.push(`${label} must match YYYY-Www (ISO week)`);
  }
}

function checkFileStats(errors: string[], record: Record<string, JsonValue>, label: string): void {
  if (!hasField(record, 'fileStats')) {
    errors.push(`${label}.fileStats is required`);
    return;
  }
  const fileStats = record.fileStats;
  if (!Array.isArray(fileStats)) {
    errors.push(`${label}.fileStats must be an array`);
    return;
  }
  for (let i = 0; i < fileStats.length; i += 1) {
    const statLabel = `${label}.fileStats[${i}]`;
    const stat = fileStats[i];
    if (!isRecord(stat)) {
      errors.push(`${statLabel} must be an object`);
      continue;
    }
    checkString(errors, stat, 'path', statLabel);
    checkNumber(errors, stat, 'insertions', statLabel);
    checkNumber(errors, stat, 'deletions', statLabel);
  }
}

function main(): void {
  const errors: string[] = [];

  const commitsRaw = readJsonFile(path.join(DATA_DIR, 'commits.json'));
  const summaryRaw = readJsonFile(path.join(DATA_DIR, 'summary.json'));
  const authorsRaw = readJsonFile(path.join(DATA_DIR, 'authors.json'));
  const tagsRaw = readJsonFile(path.join(DATA_DIR, 'tags.json'));
  const branchesRaw = readJsonFile(path.join(DATA_DIR, 'branches.json'));
  const phasesRaw = readJsonFile(path.join(DATA_DIR, 'phases.json'));

  if (!Array.isArray(commitsRaw)) errors.push('commits.json must be an array');
  if (!Array.isArray(authorsRaw)) errors.push('authors.json must be an array');
  if (!Array.isArray(tagsRaw)) errors.push('tags.json must be an array');
  if (!Array.isArray(branchesRaw)) errors.push('branches.json must be an array');
  if (!Array.isArray(phasesRaw)) errors.push('phases.json must be an array');
  if (!isRecord(summaryRaw)) errors.push('summary.json must be an object');

  if (errors.length > 0) {
    reportErrors(errors);
  }

  const commits = commitsRaw as JsonValue[];
  const authors = authorsRaw as JsonValue[];
  const tags = tagsRaw as JsonValue[];
  const branches = branchesRaw as JsonValue[];
  const phases = phasesRaw as JsonValue[];
  const summary = summaryRaw as Record<string, JsonValue>;

  const seenShortHashes = new Set<string>();
  const seenFullHashes = new Set<string>();
  const commitsByWeek = new Map<string, number>();

  for (let i = 0; i < commits.length; i += 1) {
    const commit = commits[i];
    const label = `commits[${i}]`;
    if (!isRecord(commit)) {
      errors.push(`${label} must be an object`);
      continue;
    }

    const { shortHash: hash, fullHash } = checkHashPair(errors, commit, 'hash', 'fullHash', label);
    const date = checkString(errors, commit, 'date', label);
    const week = checkString(errors, commit, 'week', label);
    checkDate(errors, date, `${label}.date`);
    checkIsoWeek(errors, week, `${label}.week`);
    if (week) commitsByWeek.set(week, (commitsByWeek.get(week) ?? 0) + 1);

    const type = checkString(errors, commit, 'type', label);
    if (type && !COMMIT_TYPE_SET.has(type)) {
      errors.push(
        `${label}.type must be a normalized export type (${COMMIT_TYPES.join(', ')}); re-run sync to coerce conventional types`,
      );
    }
    checkString(errors, commit, 'scope', label);
    checkString(errors, commit, 'subject', label);
    if (!hasField(commit, 'body')) {
      errors.push(`${label}.body is required`);
    } else if (typeof commit.body !== 'string') {
      errors.push(`${label}.body must be a string`);
    }
    checkString(errors, commit, 'author', label);
    checkString(errors, commit, 'email', label);
    checkNumber(errors, commit, 'insertions', label);
    checkNumber(errors, commit, 'deletions', label);
    checkNumber(errors, commit, 'filesChanged', label);
    checkStringArray(errors, commit, 'files', label);
    checkFileStats(errors, commit, label);
    checkStringArray(errors, commit, 'tags', label);
    checkStringArray(errors, commit, 'branches', label);
    if (!hasField(commit, 'branch')) {
      errors.push(`${label}.branch is required (use null when unassigned)`);
    } else if (commit.branch !== null && typeof commit.branch !== 'string') {
      errors.push(`${label}.branch must be a string or null`);
    }

    if (hash) {
      if (seenShortHashes.has(hash)) {
        errors.push(`${label}.hash duplicate short hash: ${hash}`);
      } else {
        seenShortHashes.add(hash);
      }
    }
    if (fullHash) {
      if (seenFullHashes.has(fullHash)) {
        errors.push(`${label}.fullHash duplicate full hash: ${fullHash}`);
      } else {
        seenFullHashes.add(fullHash);
      }
    }
  }

  const authorKeys = new Set<string>();
  const authorUsernames = new Set<string>();
  let authorCommitTotal = 0;

  for (let i = 0; i < authors.length; i += 1) {
    const author = authors[i];
    const label = `authors[${i}]`;
    if (!isRecord(author)) {
      errors.push(`${label} must be an object`);
      continue;
    }

    const username = checkString(errors, author, 'username', label);
    checkString(errors, author, 'name', label);
    const email = checkString(errors, author, 'email', label);
    const commitsCount = checkNumber(errors, author, 'commits', label);
    checkNumber(errors, author, 'insertions', label);
    checkNumber(errors, author, 'deletions', label);
    const firstCommit = checkString(errors, author, 'firstCommit', label);
    const lastCommit = checkString(errors, author, 'lastCommit', label);
    checkDate(errors, firstCommit, `${label}.firstCommit`);
    checkDate(errors, lastCommit, `${label}.lastCommit`);

    checkNullableString(errors, author, 'githubLogin', label);
    checkString(errors, author, 'githubUrl', label);
    checkString(errors, author, 'displayName', label);
    checkNullableString(errors, author, 'avatarUrl', label);
    checkNullableNumber(errors, author, 'followers', label);
    checkNullableNumber(errors, author, 'following', label);
    checkNullableString(errors, author, 'bio', label);

    if (commitsCount !== undefined) authorCommitTotal += commitsCount;
    if (email) {
      if (authorKeys.has(email)) {
        errors.push(`${label}.email duplicate: ${email}`);
      } else {
        authorKeys.add(email);
      }
    }
    if (username) {
      if (authorUsernames.has(username)) {
        errors.push(`${label}.username duplicate: ${username}`);
      } else {
        authorUsernames.add(username);
      }
    }
  }

  for (let i = 0; i < commits.length; i += 1) {
    const commit = commits[i];
    if (!isRecord(commit)) continue;
    const key = (typeof commit.email === 'string' && commit.email) || (typeof commit.author === 'string' ? commit.author : '');
    if (key && !authorKeys.has(key)) {
      errors.push(`commits[${i}] author ${key} missing from authors.json`);
    }
  }

  const tagNames = new Set<string>();
  const tagFullHashes = new Set<string>();

  for (let i = 0; i < tags.length; i += 1) {
    const tag = tags[i];
    const label = `tags[${i}]`;
    if (!isRecord(tag)) {
      errors.push(`${label} must be an object`);
      continue;
    }

    const name = checkString(errors, tag, 'name', label);
    const { shortHash, fullHash: hash } = checkHashPair(errors, tag, 'shortHash', 'hash', label);
    const date = checkString(errors, tag, 'date', label);
    checkDate(errors, date, `${label}.date`);
    checkString(errors, tag, 'subject', label);

    if (name) {
      if (tagNames.has(name)) errors.push(`${label}.name duplicate: ${name}`);
      else tagNames.add(name);
    }
    if (hash) {
      if (tagFullHashes.has(hash)) errors.push(`${label}.hash duplicate: ${hash}`);
      else tagFullHashes.add(hash);
    }
    if (shortHash && hash && hash.slice(0, shortHash.length) !== shortHash) {
      errors.push(`${label}.shortHash must prefix ${label}.hash`);
    }
  }

  const branchNames = new Set<string>();

  for (let i = 0; i < branches.length; i += 1) {
    const branch = branches[i];
    const label = `branches[${i}]`;
    if (!isRecord(branch)) {
      errors.push(`${label} must be an object`);
      continue;
    }

    const name = checkString(errors, branch, 'name', label);
    const { shortHash, fullHash: hash } = checkHashPair(errors, branch, 'shortHash', 'hash', label);
    const date = checkString(errors, branch, 'date', label);
    checkDate(errors, date, `${label}.date`);
    checkString(errors, branch, 'subject', label);
    checkBoolean(errors, branch, 'isCurrent', label);
    checkNumber(errors, branch, 'totalCommits', label);
    checkNumber(errors, branch, 'authors', label);
    checkStringArray(errors, branch, 'authorEmails', label);
    checkNumber(errors, branch, 'insertions', label);
    checkNumber(errors, branch, 'deletions', label);
    checkNumber(errors, branch, 'netLines', label);
    checkNumber(errors, branch, 'activeDays', label);
    const firstCommit = checkString(errors, branch, 'firstCommit', label);
    const lastCommit = checkString(errors, branch, 'lastCommit', label);
    checkDate(errors, firstCommit, `${label}.firstCommit`);
    checkDate(errors, lastCommit, `${label}.lastCommit`);

    if (name) {
      if (branchNames.has(name)) errors.push(`${label}.name duplicate: ${name}`);
      else branchNames.add(name);
    }
    if (shortHash && hash && hash.slice(0, shortHash.length) !== shortHash) {
      errors.push(`${label}.shortHash must prefix ${label}.hash`);
    }
  }

  let phaseCommitTotal = 0;

  for (let i = 0; i < phases.length; i += 1) {
    const phase = phases[i];
    const label = `phases[${i}]`;
    if (!isRecord(phase)) {
      errors.push(`${label} must be an object`);
      continue;
    }

    const week = checkString(errors, phase, 'week', label);
    checkIsoWeek(errors, week, `${label}.week`);
    checkString(errors, phase, 'label', label);
    checkString(errors, phase, 'theme', label);
    const color = checkString(errors, phase, 'color', label);
    if (color && !PHASE_COLORS.has(color)) {
      errors.push(`${label}.color must be one of: ${[...PHASE_COLORS].join(', ')}`);
    }
    const shipped = checkStringArray(errors, phase, 'shipped', label);
    const phaseCommits = checkNumber(errors, phase, 'commits', label);

    if (phaseCommits !== undefined) phaseCommitTotal += phaseCommits;
    if (week && phaseCommits !== undefined) {
      const actual = commitsByWeek.get(week) ?? 0;
      if (phaseCommits !== actual) {
        errors.push(`${label}.commits (${phaseCommits}) !== commits.json count for ${week} (${actual})`);
      }
    }
    if (shipped && shipped.length === 0 && phaseCommits && phaseCommits > 0) {
      errors.push(`${label}.shipped must not be empty when commits > 0`);
    }
  }

  const totalCommits = checkNumber(errors, summary, 'totalCommits', 'summary');
  checkNumber(errors, summary, 'activeDays', 'summary');
  checkNumber(errors, summary, 'calendarDays', 'summary');
  const summaryAuthors = checkNumber(errors, summary, 'authors', 'summary');
  checkNumber(errors, summary, 'tsFiles', 'summary');
  checkNumber(errors, summary, 'tsSourceLines', 'summary');
  checkNumber(errors, summary, 'mdLines', 'summary');
  checkNumber(errors, summary, 'netLinesAdded', 'summary');
  const summaryFirstCommit = checkString(errors, summary, 'firstCommit', 'summary');
  const summaryLastCommit = checkString(errors, summary, 'lastCommit', 'summary');
  checkDate(errors, summaryFirstCommit, 'summary.firstCommit');
  checkDate(errors, summaryLastCommit, 'summary.lastCommit');
  const summaryTags = checkStringArray(errors, summary, 'tags', 'summary');
  const summaryBranches = checkStringArray(errors, summary, 'branches', 'summary');

  if (!hasField(summary, 'topCommitDay')) {
    errors.push('summary.topCommitDay is required');
  } else if (isRecord(summary.topCommitDay)) {
    const topDay = summary.topCommitDay;
    const topDate = checkString(errors, topDay, 'date', 'summary.topCommitDay');
    checkDate(errors, topDate, 'summary.topCommitDay.date');
    checkNumber(errors, topDay, 'count', 'summary.topCommitDay');
  } else {
    errors.push('summary.topCommitDay must be an object');
  }

  if (!hasField(summary, 'syncedAt')) {
    errors.push('summary.syncedAt is required');
  } else if (typeof summary.syncedAt !== 'string' || Number.isNaN(Date.parse(summary.syncedAt))) {
    errors.push('summary.syncedAt must be an ISO-8601 timestamp string');
  }

  if (!hasField(summary, 'githubRepoUrl')) {
    errors.push('summary.githubRepoUrl is required (use null when unavailable)');
  } else if (summary.githubRepoUrl !== null && typeof summary.githubRepoUrl !== 'string') {
    errors.push('summary.githubRepoUrl must be a string or null');
  }

  if (totalCommits !== undefined && totalCommits !== commits.length) {
    errors.push(`summary.totalCommits (${totalCommits}) !== commits.json length (${commits.length})`);
  }
  if (summaryAuthors !== undefined && summaryAuthors !== authors.length) {
    errors.push(`summary.authors (${summaryAuthors}) !== authors.json length (${authors.length})`);
  }
  if (authorCommitTotal !== commits.length) {
    errors.push(`authors commit sum (${authorCommitTotal}) !== commits.json length (${commits.length})`);
  }
  if (phaseCommitTotal !== commits.length) {
    errors.push(`phases commit sum (${phaseCommitTotal}) !== commits.json length (${commits.length})`);
  }
  if (summaryTags) {
    const summaryTagSet = new Set(summaryTags);
    if (summaryTagSet.size !== tagNames.size || ![...tagNames].every((name) => summaryTagSet.has(name))) {
      errors.push('summary.tags must match tags.json names');
    }
  }
  if (summaryBranches) {
    const summaryBranchSet = new Set(summaryBranches);
    if (
      summaryBranchSet.size !== branchNames.size ||
      ![...branchNames].every((name) => summaryBranchSet.has(name))
    ) {
      errors.push('summary.branches must match branches.json names');
    }
  }

  if (errors.length > 0) {
    reportErrors(errors);
  }

  console.log(
    `Data OK: ${commits.length} commits · ${authors.length} authors · ${tags.length} tags · ${branches.length} branches · ${phases.length} phases`,
  );
}

function reportErrors(errors: string[]): never {
  console.error('Generated git analytics data failed validation:');
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  console.error('');
  console.error('Run pnpm sync (or pnpm git:sync) to regenerate src/data/*.json.');
  process.exit(1);
}

try {
  main();
} catch (error) {
  reportFatal(formatReadError(error));
}
