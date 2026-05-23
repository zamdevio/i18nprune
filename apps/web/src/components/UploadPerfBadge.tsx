type UploadPerfBadgeProps = {
  preparedAt?: string;
  extractionComputedAt?: string;
};

function computeMs(preparedAt?: string, computedAt?: string): number | null {
  if (!preparedAt || !computedAt) return null;
  const start = Date.parse(preparedAt);
  const end = Date.parse(computedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  return Math.max(0, end - start);
}

export function UploadPerfBadge({ preparedAt, extractionComputedAt }: UploadPerfBadgeProps) {
  const ms = computeMs(preparedAt, extractionComputedAt);
  if (ms === null) return null;
  return (
    <div className="perf-badge">
      <span>Extraction compute</span>
      <strong>{ms}ms</strong>
    </div>
  );
}
