import { format } from 'date-fns';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import StreamBadge from './StreamBadge';
import { hasBreaking } from '@/features/catalog/semver';
import type { ReleaseRecordV1 } from '@/types';

type ReleaseCardProps = {
  release: ReleaseRecordV1;
  showStream?: boolean;
};

export default function ReleaseCard({ release, showStream = false }: ReleaseCardProps) {
  return (
    <Link
      to={`/${release.stream}/${release.version}`}
      className="group block rounded-lg border border-border bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-md"
    >
      <div className="p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-start gap-2">
          {showStream && <StreamBadge stream={release.stream} />}
          <StatusBadge status={release.status} />
          {hasBreaking(release) && (
            <span className="inline-flex items-center gap-1 rounded-full border border-destructive/20 bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
              <AlertTriangle className="h-3 w-3" />
              Breaking
            </span>
          )}
        </div>

        <div className="mb-2 flex items-baseline gap-3">
          <h3 className="font-heading text-xl font-bold text-foreground transition-colors group-hover:text-primary">
            v{release.version}
          </h3>
          <time className="text-sm text-muted-foreground" dateTime={release.date}>
            {format(new Date(release.date), 'MMMM d, yyyy')}
          </time>
        </div>

        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {release.summary}
        </p>

        {(release.highlights?.length ?? 0) > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {(release.highlights ?? []).slice(0, 3).map((h, i) => (
              <span
                key={i}
                className="max-w-[200px] truncate rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {h}
              </span>
            ))}
            {(release.highlights?.length ?? 0) > 3 && (
              <span className="px-2 py-0.5 text-xs text-muted-foreground">
                +{(release.highlights?.length ?? 0) - 3} more
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-end border-t border-border/60 pt-3">
          <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-70 transition-opacity group-hover:opacity-100">
            View details <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
