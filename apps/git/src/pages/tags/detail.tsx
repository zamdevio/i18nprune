import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { Check, Copy, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { FileDiffStat } from '../../components/commit/file-diff-stat';
import { MetricCard } from '../../components';
import type { Author, Commit, GitTag } from '../../types';
import { TYPE_COLORS } from '../../types';
import {
  authorInitials,
  authorProfilePath,
  authorUsername,
  findAuthorForCommit,
} from '../../lib/authors';
import { copyText } from '../../lib/clipboard';
import { commitGitHubUrl } from '../../lib/github';
import { findTagByName, tagNeighbors, tagProfilePath } from '../../lib/tags';
import styles from './detail.module.css';

interface TagDetailProps {
  tags: GitTag[];
  commits: Commit[];
  authors: Author[];
  githubRepoUrl: string | null;
}

export function TagDetail({ tags, commits, authors, githubRepoUrl }: TagDetailProps) {
  const { name = '' } = useParams();
  const [copied, setCopied] = useState(false);
  const tag = findTagByName(tags, name);

  if (!tag) {
    return (
      <div className={styles.missing}>
        <p>
          Tag <code>{decodeURIComponent(name)}</code> was not found.
        </p>
        <Link to="/tags" className={styles.missingLink}>
          Back to tags
        </Link>
      </div>
    );
  }

  const commit = commits.find(
    (item) => item.fullHash === tag.hash || item.hash === tag.shortHash,
  );
  const author = commit ? findAuthorForCommit(authors, commit) : undefined;
  const neighbors = tagNeighbors(tags, tag.name);
  const githubUrl = commitGitHubUrl(githubRepoUrl, tag.hash);
  const releaseUrl =
    githubRepoUrl ? `${githubRepoUrl}/releases/tag/${encodeURIComponent(tag.name)}` : null;
  const fileStats =
    commit?.fileStats?.length ?
      commit.fileStats
    : commit?.files.map((path) => ({ path, insertions: 0, deletions: 0 })) ?? [];

  const handleCopyHash = async (): Promise<void> => {
    const ok = await copyText(tag.hash);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <Link to="/tags" className={styles.back}>
          ← Back to tags
        </Link>
        <div className={styles.nav}>
          {neighbors.prev ?
            <Link to={tagProfilePath(neighbors.prev.name)} className={styles.navLink}>
              <ChevronLeft size={16} aria-hidden />
              {neighbors.prev.name}
            </Link>
          : <span className={styles.navDisabled}>Previous tag</span>}
          {neighbors.next ?
            <Link to={tagProfilePath(neighbors.next.name)} className={styles.navLink}>
              {neighbors.next.name}
              <ChevronRight size={16} aria-hidden />
            </Link>
          : <span className={styles.navDisabled}>Next tag</span>}
        </div>
      </div>

      <header className={styles.hero}>
        <div className={styles.heroBody}>
          <p className={styles.kicker}>Git tag</p>
          <h1 className={styles.name}>{tag.name}</h1>
          <p className={styles.subject}>{tag.subject}</p>
          <div className={styles.heroLinks}>
            <Link to={`/commits/${tag.shortHash}`} className={styles.heroLink}>
              View commit {tag.shortHash}
            </Link>
            {releaseUrl ?
              <a
                href={releaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.heroLink}
              >
                GitHub release
                <ExternalLink size={14} aria-hidden />
              </a>
            : null}
            {githubUrl ?
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.heroLink}
              >
                Commit on GitHub
                <ExternalLink size={14} aria-hidden />
              </a>
            : null}
            <span className={styles.span}>Tagged {tag.date}</span>
          </div>
        </div>
      </header>

      {commit ?
        <>
          <div className={styles.metricGrid}>
            <MetricCard value={tag.shortHash} label="Commit" />
            <MetricCard value={String(commit.filesChanged)} label="Files changed" />
            <MetricCard value={`+${commit.insertions}`} label="Lines added" tone="add" />
            <MetricCard value={`-${commit.deletions}`} label="Lines removed" tone="del" />
            <MetricCard
              value={`${commit.insertions - commit.deletions >= 0 ? '+' : ''}${commit.insertions - commit.deletions}`}
              label="Net lines"
              tone={commit.insertions - commit.deletions >= 0 ? 'add' : 'del'}
            />
            <MetricCard value={commit.scope} label="Scope" />
          </div>

          <section className={styles.commitCard}>
            <div className={styles.titleRow}>
              <span className={styles.badge} style={{ backgroundColor: TYPE_COLORS[commit.type] }}>
                {commit.type}
              </span>
              <code className={styles.hash}>{tag.hash}</code>
              <button type="button" className={styles.iconBtn} onClick={() => void handleCopyHash()}>
                {copied ?
                  <Check size={14} aria-hidden />
                : <Copy size={14} aria-hidden />}
                {copied ? 'Copied' : 'Copy hash'}
              </button>
            </div>
            <div className={styles.authorMeta}>
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
            </div>
          </section>

          {commit.body ?
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Message body</h2>
              <p className={styles.bodyText}>{commit.body}</p>
            </section>
          : null}

          {fileStats.length > 0 ?
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Changed files ({fileStats.length})</h2>
              <FileDiffStat
                stats={fileStats}
                repoUrl={githubRepoUrl}
                commitHash={commit.fullHash}
              />
            </section>
          : null}
        </>
      : <section className={styles.section}>
          <p className={styles.bodyText}>
            Tagged commit is not in the synced log.{' '}
            {githubUrl ?
              <a href={githubUrl} target="_blank" rel="noopener noreferrer" className={styles.heroLink}>
                Open on GitHub
              </a>
            : null}
          </p>
        </section>
      }
    </div>
  );
}
