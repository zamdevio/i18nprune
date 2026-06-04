import CompareDiffView from '@/features/compare/CompareDiffView';
import EmptyState from '@/components/EmptyState';
import StreamBadge from '@/features/release/StreamBadge';
import { useCompareSelection } from '@/hooks/useCompareSelection';
import { compareReleases } from '@/features/compare/releases';
import { getRelease, getStreamReleases } from '@/features/catalog';
import { isStreamId, STREAM_META } from '@/features/catalog/streams';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowLeftRight, ArrowRight, GitCompare } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

export default function ComparePage() {
  const { stream: streamParam } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const stream = isStreamId(streamParam) ? streamParam : undefined;
  const meta = stream ? STREAM_META[stream] : undefined;
  const releases = stream ? getStreamReleases(stream) : [];
  const versions = releases.map((r) => r.version);

  const selection = useCompareSelection({
    versions,
    fromParam: searchParams.get('from'),
    toParam: searchParams.get('to'),
    onSyncUrl: (from, to) => setSearchParams({ from, to }, { replace: true }),
  });

  const compare = useMemo(() => {
    if (!stream || !selection.isValidPair) return null;
    const from = getRelease(stream, selection.fromVersion);
    const to = getRelease(stream, selection.toVersion);
    if (!from || !to) return null;
    return compareReleases(from, to);
  }, [stream, selection.fromVersion, selection.toVersion, selection.isValidPair]);

  if (!stream || !meta) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <EmptyState
          title="Stream not found"
          description="Use Compare in the header to pick CLI, Core, or Extension."
        />
      </div>
    );
  }

  if (versions.length < 2) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
        <Link
          to={`/${stream}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to {meta.label}
        </Link>
        <EmptyState
          title="Need at least two releases"
          description="This stream does not have enough versions to compare yet."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
      <Link
        to={`/${stream}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to {meta.label}
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-2">
          <GitCompare className="h-5 w-5 text-primary" />
          <StreamBadge stream={stream} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-foreground mb-2">
          Compare {meta.label}
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Diff from the first version to the second — changelog, highlights, and migration notes.
        </p>
      </motion.div>

      <div className="flex flex-wrap items-end gap-3 mb-8 p-4 rounded-lg border border-border bg-card">
        <label className="flex flex-col gap-1.5 text-sm min-w-[9rem] flex-1 sm:flex-none">
          <span className="text-muted-foreground font-medium">From</span>
          <select
            value={selection.fromVersion}
            onChange={(e) => selection.setFrom(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {selection.fromOptions.map((v) => (
              <option key={v} value={v}>
                v{v}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={selection.swap}
          className="mb-0.5 p-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Swap versions"
          title="Swap versions"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </button>

        <label className="flex flex-col gap-1.5 text-sm min-w-[9rem] flex-1 sm:flex-none">
          <span className="text-muted-foreground font-medium">To</span>
          <select
            value={selection.toVersion}
            onChange={(e) => selection.setTo(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {selection.toOptions.map((v) => (
              <option key={v} value={v}>
                v{v}
              </option>
            ))}
          </select>
        </label>

        <div className="hidden sm:flex items-center text-muted-foreground pb-2">
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>

      {!selection.isValidPair ? (
        <EmptyState
          title="Pick two different versions"
          description="Choose two different versions to diff."
        />
      ) : !compare ? (
        <EmptyState title="Releases not found" description="Selected versions are missing from the catalog." />
      ) : !compare.hasChanges ? (
        <div className="rounded-lg border border-border bg-muted/30 p-8 text-center">
          <p className="text-sm text-foreground font-medium mb-1">No differences</p>
          <p className="text-sm text-muted-foreground">
            v{selection.fromVersion} and v{selection.toVersion} match on summary, highlights, migration,
            and changelog sections.
          </p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <CompareDiffView stream={stream} result={compare} />
        </motion.div>
      )}
    </div>
  );
}
