import { Link, useParams } from 'react-router-dom';
import type { Commit } from '../../types';
import { TYPE_COLORS } from '../../types';
import styles from './detail.module.css';

interface CommitDetailProps {
  commits: Commit[];
}

export function CommitDetail({ commits }: CommitDetailProps) {
  const { hash = '' } = useParams();
  const commit = commits.find((item) => item.hash === hash || item.fullHash.startsWith(hash));

  if (!commit) {
    return (
      <div className={styles.missing}>
        <p>Commit <code>{hash}</code> was not found.</p>
        <Link to="/commits" className={styles.missingLink}>
          Back to commit log
        </Link>
      </div>
    );
  }

  return (
    <article className={styles.detail}>
      <Link to="/commits" className={styles.back}>
        ← Back to commits
      </Link>

      <header className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.badge} style={{ backgroundColor: TYPE_COLORS[commit.type] }}>
            {commit.type}
          </span>
          <span className={styles.scope}>{commit.scope}</span>
          <code className={styles.scope}>{commit.hash}</code>
        </div>
        <h1 className={styles.subject}>{commit.subject}</h1>
        <div className={styles.meta}>
          <span>
            <strong>{commit.author}</strong> · {commit.email}
          </span>
          <span>
            <strong>{commit.date}</strong> · {commit.week}
          </span>
          <span>
            <strong>{commit.filesChanged}</strong> files
          </span>
          <span>
            <strong style={{ color: '#1D9E75' }}>+{commit.insertions}</strong>
            {' / '}
            <strong style={{ color: '#D85A30' }}>-{commit.deletions}</strong>
          </span>
        </div>
      </header>

      {commit.body ?
        <section className={styles.body}>
          <h2 className={styles.bodyTitle}>Message body</h2>
          <p className={styles.bodyText}>{commit.body}</p>
        </section>
      : null}

      {commit.files.length > 0 ?
        <section className={styles.files}>
          <h2 className={styles.filesTitle}>Changed files ({commit.files.length})</h2>
          <ul className={styles.fileList}>
            {commit.files.map((file) => (
              <li key={file} className={styles.fileItem}>
                {file}
              </li>
            ))}
          </ul>
        </section>
      : null}
    </article>
  );
}
