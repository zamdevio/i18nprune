import type { Issue } from '../../types/json/envelope/index.js';
import {
  ISSUE_PATHS_NETWORK_DRIVE,
  ISSUE_PATHS_WINDOWS_LONG_PATH,
  ISSUE_PATHS_WINDOWS_RESERVED_NAME,
} from '../constants/issueCodes.js';
import { toPosixPath } from './posix.js';

/** Win32 device names (case-insensitive); applies to a single path segment stem. */
const WINDOWS_RESERVED_STEM =
  /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

/** Conservative threshold before typical `MAX_PATH` (260) failures on Windows. */
export const WINDOWS_LONG_PATH_WARN_CHARS = 240;

export function normalizePathKeyForCache(projectRoot: string): string {
  return toPosixPath(projectRoot).normalize('NFC').toLowerCase();
}

export function pathSegmentStem(segment: string): string {
  const base = segment.replace(/[/\\]+$/, '');
  const name = base.split(/[/\\]/).pop() ?? base;
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
}

export function isWindowsReservedPathSegment(segment: string): boolean {
  return WINDOWS_RESERVED_STEM.test(pathSegmentStem(segment));
}

export function findWindowsReservedSegment(relativePosixPath: string): string | null {
  for (const segment of toPosixPath(relativePosixPath).split('/')) {
    if (segment.length === 0 || segment === '.' || segment === '..') continue;
    if (isWindowsReservedPathSegment(segment)) return segment;
  }
  return null;
}

export function isUncNetworkPath(absolutePath: string): boolean {
  return absolutePath.replace(/\//g, '\\').startsWith('\\\\');
}

/** True when a Win32 path is likely to hit legacy `MAX_PATH` without `\\?\` prefix. */
export function isLikelyWindowsLongPath(absolutePath: string): boolean {
  if (absolutePath.startsWith('\\\\?\\')) return false;
  return absolutePath.length >= WINDOWS_LONG_PATH_WARN_CHARS;
}

export type PlatformPathWarningInput = {
  label: string;
  absolutePath: string;
  /** Bundle- or project-relative path for reserved-name checks (posix). */
  relativePosixPath?: string;
};

export function collectPlatformPathWarnings(inputs: readonly PlatformPathWarningInput[]): Issue[] {
  const issues: Issue[] = [];
  for (const { label, absolutePath, relativePosixPath } of inputs) {
    const rel = relativePosixPath ?? toPosixPath(absolutePath);
    const reserved = findWindowsReservedSegment(rel);
    if (reserved !== null) {
      issues.push({
        severity: 'warning',
        code: ISSUE_PATHS_WINDOWS_RESERVED_NAME,
        message: `${label} uses Windows reserved name "${reserved}" (${rel}) — rename the segment or use a different locales layout.`,
        path: absolutePath,
      });
    }
    if (isLikelyWindowsLongPath(absolutePath)) {
      issues.push({
        severity: 'warning',
        code: ISSUE_PATHS_WINDOWS_LONG_PATH,
        message: `${label} path is very long (${String(absolutePath.length)} chars) — on Windows, enable long paths or shorten the project root.`,
        path: absolutePath,
      });
    }
    if (isUncNetworkPath(absolutePath)) {
      issues.push({
        severity: 'info',
        code: ISSUE_PATHS_NETWORK_DRIVE,
        message: `${label} is on a UNC network share — expect slower cache and locale IO; keep the project on a local disk when possible.`,
        path: absolutePath,
      });
    }
  }
  return issues;
}
