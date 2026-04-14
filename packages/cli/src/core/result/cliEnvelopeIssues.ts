import {
  ISSUE_CONTEXT_DISCOVERY_WARNING,
  ISSUE_SCAN_DYNAMIC_KEY_SITES,
  ISSUE_MISSING_PATHS_NOT_IN_SCAN,
  ISSUE_SYNC_LOCALE_FILE_NOT_FOUND,
  ISSUE_CLEANUP_UNCERTAIN_PATHS_EXCLUDED,
  ISSUE_CLEANUP_RIPGREP_UNAVAILABLE,
  ISSUE_QUALITY_ENGLISH_IDENTICAL_LEAVES,
  ISSUE_LANGUAGES_EMPTY_FILTER,
  ISSUE_LOCALES_USAGE,
  ISSUE_LOCALE_TARGET_NOT_FOUND,
  doctorIssueCode,
} from '@/constants/issueCodes.js';
import type { DoctorFinding } from '@/types/commands/doctor/index.js';
import type { Issue } from '@/types/core/json/envelope.js';

export function issuesFromDiscoveryWarnings(warnings: readonly string[]): Issue[] {
  return warnings.map((message) => ({
    severity: 'warning' as const,
    code: ISSUE_CONTEXT_DISCOVERY_WARNING,
    message,
  }));
}

/** Dynamic key sites outside `validate` (shared wording). */
export function issuesFromDynamicScanCount(count: number): Issue[] {
  if (count <= 0) return [];
  return [
    {
      severity: 'warning',
      code: ISSUE_SCAN_DYNAMIC_KEY_SITES,
      message: `${String(count)} translation call site(s) use non-literal keys — static analysis cannot enumerate those keys.`,
      docPath: 'dynamic/README',
    },
  ];
}

export function issuesFromMissingSkippedNotInScan(skipped: readonly string[]): Issue[] {
  if (skipped.length === 0) return [];
  return [
    {
      severity: 'warning',
      code: ISSUE_MISSING_PATHS_NOT_IN_SCAN,
      message: `${String(skipped.length)} path(s) from --from-report are not in the current code scan (ignored).`,
      docPath: 'commands/missing/README',
    },
  ];
}

export function issuesFromSyncMissingLocaleFiles(localeCodes: readonly string[]): Issue[] {
  if (localeCodes.length === 0) return [];
  return [
    {
      severity: 'warning',
      code: ISSUE_SYNC_LOCALE_FILE_NOT_FOUND,
      message: `Locale file(s) not found under locales dir (skipped): ${localeCodes.map((c) => `${c}.json`).join(', ')}`,
      docPath: 'commands/sync/README',
    },
  ];
}

export function issuesFromCleanupUncertainExcluded(excludedCount: number): Issue[] {
  if (excludedCount <= 0) return [];
  return [
    {
      severity: 'info',
      code: ISSUE_CLEANUP_UNCERTAIN_PATHS_EXCLUDED,
      message: `${String(excludedCount)} path(s) excluded under uncertain key prefix policy.`,
      docPath: 'commands/cleanup/README',
    },
  ];
}

export function issuesFromCleanupRipgrepUnavailable(): Issue[] {
  return [
    {
      severity: 'warning',
      code: ISSUE_CLEANUP_RIPGREP_UNAVAILABLE,
      message:
        'ripgrep (rg) not on PATH — cleanup uses a narrower reference check without rg. Install rg for stronger safety.',
      docPath: 'commands/cleanup/README',
    },
  ];
}

export function issuesFromDoctorFindings(findings: readonly DoctorFinding[]): Issue[] {
  const out: Issue[] = [];
  for (const f of findings) {
    if (f.severity === 'ok') continue;
    out.push({
      severity: f.severity === 'error' ? 'error' : 'warning',
      code: doctorIssueCode(f.id),
      message: f.detail ? `${f.title} — ${f.detail}` : f.title,
      docPath: 'commands/doctor/README',
    });
  }
  return out;
}

export function issuesFromQualityEnglishIdentical(total: number): Issue[] {
  if (total <= 0) return [];
  return [
    {
      severity: 'info',
      code: ISSUE_QUALITY_ENGLISH_IDENTICAL_LEAVES,
      message: `${String(total)} leaf value(s) still equal the source locale (parity / copy candidates).`,
      docPath: 'commands/quality/README',
    },
  ];
}

export function issuesFromLanguagesFilter(filter: string | undefined, rowCount: number): Issue[] {
  if (!filter?.trim() || rowCount > 0) return [];
  return [
    {
      severity: 'info',
      code: ISSUE_LANGUAGES_EMPTY_FILTER,
      message: `No language rows matched filter "${filter.trim()}".`,
      docPath: 'commands/languages/README',
    },
  ];
}

export function issuesFromLocalesUsage(message: string): Issue[] {
  return [
    {
      severity: 'error',
      code: ISSUE_LOCALES_USAGE,
      message,
      docPath: 'commands/locales/README',
    },
  ];
}

export function isLocaleTargetMissingMessage(message: string): boolean {
  const x = message.toLowerCase();
  return (
    x.includes('locale file not found') ||
    x.includes('locale file missing') ||
    x.includes('no locale file for')
  );
}

export function issuesFromLocaleTargetMissing(message: string): Issue[] {
  return [
    {
      severity: 'error',
      code: ISSUE_LOCALE_TARGET_NOT_FOUND,
      message,
      docPath: 'json/issue-codes',
    },
  ];
}

/** Merge issue arrays (dedupe not applied — callers compose). */
export function mergeIssues(...groups: Issue[][]): Issue[] {
  return groups.flat();
}
