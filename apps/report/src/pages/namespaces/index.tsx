import { useState } from 'react';
import { reportPageTitle } from '../../constants/brand.js';
import { useReport } from '../../context/report/index.js';
import { matchesSearch, useSearchQuery } from '../../context/search/index.js';
import { usePaginatedList } from '../../context/pagination/index.js';
import { ListPagination } from '../../components/pagination/index.js';
import { ListTableSection } from '../../components/ListTableSection.js';
import { PrintTableDialog } from '../../components/PrintTableDialog.js';
import { SearchNoMatches } from '../../components/search/SearchNoMatches.js';
import { computeNamespaceStats, type NamespaceStat } from '../../lib/namespaces/index.js';
import { printReportTable } from '../../lib/printTable.js';
import type { PrintScope } from '../../components/PrintTableDialog.js';

function nsRows(list: NamespaceStat[]): string[][] {
  return list.map((r) => [r.prefix, String(r.missing), String(r.observations)]);
}

export function NamespacesPage(): JSX.Element {
  const doc = useReport();
  const reportTitle = reportPageTitle(doc.toolVersion);
  const { query, setQuery } = useSearchQuery();
  const rowsAll = computeNamespaceStats(doc);
  const rows = rowsAll.filter((r) =>
    matchesSearch(query, r.prefix, String(r.missing), String(r.observations)),
  );
  const pag = usePaginatedList('namespaces', rows);
  const trimmed = query.trim();
  const noSearchMatches = rowsAll.length > 0 && rows.length === 0 && trimmed !== '';
  const [printOpen, setPrintOpen] = useState(false);

  const getRows = (scope: PrintScope): string[][] => {
    const list = scope === 'full' ? rowsAll : scope === 'filtered' ? rows : pag.slice;
    return nsRows(list);
  };

  if (rowsAll.length === 0) {
    return (
      <div>
        <h1 className="page-title">Namespaces</h1>
        <div className="card empty">No key prefixes found.</div>
      </div>
    );
  }

  if (noSearchMatches) {
    return (
      <div>
        <h1 className="page-title">Namespaces (0)</h1>
        <SearchNoMatches noun="prefixes" onClear={() => setQuery('')} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Namespaces ({rows.length})</h1>
      <p className="page-lead">
        First segment of dotted keys (e.g. <code className="mono">app</code> for <code className="mono">app.title</code>
        ), with missing-key and observation counts. Use the search bar to filter prefixes.
      </p>
      <ListTableSection
        printDisabled={rows.length === 0}
        onPrint={() => setPrintOpen(true)}
        table={
          <div className="table-wrap table-wrap--scroll">
            <table className="data">
              <thead>
                <tr>
                  <th>Prefix</th>
                  <th>Missing keys</th>
                  <th>Observations</th>
                </tr>
              </thead>
              <tbody>
                {pag.slice.map((r) => (
                  <tr key={r.prefix}>
                    <td className="mono">{r.prefix}</td>
                    <td>{r.missing}</td>
                    <td>{r.observations}</td>
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
          />
        }
      />
      <PrintTableDialog
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        sectionTitle="Namespaces"
        reportTitle={reportTitle}
        headers={['Prefix', 'Missing keys', 'Observations']}
        counts={{
          page: pag.slice.length,
          filtered: rows.length,
          full: rowsAll.length,
        }}
        getRows={getRows}
        onCommitPrint={(o) => printReportTable(o)}
      />
    </div>
  );
}
