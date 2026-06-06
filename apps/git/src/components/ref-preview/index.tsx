import type { ReactNode } from 'react';
import type { GitBranch, GitTag } from '../../types';
import { formatNumber } from '../../lib/format';
import styles from './index.module.css';

interface FloatingPreviewProps {
  top: number;
  left: number;
  children: ReactNode;
}

function FloatingPreview({ top, left, children }: FloatingPreviewProps) {
  return (
    <div className={styles.preview} style={{ top: `${top}px`, left: `${left}px` }} role="tooltip">
      {children}
    </div>
  );
}

interface TagPreviewProps {
  tag: GitTag;
  top: number;
  left: number;
}

export function TagPreview({ tag, top, left }: TagPreviewProps) {
  return (
    <FloatingPreview top={top} left={left}>
      <p className={styles.kicker}>Git tag</p>
      <p className={styles.title}>{tag.name}</p>
      <p className={styles.subject}>{tag.subject}</p>
      <dl className={styles.meta}>
        <div>
          <dt>Date</dt>
          <dd>{tag.date}</dd>
        </div>
        <div>
          <dt>Commit</dt>
          <dd className={styles.mono}>{tag.shortHash}</dd>
        </div>
      </dl>
      <p className={styles.hint}>Click to open tag</p>
    </FloatingPreview>
  );
}

interface BranchPreviewProps {
  branch: GitBranch;
  top: number;
  left: number;
}

export function BranchPreview({ branch, top, left }: BranchPreviewProps) {
  return (
    <FloatingPreview top={top} left={left}>
      <p className={styles.kicker}>
        Branch
        {branch.isCurrent ?
          <span className={styles.badge}>Current</span>
        : null}
      </p>
      <p className={styles.title}>{branch.name}</p>
      <p className={styles.subject}>{branch.subject}</p>
      <dl className={styles.meta}>
        <div>
          <dt>Tip date</dt>
          <dd>{branch.date}</dd>
        </div>
        <div>
          <dt>Commits</dt>
          <dd>{branch.totalCommits}</dd>
        </div>
        <div>
          <dt>Contributors</dt>
          <dd>{branch.authors}</dd>
        </div>
        <div>
          <dt>Net lines</dt>
          <dd>
            <span className={branch.netLines >= 0 ? styles.add : styles.del}>
              {branch.netLines >= 0 ? '+' : ''}
              {formatNumber(branch.netLines)}
            </span>
          </dd>
        </div>
      </dl>
      <p className={styles.hint}>Click to open branch</p>
    </FloatingPreview>
  );
}

export { computePreviewPosition } from '../commit/preview';
