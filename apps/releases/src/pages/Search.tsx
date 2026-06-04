import EmptyState from '@/components/EmptyState';
import ReleaseListPagination from '@/components/ReleaseListPagination';
import ReleaseSearchField from '@/features/search/ReleaseSearchField';
import StreamBadge from '@/features/release/StreamBadge';
import StatusBadge from '@/features/release/StatusBadge';
import { useListPagination } from '@/hooks/useListPagination';
import { highlightTokens } from '@/features/search/highlight';
import { focusReleaseSearch } from '@/features/search/keyboard';
import { searchMatchSnippets, searchReleases, tokenizeQuery } from '@/features/search/search';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';

const SUGGESTIONS = ['review', 'missing', 'sync', 'report', 'generate', 'validate', 'breaking'];

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const initialQ = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQ);
  const tokens = useMemo(() => tokenizeQuery(query), [query]);
  const results = useMemo(() => searchReleases(query), [query]);
  const pagination = useListPagination(results, { initialPageSize: 10, resetKey: query });

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
  }, [searchParams]);

  useEffect(() => {
    const state = location.state as { focusSearch?: boolean } | null;
    if (state?.focusSearch) {
      focusReleaseSearch();
    }
  }, [location.state]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to overview
      </Link>

      <h1 className="mb-2 font-heading text-2xl font-bold text-foreground sm:text-3xl">
        Search releases
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Search summaries, changelog lines, commands, and tags across all streams.
      </p>

      <ReleaseSearchField
        value={query}
        onChange={setQuery}
        className="mb-4 w-full"
      />

      <div className="mb-8 flex flex-wrap gap-2">
        {SUGGESTIONS.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => setQuery(term)}
            className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {term}
          </button>
        ))}
      </div>

      {query.trim().length < 2 ? (
        <p className="text-sm text-muted-foreground">Type at least 2 characters to search.</p>
      ) : results.length === 0 ? (
        <EmptyState
          title="No matches"
          description={`Nothing found for "${query}". Try command names like review, missing, or sync.`}
        />
      ) : (
        <>
          <ul className="space-y-3">
            {pagination.pageItems.map(({ stream, version, release, matches }) => {
              const snippets = searchMatchSnippets(release, tokens);
              return (
                <li key={`${stream}-${version}`}>
                  <Link
                    to={`/${stream}/${version}`}
                    className="block rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <StreamBadge stream={stream} />
                      <span className="font-mono text-sm font-semibold">v{version}</span>
                      <StatusBadge status={release.status} />
                      <span className="ml-auto text-xs text-muted-foreground">
                        {format(new Date(release.date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-foreground/90">
                      {highlightTokens(release.summary, tokens)}
                    </p>
                    {snippets.length > 0 && (
                      <ul className="mt-2 space-y-1 border-t border-border/60 pt-2">
                        {snippets.map((line) => (
                          <li
                            key={line}
                            className="line-clamp-1 text-xs text-muted-foreground"
                          >
                            {highlightTokens(line, tokens)}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      Matched:{' '}
                      {matches.map((term, i) => (
                        <span key={term}>
                          {i > 0 ? ', ' : null}
                          {highlightTokens(term, tokens)}
                        </span>
                      ))}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
          <ReleaseListPagination
            total={pagination.total}
            page={pagination.page}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            rangeStart={pagination.rangeStart}
            rangeEnd={pagination.rangeEnd}
            pageSizeOptions={pagination.pageSizeOptions}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
            summaryNoun="results"
          />
        </>
      )}
    </div>
  );
}
