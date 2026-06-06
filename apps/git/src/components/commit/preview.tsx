import type { Commit } from '../../types';
import { TYPE_COLORS } from '../../types';
import styles from './preview.module.css';

interface CommitPreviewProps {
  commit: Commit;
  top: number;
  left: number;
}

export function CommitPreview({ commit, top, left }: CommitPreviewProps) {
  const bodyPreview = commit.body.trim().split('\n').slice(0, 3).join('\n');

  return (
    <div
      className={styles.preview}
      style={{ top: `${top}px`, left: `${left}px` }}
      role="tooltip"
    >
      <div className={styles.header}>
        <span className={styles.badge} style={{ backgroundColor: TYPE_COLORS[commit.type] }}>
          {commit.type}
        </span>
        <span className={styles.scope}>{commit.scope}</span>
        <code className={styles.hash}>{commit.hash}</code>
      </div>
      <p className={styles.subject}>{commit.subject}</p>
      <dl className={styles.meta}>
        <div>
          <dt>Author</dt>
          <dd>{commit.author}</dd>
        </div>
        <div>
          <dt>Date</dt>
          <dd>{commit.date}</dd>
        </div>
        <div>
          <dt>Changes</dt>
          <dd>
            <span className={styles.add}>+{commit.insertions}</span>
            {' / '}
            <span className={styles.del}>-{commit.deletions}</span>
            {' · '}
            {commit.filesChanged} files
          </dd>
        </div>
      </dl>
      {bodyPreview ?
        <p className={styles.body}>{bodyPreview}</p>
      : null}
      <p className={styles.hint}>Click to open full commit</p>
    </div>
  );
}

export interface PreviewAnchor {
  commit: Commit;
  top: number;
  left: number;
}

interface CommitPreviewLayerProps {
  anchor: PreviewAnchor | null;
}

export function CommitPreviewLayer({ anchor }: CommitPreviewLayerProps) {
  if (!anchor) return null;
  return <CommitPreview commit={anchor.commit} top={anchor.top} left={anchor.left} />;
}

export function computePreviewPosition(
  row: HTMLElement,
  previewWidth = 360,
): { top: number; left: number } {
  const rect = row.getBoundingClientRect();
  const padding = 12;
  let left = rect.left + rect.width / 2 - previewWidth / 2;
  left = Math.max(padding, Math.min(left, window.innerWidth - previewWidth - padding));

  let top = rect.bottom + 8;
  const estimatedHeight = 220;
  if (top + estimatedHeight > window.innerHeight - padding) {
    top = rect.top - estimatedHeight - 8;
  }

  return { top: Math.max(padding, top), left };
}
