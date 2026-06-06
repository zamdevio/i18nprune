import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, Copy, ExternalLink, GitBranch as GitBranchIcon, Tag } from 'lucide-react';
import { FileDiffStat } from '../../components/commit/file-diff-stat';
import {
  authorInitials,
  authorProfilePath,
  authorUsername,
  findAuthorForCommit,
} from '../../lib/authors';
import { copyText } from '../../lib/clipboard';
import { branchProfilePath, pickDisplayBranch } from '../../lib/branches';
import { commitGitHubUrl } from '../../lib/github';
import { tagProfilePath } from '../../lib/tags';
import type { Author, Commit } from '../../types';
import { TYPE_COLORS } from '../../types';
import styles from './detail.module.css';

interface CommitDetailProps {
  commits: Commit[];
  authors: Author[];
  githubRepoUrl: string | null;
}

export function CommitDetail({ commits, authors, githubRepoUrl }: CommitDetailProps) {
  const { hash = '' } = useParams();
  const [copied, setCopied] = useState(false);

  const index = commits.findIndex(
    (item) => item.hash === hash || item.fullHash.startsWith(hash),
  );
  const commit = index >= 0 ? commits[index] : undefined;

  const neighbors = useMemo(() => {
    if (index < 0) return { newer: null, older: null };
    return {
      newer: index > 0 ? commits[index - 1] : null,
      older: index < commits.length - 1 ? commits[index + 1] : null,
    };
  }, [commits, index]);

  const githubUrl = commit ? commitGitHubUrl(githubRepoUrl, commit.fullHash) : null;
  const author = commit ? findAuthorForCommit(authors, commit) : undefined;
  const displayBranch = commit ? pickDisplayBranch(commit) : null;
  const fileStats =
    commit?.fileStats?.length ?
      commit.fileStats
    : commit?.files.map((path) => ({ path, insertions: 0, deletions: 0 })) ?? [];

  const handleCopyHash = async (): Promise<void> => {
    if (!commit) return;
    const ok = await copyText(commit.fullHash);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!commit) {
    return (
      <div className={styles.missing}>
        <p>
          Commit <code>{hash}</code> was not found.
        </p>
        <Link to="/commits" className={styles.missingLink}>
          Back to commit log
        </Link>
      </div>
    );
  }

  return (
    <article className={styles.detail}>
      <div className={styles.topBar}>
        <Link to="/commits" className={styles.back}>
          ← Back to commits
        </Link>
        <div className={styles.nav}>
          {neighbors.newer ?
            <Link to={`/commits/${neighbors.newer.hash}`} className={styles.navLink}>
              <ChevronLeft size={16} aria-hidden />
              Newer
            </Link>
          : <span className={styles.navDisabled}>Newer</span>}
          {neighbors.older ?
            <Link to={`/commits/${neighbors.older.hash}`} className={styles.navLink}>
              Older
              <ChevronRight size={16} aria-hidden />
            </Link>
          : <span className={styles.navDisabled}>Older</span>}
        </div>
      </div>

      <header className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.badge} style={{ backgroundColor: TYPE_COLORS[commit.type] }}>
            {commit.type}
          </span>
          <span className={styles.scope}>{commit.scope}</span>
          <code className={styles.hash}>{commit.hash}</code>
          <button type="button" className={styles.iconBtn} onClick={() => void handleCopyHash()}>
            {copied ?
              <Check size={14} aria-hidden />
            : <Copy size={14} aria-hidden />}
            {copied ? 'Copied' : 'Copy hash'}
          </button>
          {githubUrl ?
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.iconBtn}
            >
              <ExternalLink size={14} aria-hidden />
              GitHub
            </a>
          : null}
          {displayBranch ?
            <Link to={branchProfilePath(displayBranch)} className={styles.iconBtn}>
              <GitBranchIcon size={14} aria-hidden />
              {displayBranch}
            </Link>
          : null}
          {commit.tags.map((tagName) => (
            <Link key={tagName} to={tagProfilePath(tagName)} className={styles.iconBtn}>
              <Tag size={14} aria-hidden />
              {tagName}
            </Link>
          ))}
        </div>
        <h1 className={styles.subject}>{commit.subject}</h1>
        <div className={styles.meta}>
          <span className={styles.authorMeta}>
            {author ?
              author.avatarUrl ?
                <img
                  className={styles.authorAvatar}
                  src={author.avatarUrl}
                  alt=""
                  width={28}
                  height={28}
                />
              : <span className={styles.authorAvatarFallback} aria-hidden>
                  {authorInitials(author.displayName)}
                </span>
            : null}
            <span>
              <Link
                to={authorProfilePath(authorUsername(commit.author, commit.email))}
                className={styles.authorLink}
              >
                {commit.author}
              </Link>
              {' · '}
              {commit.email}
            </span>
          </span>
          <span>
            <strong>{commit.date}</strong> · {commit.week}
          </span>
          <span>
            <strong>{commit.filesChanged}</strong> files
          </span>
          <span className={styles.diffStat}>
            <span className={styles.statAdd}>+{commit.insertions}</span>
            {' / '}
            <span className={styles.statDel}>-{commit.deletions}</span>
          </span>
        </div>
      </header>

      {commit.body ?
        <section className={styles.body}>
          <h2 className={styles.sectionTitle}>Message body</h2>
          <p className={styles.bodyText}>{commit.body}</p>
        </section>
      : null}

      {fileStats.length > 0 ?
        <section className={styles.files}>
          <h2 className={styles.sectionTitle}>Changed files ({fileStats.length})</h2>
          <FileDiffStat
            stats={fileStats}
            repoUrl={githubRepoUrl}
            commitHash={commit.fullHash}
          />
        </section>
      : null}
    </article>
  );
}
