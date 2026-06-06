import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { ListPagination } from '@i18nprune/ui/react/pagination';
import type { Author } from '../../types';
import { authorInitials, authorProfilePath } from '../../lib/authors';
import { PAGE_SIZE_OPTIONS, paginationNavIcons } from '../../components/icons';
import styles from './index.module.css';

interface AuthorsPageProps {
  authors: Author[];
}

const DEFAULT_PAGE_SIZE = 12;

function formatNumber(value: number): string {
  return value.toLocaleString();
}

export function AuthorsPage({ authors }: AuthorsPageProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const totalPages = Math.max(1, Math.ceil(authors.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const rangeStart = authors.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, authors.length);

  const pageAuthors = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return authors.slice(start, start + pageSize);
  }, [authors, safePage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  return (
    <div>
      <h1 className="pageTitle">Authors</h1>
      <p className={styles.lead}>
        {authors.length} contributor{authors.length === 1 ? '' : 's'} ranked by commit count.
        Open a profile for type/scope breakdown and recent commits.
      </p>

      <div className={styles.grid}>
        {pageAuthors.map((author) => (
          <Link
            key={author.email}
            to={authorProfilePath(author.username)}
            className={styles.cardLink}
          >
            <article className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.identity}>
                  {author.avatarUrl ?
                    <img
                      className={styles.avatar}
                      src={author.avatarUrl}
                      alt=""
                      width={48}
                      height={48}
                    />
                  : <div className={styles.avatarFallback} aria-hidden>
                      {authorInitials(author.displayName)}
                    </div>
                  }
                  <div className={styles.identityBody}>
                    <h2 className={styles.name}>{author.displayName}</h2>
                    <p className={styles.username}>@{author.username}</p>
                    <p className={styles.email}>{author.email}</p>
                  </div>
                </div>
                <a
                  href={author.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.profileLink}
                  onClick={(event) => event.stopPropagation()}
                >
                  GitHub
                  <ExternalLink size={14} aria-hidden />
                </a>
              </div>
              {author.followers !== null || author.following !== null ?
                <p className={styles.social}>
                  {author.followers !== null ?
                    <span>{formatNumber(author.followers)} followers</span>
                  : null}
                  {author.followers !== null && author.following !== null ?
                    <span aria-hidden> · </span>
                  : null}
                  {author.following !== null ?
                    <span>{formatNumber(author.following)} following</span>
                  : null}
                </p>
              : null}
              <dl className={styles.stats}>
                <div>
                  <dt>Commits</dt>
                  <dd>{author.commits}</dd>
                </div>
                <div>
                  <dt>Added</dt>
                  <dd className={styles.add}>+{formatNumber(author.insertions)}</dd>
                </div>
                <div>
                  <dt>Removed</dt>
                  <dd className={styles.del}>-{formatNumber(author.deletions)}</dd>
                </div>
                <div>
                  <dt>Active</dt>
                  <dd>
                    {author.firstCommit} → {author.lastCommit}
                  </dd>
                </div>
              </dl>
            </article>
          </Link>
        ))}
      </div>

      <ListPagination
        className="list-pagination--plain"
        total={authors.length}
        page={safePage}
        totalPages={totalPages}
        pageSize={pageSize}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        icons={paginationNavIcons}
        summaryNoun="contributors"
      />
    </div>
  );
}
