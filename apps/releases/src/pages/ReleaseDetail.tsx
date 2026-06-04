import React from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { ArrowLeft, Tag, ExternalLink, Calendar } from "lucide-react";
import StreamBadge from "@/features/release/StreamBadge";
import StatusBadge from "@/features/release/StatusBadge";
import InstallTabs from '@/features/release/install';
import ReleaseCompatibility from '@/features/compat/release';
import { installTargetFromRelease } from '@/lib/install-snippets';
import ReleaseSectionList from '@/features/release/list';
import MigrationCallout from "@/features/release/migration";
import BreakingBanner from "@/features/release/breaking";
import EmptyState from "@/components/EmptyState";
import { getRelease } from '@/features/catalog';
import { isStreamId, STREAM_META } from '@/features/catalog/streams';

export default function ReleaseDetail() {
  const { stream: streamParam, version } = useParams();
  const stream = isStreamId(streamParam) ? streamParam : undefined;
  const meta = stream ? STREAM_META[stream] : undefined;
  const release = stream && version ? getRelease(stream, version) : null;

  if (!release || !meta || !stream) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <Link to={stream ? `/${stream}` : "/"} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to {meta?.label || "releases"}
        </Link>
        <EmptyState
          title="Release not found"
          description={`Version ${version || "unknown"} doesn't exist in the ${meta?.label || stream} stream.`}
        />
      </div>
    );
  }

  const breakingCount = release.sections?.breaking?.length || 0;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
      {/* Back link */}
      <Link
        to={`/${stream}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to {meta.label}
      </Link>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <StreamBadge stream={stream} size="lg" />
          <StatusBadge status={release.status} />
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold font-heading text-foreground mb-2">
          v{release.version}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {format(new Date(release.date), "MMMM d, yyyy")}
          </span>
          {release.git?.tag && (
            <span className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              {release.git.tag}
            </span>
          )}
        </div>

        <p className="text-base sm:text-lg text-foreground/80 leading-relaxed max-w-3xl">
          {release.summary}
        </p>
      </motion.div>

      {/* Install snippet */}
      {release.npm?.package && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mb-8"
        >
          <h2 className="text-sm font-semibold text-foreground mb-3">Install</h2>
          <InstallTabs
            target={installTargetFromRelease(release.npm, release.version)}
          />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.07 }}
        className="mb-8"
      >
        <ReleaseCompatibility stream={stream} version={release.version} />
      </motion.div>

      {/* Breaking banner */}
      {breakingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="mb-8"
        >
          <BreakingBanner count={breakingCount} />
        </motion.div>
      )}

      {/* Highlights */}
      {(release.highlights?.length ?? 0) > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-sm font-semibold text-foreground mb-3">Highlights</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(release.highlights ?? []).map((h, i) => (
              <div key={i} className="flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2.5">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span className="text-sm text-foreground/90">{h}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Changelog sections */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mb-8 rounded-lg border border-border bg-card p-5 sm:p-6"
      >
        <h2 className="text-base font-semibold text-foreground mb-5">Changes</h2>
        <ReleaseSectionList sections={release.sections} />
      </motion.div>

      {/* Migration */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mb-8"
      >
        <MigrationCallout migration={release.migration} />
      </motion.div>

      {/* Links */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="flex flex-wrap gap-3"
      >
        {release.npm?.package && (
          <a
            href={`https://www.npmjs.com/package/${release.npm.package}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-muted text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            npm Package <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {release.git?.githubReleaseUrl && (
          <a
            href={release.git.githubReleaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-muted text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            GitHub Release <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </motion.div>
    </div>
  );
}
