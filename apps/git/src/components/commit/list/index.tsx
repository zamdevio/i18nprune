import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMobileLayout } from '../../../hooks/useMediaQuery';
import type { Commit } from '../../../types';
import { TYPE_COLORS } from '../../../types';
import {
  CommitPreviewLayer,
  computePreviewPosition,
  type PreviewAnchor,
} from '../preview';
import styles from './index.module.css';

export interface CommitListProps {
  commits: Commit[];
  emptyMessage?: string;
  footer?: ReactNode;
  className?: string;
}

const HOVER_DELAY_MS = 180;
const DEFAULT_EMPTY = 'No commits to show.';

export function CommitList({
  commits,
  emptyMessage = DEFAULT_EMPTY,
  footer,
  className,
}: CommitListProps) {
  const navigate = useNavigate();
  const isMobile = useMobileLayout();
  const [preview, setPreview] = useState<PreviewAnchor | null>(null);
  const hoverTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current);
    };
  }, []);

  const clearHoverTimer = (): void => {
    if (hoverTimer.current !== null) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  const handleRowEnter = (commit: Commit, row: HTMLElement): void => {
    clearHoverTimer();
    hoverTimer.current = window.setTimeout(() => {
      const { top, left } = computePreviewPosition(row);
      setPreview({ commit, top, left });
    }, HOVER_DELAY_MS);
  };

  const handleRowLeave = (): void => {
    clearHoverTimer();
    setPreview(null);
  };

  const rootClass = [styles.root, className].filter(Boolean).join(' ');

  if (commits.length === 0) {
    return (
      <div className={rootClass}>
        <p className={styles.empty}>{emptyMessage}</p>
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    );
  }

  return (
    <div className={rootClass}>
      {isMobile ?
        <ul className={styles.mobileList}>
          {commits.map((commit) => (
            <li key={commit.hash}>
              <Link to={`/commits/${commit.hash}`} className={styles.mobileCard}>
                <div className={styles.mobileCardTop}>
                  <span className={styles.date}>{commit.date}</span>
                  <span
                    className={styles.badge}
                    style={{ backgroundColor: TYPE_COLORS[commit.type] }}
                  >
                    {commit.type}
                  </span>
                </div>
                <p className={styles.mobileSubject}>{commit.subject}</p>
                <span className={styles.scope}>{commit.scope}</span>
              </Link>
            </li>
          ))}
        </ul>
      : <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Scope</th>
                <th>Subject</th>
              </tr>
            </thead>
            <tbody>
              {commits.map((commit) => (
                <tr
                  key={commit.hash}
                  className={styles.row}
                  tabIndex={0}
                  role="link"
                  aria-label={`View commit ${commit.subject}`}
                  onMouseEnter={(event) => handleRowEnter(commit, event.currentTarget)}
                  onMouseLeave={handleRowLeave}
                  onFocus={(event) => handleRowEnter(commit, event.currentTarget)}
                  onBlur={handleRowLeave}
                  onClick={(event) => {
                    if (
                      event.target instanceof HTMLElement &&
                      event.target.closest('a')
                    ) {
                      return;
                    }
                    navigate(`/commits/${commit.hash}`);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(`/commits/${commit.hash}`);
                    }
                  }}
                >
                  <td className={styles.date}>{commit.date}</td>
                  <td>
                    <span
                      className={styles.badge}
                      style={{ backgroundColor: TYPE_COLORS[commit.type] }}
                    >
                      {commit.type}
                    </span>
                  </td>
                  <td className={styles.scope}>{commit.scope}</td>
                  <td className={styles.subject}>
                    <Link to={`/commits/${commit.hash}`} className={styles.rowLink}>
                      {commit.subject}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }

      {!isMobile ?
        <CommitPreviewLayer anchor={preview} />
      : null}

      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </div>
  );
}
