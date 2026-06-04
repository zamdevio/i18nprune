/** Release detail compatibility panel (outgoing + incoming edges). */
import type { ReactNode } from 'react';
import StreamBadge from '@/features/release/StreamBadge';
import { CompatRowList, CompatVersionLinks } from '@/features/compat/overflow';
import {
  compatNoteForStream,
  getCompatContext,
  type CompatEdge,
  type OutgoingCompatGroup,
} from '@/features/compat/graph';
import type { StreamId } from '@/types';
import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';

const MAX_INCOMING_ROWS = 4;
const MAX_BUNDLED_VISIBLE = 3;
const MAX_COMPATIBLE_VISIBLE = 4;

type ReleaseCompatibilityProps = {
  stream: StreamId;
  version: string;
};

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-2">
      {children}
    </p>
  );
}

function OutgoingTargetRow({
  group,
  versionKind,
  maxVisible,
}: {
  group: OutgoingCompatGroup;
  versionKind: 'exact' | 'minimum';
  maxVisible: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm pl-0.5">
      <StreamBadge stream={group.toStream} />
      <CompatVersionLinks
        stream={group.toStream}
        versions={group.versions}
        versionKind={versionKind}
        maxVisible={maxVisible}
        showBadge={false}
      />
    </div>
  );
}

function IncomingRow({
  edge,
  targetStream,
  targetVersion,
}: {
  edge: CompatEdge;
  targetStream: StreamId;
  targetVersion: string;
}) {
  const bundled = edge.versionKind === 'exact';
  const verb = bundled ? 'bundles' : 'compatible with';
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      <Link
        to={`/${edge.fromStream}/${edge.fromVersion}`}
        className="inline-flex items-center gap-1.5 font-mono text-sm font-medium text-foreground hover:text-primary transition-colors"
      >
        <StreamBadge stream={edge.fromStream} />
        <span>v{edge.fromVersion}</span>
      </Link>
      <span className="text-muted-foreground font-medium">{verb}</span>
      <span className="inline-flex items-center gap-1.5 font-mono text-sm font-medium text-foreground">
        <StreamBadge stream={targetStream} />
        <span>
          {bundled ? `v${targetVersion}` : `≥ v${edge.toVersion}`}
        </span>
      </span>
    </div>
  );
}

export default function ReleaseCompatibility({ stream, version }: ReleaseCompatibilityProps) {
  const {
    outgoingSplit,
    incomingBundled,
    incomingCompatible,
  } = getCompatContext(stream, version);
  const note = compatNoteForStream(stream);

  const hasBundled =
    outgoingSplit.bundled.some((g) => g.versions.length > 0) || incomingBundled.length > 0;
  const hasCompatible =
    outgoingSplit.compatible.some((g) => g.versions.length > 0) ||
    incomingCompatible.length > 0;

  if (!hasBundled && !hasCompatible) {
    return null;
  }

  return (
    <aside className="rounded-lg border border-stream-core/25 bg-stream-core/5 p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1">
        <Layers className="h-4 w-4 text-stream-core" />
        Compatibility
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        Which Core (and other) versions this release ships with or supports.
      </p>

      <div className="space-y-5">
        {hasBundled && (
          <div>
            <SectionLabel>Bundles with</SectionLabel>
            <div className="space-y-2">
              {outgoingSplit.bundled.map((group) => (
                <OutgoingTargetRow
                  key={`bundled-out-${group.toStream}`}
                  group={group}
                  versionKind="exact"
                  maxVisible={MAX_BUNDLED_VISIBLE}
                />
              ))}
            </div>
            {incomingBundled.length > 0 && (
              <div className="mt-3">
                <SectionLabel>Used by (bundled)</SectionLabel>
                <CompatRowList
                  items={incomingBundled}
                  maxVisible={MAX_INCOMING_ROWS}
                  rowKey={(edge) => `in-b-${edge.fromStream}-${edge.fromVersion}`}
                  renderItem={(edge) => (
                    <IncomingRow
                      edge={edge}
                      targetStream={stream}
                      targetVersion={version}
                    />
                  )}
                />
              </div>
            )}
          </div>
        )}

        {hasCompatible && (
          <div>
            <SectionLabel>Compatible with</SectionLabel>
            <div className="space-y-2">
              {outgoingSplit.compatible.map((group) => (
                <OutgoingTargetRow
                  key={`compat-out-${group.toStream}`}
                  group={group}
                  versionKind="minimum"
                  maxVisible={MAX_COMPATIBLE_VISIBLE}
                />
              ))}
            </div>
            {incomingCompatible.length > 0 && (
              <div className="mt-3">
                <SectionLabel>Used by (compatible)</SectionLabel>
                <CompatRowList
                  items={incomingCompatible}
                  maxVisible={MAX_INCOMING_ROWS}
                  rowKey={(edge) => `in-c-${edge.fromStream}-${edge.fromVersion}`}
                  renderItem={(edge) => (
                    <IncomingRow
                      edge={edge}
                      targetStream={stream}
                      targetVersion={version}
                    />
                  )}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {note && (
        <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-stream-core/20 leading-relaxed">
          {note}
        </p>
      )}
    </aside>
  );
}
