import type { FileStat } from '../../../types';
import { commitFileBlobUrl } from '../../../lib/github';
import styles from './index.module.css';

interface FileDiffStatProps {
  stats: FileStat[];
  repoUrl?: string | null;
  commitHash?: string;
}

const MAX_BAR_CHARS = 40;

function buildBar(stat: FileStat, maxTotal: number): { plus: string; minus: string } {
  const total = stat.insertions + stat.deletions;
  if (total === 0 || maxTotal === 0) {
    return { plus: '', minus: '' };
  }
  const barLen = Math.max(1, Math.round((total / maxTotal) * MAX_BAR_CHARS));
  const plusLen =
    stat.insertions > 0 ? Math.max(1, Math.round((stat.insertions / total) * barLen)) : 0;
  const minusLen = barLen - plusLen;
  return {
    plus: '+'.repeat(plusLen),
    minus: '-'.repeat(minusLen),
  };
}

export function FileDiffStat({ stats, repoUrl = null, commitHash = '' }: FileDiffStatProps) {
  const maxTotal = Math.max(...stats.map((item) => item.insertions + item.deletions), 1);

  return (
    <div className={styles.list}>
      {stats.map((stat) => {
        const bar = buildBar(stat, maxTotal);
        const fileUrl = commitFileBlobUrl(repoUrl, commitHash, stat.path);
        return (
          <div key={stat.path} className={styles.row}>
            {fileUrl ?
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.pathLink}
                title={stat.path}
              >
                {stat.path}
              </a>
            : <span className={styles.path} title={stat.path}>
                {stat.path}
              </span>
            }
            <span className={styles.sep} aria-hidden>
              |
            </span>
            <span className={styles.bar} aria-hidden>
              <span className={styles.plus}>{bar.plus}</span>
              <span className={styles.minus}>{bar.minus}</span>
            </span>
            <span className={styles.counts}>
              {stat.insertions > 0 ?
                <span className={styles.add}>+{stat.insertions}</span>
              : null}
              {stat.deletions > 0 ?
                <span className={styles.del}>-{stat.deletions}</span>
              : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}
