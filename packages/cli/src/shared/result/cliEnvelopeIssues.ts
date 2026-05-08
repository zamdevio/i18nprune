import { I18nPruneError, issueCodeRepoDocPathForIssueCode } from '@i18nprune/core';
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
  ISSUE_DOCTOR_CONFIG_MISSING_FILE,
  ISSUE_DOCTOR_PATHS_DIRECTORIES_MISSING,
  ISSUE_DOCTOR_PATHS_SOURCE_LOCALE_MISSING,
  ISSUE_DOCTOR_RUNTIME_UNSUPPORTED_NODE,
  ISSUE_DOCTOR_TOOLS_RG_NOT_ON_PATH,
} from '@/constants/issueCodes.js';
import type { DoctorCheckId, DoctorFinding } from '@/types/commands/doctor/index.js';
import type { Issue } from '@/types/core/json/envelope.js';
import type { PatchingDiagnostic } from '@i18nprune/core';

function issueCodeForDoctorFinding(f: DoctorFinding): string | null {
  if (f.severity === 'ok') return null;
  const id = f.id as DoctorCheckId;
  if (id === 'runtime' && f.severity === 'error') return ISSUE_DOCTOR_RUNTIME_UNSUPPORTED_NODE;
  if (id === 'tools' && f.severity === 'warn') return ISSUE_DOCTOR_TOOLS_RG_NOT_ON_PATH;
  if (id === 'config' && f.severity === 'warn') return ISSUE_DOCTOR_CONFIG_MISSING_FILE;
  if (id === 'paths' && f.severity === 'error') return ISSUE_DOCTOR_PATHS_SOURCE_LOCALE_MISSING;
  if (id === 'paths' && f.severity === 'warn') return ISSUE_DOCTOR_PATHS_DIRECTORIES_MISSING;
  return null;
}

export function issuesFromDiscoveryWarnings(warnings: readonly string[]): Issue[] {
  return warnings.map((message) => ({
    severity: 'warning' as const,
    code: ISSUE_CONTEXT_DISCOVERY_WARNING,
    message,
  }));
}

/** Build one **`issues[]`** row from a **`USAGE`** {@link I18nPruneError}, preferring **`err.issueCode`** when set. */
export function usageIssueFromI18nPruneError(err: I18nPruneError, fallbackIssueCode: string): Issue {
  const code =
    err.issueCode !== undefined && err.issueCode.startsWith('i18nprune.') ? err.issueCode : fallbackIssueCode;
  return {
    severity: 'error',
    code,
    message: err.message,
    docPath: issueCodeRepoDocPathForIssueCode(code),
  };
}

/** Dynamic key sites outside `validate` (shared wording). */
export function issuesFromDynamicScanCount(count: number): Issue[] {
  if (count <= 0) return [];
  return [
    {
      severity: 'warning',
      code: ISSUE_SCAN_DYNAMIC_KEY_SITES,
      message: `${String(count)} translation call(s) use a non-literal key — static analysis cannot enumerate computed keys as fixed paths.`,
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
      message: `${String(skipped.length)} path(s) are not in the current code scan (ignored).`,
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
    const code = issueCodeForDoctorFinding(f);
    if (code === null) continue;
    out.push({
      severity: f.severity === 'error' ? 'error' : 'warning',
      code,
      message: f.detail ? `${f.title} — ${f.detail}` : f.title,
      docPath: issueCodeRepoDocPathForIssueCode(code),
    });
  }
  return out;
}

export function issuesFromPatchingDiagnostics(diagnostics: readonly PatchingDiagnostic[]): Issue[] {
  return diagnostics
    .filter((d) => d.severity !== 'info')
    .map((d) => ({
      severity: d.severity === 'error' ? 'error' : 'warning',
      code: d.code,
      message: d.message,
      ...(d.path ? { path: d.path } : {}),
      ...(d.docPath ? { docPath: d.docPath } : { docPath: issueCodeRepoDocPathForIssueCode(d.code) }),
    }));
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
      docPath: issueCodeRepoDocPathForIssueCode(ISSUE_LOCALE_TARGET_NOT_FOUND),
    },
  ];
}

/** Merge issue arrays (dedupe not applied — callers compose). */
export function mergeIssues(...groups: Issue[][]): Issue[] {
  return groups.flat();
}
