import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExternalLink, Clock } from 'lucide-react';
import FilterChips from '@/components/FilterChips';
import ReleaseListPagination from '@/components/ReleaseListPagination';
import ReleaseTimeline from '@/features/release/timeline';
import { useListPagination } from '@/hooks/useListPagination';
import EmptyState from '@/components/EmptyState';
import StreamBadge from '@/features/release/StreamBadge';
import { getStreamReleases } from '@/features/catalog';
import { filterReleases } from '@/features/release/filters';
import type { ReleaseFilterId } from '@/features/release/filters';
import { isStreamId, STREAM_META } from '@/features/catalog/streams';

export default function StreamHome() {
  const { stream: streamParam } = useParams();
  const [filter, setFilter] = useState<ReleaseFilterId>('all');

  const stream = isStreamId(streamParam) ? streamParam : undefined;
  const meta = stream ? STREAM_META[stream] : undefined;
  const releases = stream ? getStreamReleases(stream) : [];

  const filteredReleases = useMemo(
    () => filterReleases(releases, filter),
    [releases, filter],
  );

  const pagination = useListPagination(filteredReleases, {
    initialPageSize: 10,
    resetKey: filter,
  });

  if (!stream || !meta) {
    return (
      <EmptyState
        title="Stream not found"
        description="The release stream you're looking for doesn't exist."
      />
    );
  }

  if (releases.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <StreamBadge stream={stream} size="lg" />
          <h1 className="text-3xl font-bold font-heading text-foreground mt-4 mb-2">
            {meta.label}
          </h1>
          <p className="text-muted-foreground mb-8">{meta.description}</p>
        </motion.div>
        <EmptyState
          icon={Clock}
          title="Coming Soon"
          description={`No releases published yet for the ${meta.label} stream. Check back soon!`}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <StreamBadge stream={stream} size="lg" />
            <h1 className="text-3xl font-bold font-heading text-foreground mt-3 mb-1">
              {meta.label} Releases
            </h1>
            <p className="text-muted-foreground">{meta.description}</p>
          </div>
          {meta.npmUrl && (
            <a
              href={meta.npmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              npm <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <FilterChips activeFilter={filter} onFilterChange={(id) => setFilter(id as ReleaseFilterId)} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {filteredReleases.length > 0 ? (
          <>
            <ReleaseTimeline releases={pagination.pageItems} />
            <ReleaseListPagination
              total={pagination.total}
              page={pagination.page}
              totalPages={pagination.totalPages}
              pageSize={pagination.pageSize}
              rangeStart={pagination.rangeStart}
              rangeEnd={pagination.rangeEnd}
              pageSizeOptions={pagination.pageSizeOptions}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </>
        ) : (
          <EmptyState
            title="No matching releases"
            description="Try changing the filter to see more releases."
          />
        )}
      </motion.div>
    </div>
  );
}
