import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GitBranch } from '../../types';
import { useMobileLayout } from '../../hooks/useMediaQuery';
import { BranchPreview, computePreviewPosition } from '../../components/ref-preview';
import { branchProfilePath } from '../../lib/branches';
import styles from '../tags/index.module.css';

interface BranchesPageProps {
  branches: GitBranch[];
}

const HOVER_DELAY_MS = 180;

export function BranchesPage({ branches }: BranchesPageProps) {
  const navigate = useNavigate();
  const isMobile = useMobileLayout();
  const [preview, setPreview] = useState<{ branch: GitBranch; top: number; left: number } | null>(
    null,
  );
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

  const openBranch = (name: string): void => {
    navigate(branchProfilePath(name));
  };

  const handleRowEnter = (branch: GitBranch, row: HTMLElement): void => {
    if (isMobile) return;
    clearHoverTimer();
    hoverTimer.current = window.setTimeout(() => {
      const { top, left } = computePreviewPosition(row);
      setPreview({ branch, top, left });
    }, HOVER_DELAY_MS);
  };

  const handleRowLeave = (): void => {
    clearHoverTimer();
    setPreview(null);
  };

  return (
    <div className={styles.page}>
      <h1 className="pageTitle">Branches</h1>
      <p className={styles.lead}>
        Local branches tracked in this repository ({branches.length} total). Current branch
        is listed first.
      </p>

      {branches.length === 0 ?
        <div className={styles.empty}>No local branches found.</div>
      : <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Branch</th>
                <th>Tip date</th>
                <th>Commit</th>
                <th>Subject</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => (
                <tr
                  key={branch.name}
                  className={styles.rowClickable}
                  tabIndex={0}
                  role="link"
                  onMouseEnter={(event) => handleRowEnter(branch, event.currentTarget)}
                  onMouseLeave={handleRowLeave}
                  onFocus={(event) => handleRowEnter(branch, event.currentTarget)}
                  onBlur={handleRowLeave}
                  onClick={() => openBranch(branch.name)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openBranch(branch.name);
                    }
                  }}
                >
                  <td className={styles.tag}>
                    <span className={styles.branchName}>{branch.name}</span>
                    {branch.isCurrent ?
                      <span className={styles.currentBadge}>Current</span>
                    : null}
                  </td>
                  <td className={styles.date}>{branch.date}</td>
                  <td className={styles.hash}>
                    <span className={styles.mono}>{branch.shortHash}</span>
                  </td>
                  <td className={styles.subjectCell}>{branch.subject}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }

      {!isMobile && preview ?
        <BranchPreview branch={preview.branch} top={preview.top} left={preview.left} />
      : null}
    </div>
  );
}
