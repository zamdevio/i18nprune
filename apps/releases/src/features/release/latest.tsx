import React from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowRight, Package } from "lucide-react";
import StreamBadge from "./StreamBadge";
import { STREAM_META } from '@/features/catalog/streams';
import type { ReleaseRecordV1, StreamId } from '@/types';

type LatestReleaseCardProps = {
  release: ReleaseRecordV1 | null;
  streamId: StreamId;
};

export default function LatestReleaseCard({ release, streamId }: LatestReleaseCardProps) {
  const meta = STREAM_META[streamId];
  if (!meta) return null;

  const hasRelease = !!release;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <StreamBadge stream={streamId} size="lg" />
          {hasRelease && (
            <time className="text-xs text-muted-foreground" dateTime={release.date}>
              {format(new Date(release.date), "MMM d, yyyy")}
            </time>
          )}
        </div>

        <h3 className="text-sm font-medium text-muted-foreground mb-1">{meta.description}</h3>

        {hasRelease ? (
          <>
            <p className="text-2xl font-bold font-heading text-foreground mb-2">
              v{release.version}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
              {release.summary}
            </p>
            <Link
              to={`/${streamId}/${release.version}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View release notes <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </>
        ) : (
          <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>No releases yet</span>
          </div>
        )}
      </div>
    </div>
  );
}
