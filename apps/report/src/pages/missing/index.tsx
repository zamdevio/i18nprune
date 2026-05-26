import { useState } from 'react';
import { reportPageTitle } from '../../constants/brand.js';
import { useReport } from '../../context/report/hooks.js';
import { matchesSearch, useSearchQuery } from '../../context/search/index.js';
import { usePaginatedList, PAGE_SIZE_OPTIONS } from '../../context/pagination/index.js';
import { ListPagination } from '@i18nprune/ui/react/pagination';
import { paginationNavIcons } from '../../components/icons.js';
import { ListTableSection, ListTableSearchToolbar } from '../../components/ListTableSection.js';
import { ReportSearchBar } from '../../components/search/index.js';
import { PrintTableDialog } from '../../components/PrintTableDialog.js';
import { SearchNoMatches } from '../../components/search/SearchNoMatches.js';
import { printReportTable } from '../../lib/printTable.js';
import type { PrintScope } from '../../components/PrintTableDialog.js';

export function MissingPage(): JSX.Element {
  const doc = useReport();
  const reportTitle = reportPageTitle(doc.toolVersion);
  const { query, setQuery } = useSearchQuery();
  const keys = doc.details.missingKeys.filter((k) => matchesSearch(query, k));
  const pag = usePaginatedList('missing', keys);
  const trimmed = query.trim();
  const noSearchMatches = doc.details.missingKeys.length > 0 && keys.length === 0 && trimmed !== '';
  const [printOpen, setPrintOpen] = useState(false);

  const getRows = (scope: PrintScope): string[][] => {
    if (scope === 'full') {
      return doc.details.missingKeys.map((k, i) => [String(i + 1), k]);
    }
    if (scope === 'filtered') {
      return keys.map((k, i) => [String(i + 1), k]);
    }
    return pag.slice.map((k, i) => [String(pag.rangeStart + i), k]);
  };

  if (doc.details.missingKeys.length === 0) {
    return (
      <div>
        <h1 className="page-title">Missing keys</h1>
        <div className="card empty">No missing literal keys — all scanned keys exist in the source locale JSON.</div>
      </div>
    );
  }

  if (noSearchMatches) {
    return (
      <div>
        <h1 className="page-title">Missing keys (0)</h1>
        <ListTableSearchToolbar search={<ReportSearchBar />} />
        <SearchNoMatches noun="keys" onClear={() => setQuery('')} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Missing keys ({keys.length})</h1>
      <p className="page-lead">
        These dotted keys appear in translation calls in the codebase but are <strong>not</strong> present as string
        leaves in the <span className="mono">source locale</span> JSON (the same file the{' '}
        <span className="mono">validate</span> command checks against). Adding them here aligns your locale file with
        what the code references.
      </p>
      <ListTableSection
        printDisabled={keys.length === 0}
        onPrint={() => setPrintOpen(true)}
        search={<ReportSearchBar />}
        table={
          <div className="table-wrap table-wrap--scroll">
            <table className="data">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Key</th>
                </tr>
              </thead>
              <tbody>
                {pag.slice.map((k, i) => (
                  <tr key={`${String(pag.rangeStart + i)}-${k}`}>
                    <td className="mono">{pag.rangeStart + i}</td>
                    <td className="mono">{k}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
        pagination={
          <ListPagination
            total={pag.total}
            page={pag.page}
            totalPages={pag.totalPages}
            pageSize={pag.pageSize}
            rangeStart={pag.rangeStart}
            rangeEnd={pag.rangeEnd}
            onPageChange={pag.setPage}
            onPageSizeChange={pag.setPageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            icons={paginationNavIcons}
          />
        }
      />
      <PrintTableDialog
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        sectionTitle="Missing keys"
        reportTitle={reportTitle}
        headers={['#', 'Key']}
        counts={{
          page: pag.slice.length,
          filtered: keys.length,
          full: doc.details.missingKeys.length,
        }}
        getRows={getRows}
        onCommitPrint={(o) => printReportTable(o)}
      />
    </div>
  );
}
