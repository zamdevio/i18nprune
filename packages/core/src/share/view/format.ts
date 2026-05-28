import { SHARE_CACHE_REASON_MESSAGES } from '../../shared/constants/share.js';
import type { ProjectStoredMetadata } from '../../types/project/metadata.js';
import type { StoredReportMetadata } from '../../types/project/report/index.js';
import type { ShareViewVerboseSection } from '../../types/share/viewDetail.js';

/**
 * Presentation-only scalar formatter.
 * Transport payloads remain nullable; CLI/view layers render placeholders.
 */
export function displayScalar(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string' && value.length === 0) return '—';
  return String(value);
}

/** Compact preview for long hash-like values used in verbose view sections. */
export function previewHashLike(value: unknown, max = 12): string {
  const rendered = displayScalar(value);
  if (rendered === '—' || rendered.length <= max) return rendered;
  return `${rendered.slice(0, max)}…`;
}

/** Human-friendly cache analysis reason text with safe fallback. */
export function displayCacheReason(reason: unknown): string {
  const rendered = displayScalar(reason);
  if (rendered === '—') return rendered;
  return (SHARE_CACHE_REASON_MESSAGES as Record<string, string>)[rendered] ?? rendered;
}

export function formatTimingValue(value: unknown): string {
  if (typeof value === 'number') return String(value);
  return displayScalar(value);
}

export function formatCacheState(value: unknown): string {
  return displayScalar(value);
}

export function formatProcessorSummary(meta: ProjectStoredMetadata | StoredReportMetadata): string {
  const p = meta.processor;
  return `${displayScalar(p.surface)} · SDK ${displayScalar(p.sdk)}@${displayScalar(p.sdkVersion)} · host ${displayScalar(p.toolVersion)}`;
}

export function formatArtifactSummary(meta: ProjectStoredMetadata | StoredReportMetadata): string {
  if (meta.artifact.kind === 'project') {
    return `${meta.artifact.fileCount} files, ${meta.artifact.byteSize} bytes`;
  }
  const report = meta as StoredReportMetadata;
  return `format v${report.artifact.formatVersion}, ${report.artifact.byteSize} bytes, ok=${report.summary.ok}`;
}

export function formatExpirySummary(expiresAt: unknown): string {
  return `expires ${displayScalar(expiresAt)}`;
}

export type VerboseRow = { key: string; value: string };
export type VerboseSection = { title: string; rows: VerboseRow[] };

export function buildVerboseRows(section: ShareViewVerboseSection): VerboseRow[] {
  return Object.entries(section).map(([key, value]) => {
    if (Array.isArray(value)) {
      return { key, value: value.join(',') };
    }
    if (key.toLowerCase().includes('hash') || key.toLowerCase().includes('epoch')) {
      return { key, value: previewHashLike(value) };
    }
    if (key.toLowerCase().includes('reason')) {
      return { key, value: displayCacheReason(value) };
    }
    if (key.toLowerCase().includes('ms')) {
      return { key, value: formatTimingValue(value) };
    }
    if (key === 'analysis') {
      return { key, value: formatCacheState(value) };
    }
    return { key, value: displayScalar(value) };
  });
}
