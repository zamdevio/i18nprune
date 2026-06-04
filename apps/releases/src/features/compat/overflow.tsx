import { useState, type ReactNode } from 'react';
import StreamBadge from '@/features/release/StreamBadge';
import type { StreamId } from '@/types';
import { Link } from 'react-router-dom';

export const DEFAULT_MAX_VISIBLE = 4;

type CompatExpandControlsProps = {
  expanded: boolean;
  hiddenCount: number;
  onExpand: () => void;
  onCollapse: () => void;
  className?: string;
};

export function CompatExpandControls({
  expanded,
  hiddenCount,
  onExpand,
  onCollapse,
  className = '',
}: CompatExpandControlsProps) {
  if (hiddenCount <= 0) return null;

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={onExpand}
        className={`text-sm font-medium text-primary hover:underline ${className}`.trim()}
      >
        +{hiddenCount} more
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onCollapse}
      className={`text-sm font-medium text-primary hover:underline ${className}`.trim()}
    >
      Show less
    </button>
  );
}

type CompatVersionLinksProps = {
  stream: StreamId;
  versions: string[];
  versionKind: 'exact' | 'minimum';
  maxVisible?: number;
  showBadge?: boolean;
};

function versionLabel(version: string, kind: 'exact' | 'minimum') {
  return kind === 'minimum' ? `≥ v${version}` : `v${version}`;
}

export function CompatVersionLinks({
  stream,
  versions,
  versionKind,
  maxVisible = DEFAULT_MAX_VISIBLE,
  showBadge = true,
}: CompatVersionLinksProps) {
  const [expanded, setExpanded] = useState(false);
  const hiddenCount = Math.max(0, versions.length - maxVisible);
  const shown = expanded ? versions : versions.slice(0, maxVisible);

  if (versions.length === 0) return null;

  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      {shown.map((v, i) => (
        <span key={v} className="inline-flex items-center gap-x-2">
          {i > 0 && <span className="text-muted-foreground/50">·</span>}
          <Link
            to={`/${stream}/${v}`}
            className="inline-flex items-center gap-1.5 font-mono text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            {showBadge && <StreamBadge stream={stream} />}
            <span>{versionLabel(v, versionKind)}</span>
          </Link>
        </span>
      ))}
      <CompatExpandControls
        expanded={expanded}
        hiddenCount={hiddenCount}
        onExpand={() => setExpanded(true)}
        onCollapse={() => setExpanded(false)}
      />
    </span>
  );
}

type CompatRowListProps<T> = {
  items: T[];
  maxVisible?: number;
  renderItem: (item: T) => ReactNode;
  rowKey: (item: T) => string;
};

export function CompatRowList<T>({
  items,
  maxVisible = DEFAULT_MAX_VISIBLE,
  renderItem,
  rowKey,
}: CompatRowListProps<T>) {
  const [expanded, setExpanded] = useState(false);
  const hiddenCount = Math.max(0, items.length - maxVisible);
  const shown = expanded ? items : items.slice(0, maxVisible);

  return (
    <>
      <div className="space-y-3">
        {shown.map((item) => (
          <div key={rowKey(item)}>{renderItem(item)}</div>
        ))}
      </div>
      <CompatExpandControls
        expanded={expanded}
        hiddenCount={hiddenCount}
        onExpand={() => setExpanded(true)}
        onCollapse={() => setExpanded(false)}
        className="mt-3 block"
      />
    </>
  );
}
