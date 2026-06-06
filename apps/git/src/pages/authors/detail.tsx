import { Link, useParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import { CommitList, MetricCard, ScopeBreakdown, TypeBreakdown } from '../../components';
import type { Author, Commit } from '../../types';
import { buildAuthorProfile, findAuthorByUsername, authorInitials } from '../../lib/authors';
import { formatNumber, formatPeakDay } from '../../lib/format';
import styles from './detail.module.css';

interface AuthorDetailProps {
  authors: Author[];
  commits: Commit[];
}

function recentCommitsFooter(
  author: Author,
  shown: number,
): ReactNode | undefined {
  if (author.commits === 0) return undefined;
  if (author.commits > shown) {
    return (
      <p className={styles.more}>
        Showing latest {shown} of {author.commits} commits.{' '}
        <Link to={`/commits?q=${encodeURIComponent(author.email)}`} className={styles.moreLink}>
          Search all by email
        </Link>
      </p>
    );
  }
  return <p className={styles.moreMuted}>Showing all {author.commits} commits.</p>;
}

export function AuthorDetail({ authors, commits }: AuthorDetailProps) {
  const { username = '' } = useParams();
  const author = findAuthorByUsername(authors, username);

  if (!author) {
    return (
      <div className={styles.missing}>
        <p>
          Contributor <code>{username}</code> was not found.
        </p>
        <Link to="/authors" className={styles.missingLink}>
          Back to authors
        </Link>
      </div>
    );
  }

  const profile = buildAuthorProfile(author, commits);
  const recentCount = profile.recentCommits.length;

  return (
    <div className={styles.page}>
      <Link to="/authors" className={styles.back}>
        ← Back to authors
      </Link>

      <header className={styles.hero}>
        {author.avatarUrl ?
          <img
            className={styles.avatarImage}
            src={author.avatarUrl}
            alt=""
            width={88}
            height={88}
          />
        : <div className={styles.avatar} aria-hidden>
            {authorInitials(author.displayName)}
          </div>
        }
        <div className={styles.heroBody}>
          <h1 className={styles.name}>{author.displayName}</h1>
          <p className={styles.gitIdentity}>
            {author.displayName !== author.name ?
              <>Git author: {author.name} · </>
            : null}
            {author.email}
          </p>
          {author.bio ?
            <p className={styles.bio}>{author.bio}</p>
          : null}
          <div className={styles.heroLinks}>
            <a
              href={author.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.githubLink}
            >
              View on GitHub
              {author.githubLogin ?
                <span className={styles.githubLogin}>@{author.githubLogin}</span>
              : null}
              <ExternalLink size={14} aria-hidden />
            </a>
            {author.followers !== null ?
              <span className={styles.span}>{formatNumber(author.followers)} followers</span>
            : null}
            {author.following !== null ?
              <span className={styles.span}>{formatNumber(author.following)} following</span>
            : null}
            <span className={styles.span}>
              Active {author.firstCommit} → {author.lastCommit}
            </span>
          </div>
        </div>
      </header>

      <div className={styles.metricGrid}>
        <MetricCard value={String(author.commits)} label="Total commits" />
        <MetricCard value={`+${formatNumber(author.insertions)}`} label="Lines added" tone="add" />
        <MetricCard value={`-${formatNumber(author.deletions)}`} label="Lines removed" tone="del" />
        <MetricCard
          value={`${profile.netLines >= 0 ? '+' : ''}${formatNumber(profile.netLines)}`}
          label="Net lines"
          tone={profile.netLines >= 0 ? 'add' : 'del'}
        />
        <MetricCard value={String(profile.activeDays)} label="Active days" />
        <MetricCard value={String(profile.weeksActive)} label="Active weeks" />
        {profile.peakCommitDay ?
          <MetricCard
            value={`${formatPeakDay(profile.peakCommitDay.date)} — ${profile.peakCommitDay.count}`}
            label="Peak day commits"
          />
        : null}
        {profile.topScope ?
          <MetricCard
            value={`${profile.topScope.scope} (${profile.topScope.count})`}
            label="Top scope"
          />
        : null}
        <div className={styles.metricWide}>
          <MetricCard
            value={String(profile.avgCommitsPerActiveDay)}
            label="Avg commits / active day"
          />
        </div>
        <div className={styles.metricWide}>
          <MetricCard
            value={`${author.firstCommit} → ${author.lastCommit}`}
            label="Contribution span"
          />
        </div>
      </div>

      <section className={`pageSection ${styles.chartRow}`}>
        <TypeBreakdown data={profile.typeBreakdown} />
        <ScopeBreakdown data={profile.scopeBreakdown} />
      </section>

      <section className={styles.recent}>
        <h2 className={styles.sectionTitle}>Recent commits</h2>
        <CommitList
          commits={profile.recentCommits}
          emptyMessage="No commits recorded for this contributor."
          footer={recentCommitsFooter(author, recentCount)}
        />
      </section>
    </div>
  );
}
