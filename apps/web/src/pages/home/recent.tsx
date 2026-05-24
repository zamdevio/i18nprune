import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { ListPagination } from '@i18nprune/ui/react/pagination';
import { DeleteConfirmButton } from '../../components/ui/delete';
import type { RecentProjectZipEntry } from '../../types/index.js';

type Props = {
  recentQuery: string;
  onRecentQueryChange: (q: string) => void;
  canUseRecent: boolean;
  filteredRecent: RecentProjectZipEntry[];
  pagedRecent: RecentProjectZipEntry[];
  recentError: string | null;
  loadingRecentId: string | null;
  rangeStart: number;
  rangeEnd: number;
  safePage: number;
  totalPages: number;
  recentPageSize: number;
  onPageSizeChange: (n: number) => void;
  onSetPage: (n: number) => void;
  onOpenRecent: (entry: RecentProjectZipEntry) => void;
  onRemoveRecent: (id: string) => void;
};

const pageSizeOptions = [5, 10, 15, 20] as const;

const paginationIcons = {
  first: <ChevronsLeft size={16} aria-hidden />,
  prev: <ChevronLeft size={16} aria-hidden />,
  next: <ChevronRight size={16} aria-hidden />,
  last: <ChevronsRight size={16} aria-hidden />,
};

export function Recent({
  recentQuery,
  onRecentQueryChange,
  canUseRecent,
  filteredRecent,
  pagedRecent,
  recentError,
  loadingRecentId,
  rangeStart,
  rangeEnd,
  safePage,
  totalPages,
  recentPageSize,
  onPageSizeChange,
  onSetPage,
  onOpenRecent,
  onRemoveRecent,
}: Props) {
  return (
    <section className="panel">
      <div className="recent-head">
        <h2>Recent cached zips</h2>
        <div className="recent-search">
          <Search size={16} className="recent-search__icon" aria-hidden />
          <input
            type="search"
            placeholder="Search by name, id, or sha256…"
            value={recentQuery}
            onChange={(e) => onRecentQueryChange(e.target.value)}
          />
        </div>
      </div>
      {!canUseRecent ? (
        <p className="muted">
          Recent project zip caching is disabled. Enable it in <a href="#/settings">Settings</a> to keep local zip snapshots.
        </p>
      ) : filteredRecent.length === 0 ? (
        <p className="muted">No cached recent zips yet.</p>
      ) : (
        <>
          <ul className="recent-list">
            {pagedRecent.map((r) => (
              <li key={r.id} className="recent-row">
                <button
                  type="button"
                  className="recent-item"
                  disabled={loadingRecentId === r.id}
                  onClick={() => void onOpenRecent(r)}
                >
                  <span className="recent-item__id">{r.name}</span>
                  <span className="muted recent-item__meta">
                    {(r.size / 1024 / 1024).toFixed(2)} MB • {new Date(r.createdAt).toLocaleString()}
                  </span>
                </button>
                <DeleteConfirmButton
                  title="Delete cached project zip?"
                  description={`This removes ${r.name} from browser storage.`}
                  confirmLabel="Delete zip"
                  triggerClassName="recent-item__delete-btn"
                  onConfirm={() => onRemoveRecent(r.id)}
                >
                  <span className="recent-item__delete" aria-label={`Delete cached zip ${r.name}`}>
                    🗑
                  </span>
                </DeleteConfirmButton>
              </li>
            ))}
          </ul>
          <ListPagination
            className="list-pagination--plain"
            total={filteredRecent.length}
            page={safePage}
            totalPages={totalPages}
            pageSize={recentPageSize}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            pageSizeOptions={pageSizeOptions}
            icons={paginationIcons}
            onPageChange={onSetPage}
            onPageSizeChange={onPageSizeChange}
          />
        </>
      )}
      {recentError ? <p className="error-text">{recentError}</p> : null}
    </section>
  );
}
