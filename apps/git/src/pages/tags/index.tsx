import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GitTag } from '../../types';
import { useMobileLayout } from '../../hooks/useMediaQuery';
import { BranchPreview, computePreviewPosition, TagPreview } from '../../components/ref-preview';
import { tagProfilePath } from '../../lib/tags';
import styles from './index.module.css';

interface TagsPageProps {
  tags: GitTag[];
}

const HOVER_DELAY_MS = 180;

export function TagsPage({ tags }: TagsPageProps) {
  const navigate = useNavigate();
  const isMobile = useMobileLayout();
  const [preview, setPreview] = useState<{ tag: GitTag; top: number; left: number } | null>(null);
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

  const openTag = (name: string): void => {
    navigate(tagProfilePath(name));
  };

  const handleRowEnter = (tag: GitTag, row: HTMLElement): void => {
    if (isMobile) return;
    clearHoverTimer();
    hoverTimer.current = window.setTimeout(() => {
      const { top, left } = computePreviewPosition(row);
      setPreview({ tag, top, left });
    }, HOVER_DELAY_MS);
  };

  const handleRowLeave = (): void => {
    clearHoverTimer();
    setPreview(null);
  };

  return (
    <div className={styles.page}>
      <h1 className="pageTitle">Git tags</h1>
      <p className={styles.lead}>
        Version tags matching <code>v*</code> in the repository ({tags.length} total).
      </p>

      {tags.length === 0 ?
        <div className={styles.empty}>No version tags found.</div>
      : <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tag</th>
                <th>Date</th>
                <th>Commit</th>
                <th>Subject</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr
                  key={tag.name}
                  className={styles.rowClickable}
                  tabIndex={0}
                  role="link"
                  onMouseEnter={(event) => handleRowEnter(tag, event.currentTarget)}
                  onMouseLeave={handleRowLeave}
                  onFocus={(event) => handleRowEnter(tag, event.currentTarget)}
                  onBlur={handleRowLeave}
                  onClick={() => openTag(tag.name)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openTag(tag.name);
                    }
                  }}
                >
                  <td className={styles.tag}>
                    <span className={styles.tagName}>{tag.name}</span>
                  </td>
                  <td className={styles.date}>{tag.date}</td>
                  <td className={styles.hash}>
                    <span className={styles.mono}>{tag.shortHash}</span>
                  </td>
                  <td className={styles.subjectCell}>{tag.subject}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }

      {!isMobile && preview ?
        <TagPreview tag={preview.tag} top={preview.top} left={preview.left} />
      : null}
    </div>
  );
}
