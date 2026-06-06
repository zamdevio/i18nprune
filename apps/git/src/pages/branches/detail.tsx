import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { ListPagination } from '@i18nprune/ui/react/pagination';
import { CommitList, MetricCard, ScopeBreakdown, TypeBreakdown } from '../../components';
import { paginationNavIcons } from '../../components/icons';
import type { Author, Commit, GitBranch } from '../../types';
import { authorInitials, authorProfilePath } from '../../lib/authors';
import {
  authorsOnBranch,
  branchNeighbors,
  branchProfilePath,
  buildBranchProfile,
  findBranchByName,
} from '../../lib/branches';
import { formatNumber } from '../../lib/format';
import { commitGitHubUrl } from '../../lib/github';
import styles from './detail.module.css';

const CONTRIBUTORS_PAGE_SIZE_OPTIONS = [5, 8, 11, 15] as const;
const DEFAULT_CONTRIBUTORS_PAGE_SIZE = CONTRIBUTORS_PAGE_SIZE_OPTIONS[0];

interface BranchDetailProps {
  branches: GitBranch[];
  commits: Commit[];
  authors: Author[];
  githubRepoUrl: string | null;
}

export function BranchDetail({ branches, commits, authors, githubRepoUrl }: BranchDetailProps) {
  const { name = '' } = useParams();
  const branch = findBranchByName(branches, name);
  const [contributorPage, setContributorPage] = useState(1);
  const [contributorPageSize, setContributorPageSize] = useState<number>(DEFAULT_CONTRIBUTORS_PAGE_SIZE);

  const branchAuthors = branch ? authorsOnBranch(authors, branch) : [];

  const contributorTotalPages = Math.max(1, Math.ceil(branchAuthors.length / contributorPageSize));
  const safeContributorPage = Math.min(contributorPage, contributorTotalPages);
  const contributorRangeStart =
    branchAuthors.length === 0 ? 0 : (safeContributorPage - 1) * contributorPageSize + 1;
  const contributorRangeEnd = Math.min(safeContributorPage * contributorPageSize, branchAuthors.length);

  const pageBranchAuthors = useMemo(() => {
    const start = (safeContributorPage - 1) * contributorPageSize;
    return branchAuthors.slice(start, start + contributorPageSize);
  }, [branchAuthors, safeContributorPage, contributorPageSize]);

  useEffect(() => {
    setContributorPage(1);
  }, [name, contributorPageSize]);

  if (!branch) {
    return (
      <div className={styles.missing}>
        <p>
          Branch <code>{decodeURIComponent(name)}</code> was not found.
        </p>
        <Link to="/branches" className={styles.missingLink}>
          Back to branches
        </Link>
      </div>
    );
  }

  const profile = buildBranchProfile(branch, commits);
  const neighbors = branchNeighbors(branches, branch.name);
  const treeUrl =
    githubRepoUrl ? `${githubRepoUrl}/tree/${encodeURIComponent(branch.name)}` : null;
  const tipGithubUrl = commitGitHubUrl(githubRepoUrl, branch.hash);

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <Link to="/branches" className={styles.back}>
          ← Back to branches
        </Link>
        <div className={styles.nav}>
          {neighbors.prev ?
            <Link to={branchProfilePath(neighbors.prev.name)} className={styles.navLink}>
              <ChevronLeft size={16} aria-hidden />
              {neighbors.prev.name}
            </Link>
          : <span className={styles.navDisabled}>Previous branch</span>}
          {neighbors.next ?
            <Link to={branchProfilePath(neighbors.next.name)} className={styles.navLink}>
              {neighbors.next.name}
              <ChevronRight size={16} aria-hidden />
            </Link>
          : <span className={styles.navDisabled}>Next branch</span>}
        </div>
      </div>

      <header className={styles.hero}>
        <div className={styles.heroBody}>
          <p className={styles.kicker}>Branch</p>
          <h1 className={styles.name}>
            {branch.name}
            {branch.isCurrent ?
              <span className={styles.currentBadge}>Current</span>
            : null}
          </h1>
          <p className={styles.subject}>{branch.subject}</p>
          <div className={styles.heroLinks}>
            <Link to={`/commits/${branch.shortHash}`} className={styles.heroLink}>
              Tip commit {branch.shortHash}
            </Link>
            {treeUrl ?
              <a
                href={treeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.heroLink}
              >
                Browse on GitHub
                <ExternalLink size={14} aria-hidden />
              </a>
            : null}
            {tipGithubUrl ?
              <a
                href={tipGithubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.heroLink}
              >
                Tip on GitHub
                <ExternalLink size={14} aria-hidden />
              </a>
            : null}
            <span className={styles.span}>
              {branch.firstCommit} → {branch.lastCommit}
            </span>
          </div>
        </div>
      </header>

      <div className={styles.metricGrid}>
        <MetricCard value={String(branch.totalCommits)} label="Total commits" />
        <MetricCard value={String(branch.authors)} label="Contributors" />
        <MetricCard value={`+${formatNumber(branch.insertions)}`} label="Lines added" tone="add" />
        <MetricCard value={`-${formatNumber(branch.deletions)}`} label="Lines removed" tone="del" />
        <MetricCard
          value={`${branch.netLines >= 0 ? '+' : ''}${formatNumber(branch.netLines)}`}
          label="Net lines"
          tone={branch.netLines >= 0 ? 'add' : 'del'}
        />
        <MetricCard value={String(branch.activeDays)} label="Active days" />
        <MetricCard value={String(profile.weeksActive)} label="Active weeks" />
        <div className={styles.metricWide}>
          <MetricCard
            value={`${branch.firstCommit} → ${branch.lastCommit}`}
            label="Commit span"
          />
        </div>
      </div>

      {branchAuthors.length > 0 ?
        <section className={styles.authors}>
          <h2 className={styles.sectionTitle}>Contributors ({branchAuthors.length})</h2>
          <ul className={styles.authorList}>
            {pageBranchAuthors.map((author) => (
              <li key={author.email}>
                <Link to={authorProfilePath(author.username)} className={styles.authorItem}>
                  {author.avatarUrl ?
                    <img
                      className={styles.authorAvatar}
                      src={author.avatarUrl}
                      alt=""
                      width={36}
                      height={36}
                    />
                  : <span className={styles.authorFallback} aria-hidden>
                      {authorInitials(author.displayName)}
                    </span>
                  }
                  <span className={styles.authorMeta}>
                    <span className={styles.authorName}>{author.displayName}</span>
                    <span className={styles.authorStats}>
                      {author.commits} commits · +{formatNumber(author.insertions)} / -
                      {formatNumber(author.deletions)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {contributorTotalPages > 1 || branchAuthors.length > DEFAULT_CONTRIBUTORS_PAGE_SIZE ?
            <ListPagination
              className={`list-pagination--plain ${styles.authorPagination}`}
              total={branchAuthors.length}
              page={safeContributorPage}
              totalPages={contributorTotalPages}
              pageSize={contributorPageSize}
              rangeStart={contributorRangeStart}
              rangeEnd={contributorRangeEnd}
              onPageChange={setContributorPage}
              onPageSizeChange={setContributorPageSize}
              pageSizeOptions={CONTRIBUTORS_PAGE_SIZE_OPTIONS}
              icons={paginationNavIcons}
              summaryNoun="contributors"
            />
          : null}
        </section>
      : null}

      <section className={`pageSection ${styles.chartRow}`}>
        <TypeBreakdown data={profile.typeBreakdown} />
        <ScopeBreakdown data={profile.scopeBreakdown} />
      </section>

      <section className={styles.recent}>
        <h2 className={styles.sectionTitle}>Recent commits</h2>
        <CommitList
          commits={profile.recentCommits}
          emptyMessage="No commits on this branch."
          footer={
            branch.totalCommits > profile.recentCommits.length ?
              <p className={styles.more}>
                Showing latest {profile.recentCommits.length} of {branch.totalCommits} commits on{' '}
                <Link
                  to={`/commits?branch=${encodeURIComponent(branch.name)}`}
                  className={styles.moreLink}
                >
                  {branch.name}
                </Link>
                .
              </p>
            : undefined
          }
        />
      </section>
    </div>
  );
}
