type UploadPerfBadgeProps = {
  uploadedAt?: string;
  extractionComputedAt?: string;
};

function computeMs(uploadedAt?: string, computedAt?: string): number | null {
  if (!uploadedAt || !computedAt) return null;
  const start = Date.parse(uploadedAt);
  const end = Date.parse(computedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  return Math.max(0, end - start);
}

export function UploadPerfBadge({ uploadedAt, extractionComputedAt }: UploadPerfBadgeProps) {
  const ms = computeMs(uploadedAt, extractionComputedAt);
  if (ms === null) return null;
  return (
    <div className="perf-badge">
      <span>Extraction compute</span>
      <strong>{ms}ms</strong>
    </div>
  );
}
