import type { ReleaseCompareResult, SectionDiff } from '@/features/compare/releases';
import { Link } from 'react-router-dom';
import type { StreamId } from '@/types';

function LineList({
  lines,
  variant,
}: {
  lines: string[];
  variant: 'added' | 'removed';
}) {
  if (lines.length === 0) return null;
  const styles =
    variant === 'added'
      ? 'border-primary/25 bg-primary/10'
      : 'border-destructive/25 bg-destructive/10';
  const mark = variant === 'added' ? '+' : '−';
  const markColor = variant === 'added' ? 'text-primary' : 'text-destructive';

  return (
    <ul className="space-y-1.5">
      {lines.map((line) => (
        <li
          key={`${variant}-${line}`}
          className={`text-sm rounded-md border px-3 py-2 text-foreground/90 ${styles}`}
        >
          <span className={`${markColor} font-medium mr-2`}>{mark}</span>
          {line}
        </li>
      ))}
    </ul>
  );
}

function SectionBlock({ section }: { section: SectionDiff }) {
  return (
    <div className="mb-6 last:mb-0">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        {section.label}
        <span className="text-xs font-normal text-muted-foreground">
          +{section.added.length} / −{section.removed.length}
        </span>
      </h3>
      {section.removed.length > 0 && (
        <div className="mb-3">
          <LineList lines={section.removed} variant="removed" />
        </div>
      )}
      {section.added.length > 0 && <LineList lines={section.added} variant="added" />}
    </div>
  );
}

type CompareDiffViewProps = {
  stream: StreamId;
  result: ReleaseCompareResult;
};

export default function CompareDiffView({ stream, result }: CompareDiffViewProps) {
  const { from, to, fromVersion, toVersion } = result;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-full bg-muted px-3 py-1 font-mono">
          v{fromVersion} → v{toVersion}
        </span>
        <span className="text-muted-foreground">
          <strong className="text-primary">{result.totals.added}</strong> additions,{' '}
          <strong className="text-destructive">{result.totals.removed}</strong> removals
        </span>
        <span className="ml-auto flex gap-3 text-xs">
          <Link to={`/${stream}/${fromVersion}`} className="text-primary hover:underline">
            Open v{fromVersion}
          </Link>
          <Link to={`/${stream}/${toVersion}`} className="text-primary hover:underline">
            Open v{toVersion}
          </Link>
        </span>
      </div>

      {result.summaryChanged && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
            Summary
          </p>
          <p className="text-sm text-muted-foreground line-through mb-2">{from.summary}</p>
          <p className="text-sm text-foreground">{to.summary}</p>
        </div>
      )}

      {(result.highlights.added.length > 0 || result.highlights.removed.length > 0) && (
        <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Highlights</h3>
          {result.highlights.removed.length > 0 && (
            <div className="mb-3">
              <LineList lines={result.highlights.removed} variant="removed" />
            </div>
          )}
          {result.highlights.added.length > 0 && (
            <LineList lines={result.highlights.added} variant="added" />
          )}
        </div>
      )}

      {result.sections.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Changelog</h3>
          {result.sections.map((section) => (
            <SectionBlock key={section.key} section={section} />
          ))}
        </div>
      )}

      {(result.migration.added.length > 0 || result.migration.removed.length > 0) && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Migration notes</h3>
          {result.migration.removed.length > 0 && (
            <div className="mb-3">
              <LineList lines={result.migration.removed} variant="removed" />
            </div>
          )}
          {result.migration.added.length > 0 && (
            <LineList lines={result.migration.added} variant="added" />
          )}
        </div>
      )}
    </div>
  );
}
