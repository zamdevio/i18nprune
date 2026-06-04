import DashboardSearch from '@/features/search/dashboard';
import LatestReleaseCard from '@/features/release/latest';
import ReleaseListPagination from '@/components/ReleaseListPagination';
import ReleaseTimeline from '@/features/release/timeline';
import { useListPagination } from '@/hooks/useListPagination';
import { getCombinedTimeline, getLatestRelease } from '@/features/catalog';
import { STREAM_IDS } from '@/features/catalog/streams';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function Dashboard() {
  const timeline = getCombinedTimeline();
  const pagination = useListPagination(timeline, { initialPageSize: 10 });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10 sm:mb-14"
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-primary">Release portal</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-heading text-foreground mb-3">
          i18nprune Releases
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Track every version across the CLI, Core SDK, and VS Code Extension.
          Each stream has its own versioning and release cadence.
        </p>
        <DashboardSearch />
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-12"
      >
        <h2 className="text-lg font-semibold font-heading text-foreground mb-5">Latest releases</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STREAM_IDS.map((id) => (
            <LatestReleaseCard key={id} streamId={id} release={getLatestRelease(id)} />
          ))}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold font-heading text-foreground mb-5">All releases</h2>
        <ReleaseTimeline releases={pagination.pageItems} showStream />
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
      </motion.section>
    </div>
  );
}
