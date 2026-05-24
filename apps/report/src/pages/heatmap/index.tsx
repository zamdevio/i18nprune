import { useState } from 'react';
import { reportPageTitle } from '../../constants/brand.js';
import { useReport } from '../../context/report/index.js';
import { matchesSearch, useSearchQuery } from '../../context/search/index.js';
import { usePaginatedList, PAGE_SIZE_OPTIONS } from '../../context/pagination/index.js';
import { ListPagination } from '@i18nprune/ui/react/pagination';
import { paginationNavIcons } from '../../components/icons.js';
import { ListTableSection } from '../../components/ListTableSection.js';
import { PrintTableDialog } from '../../components/PrintTableDialog.js';
import { SearchNoMatches } from '../../components/search/SearchNoMatches.js';
import { computeFolderHotspots, type FolderHotspot } from '../../lib/hotspots/index.js';
import { printReportTable } from '../../lib/printTable.js';
import type { PrintScope } from '../../components/PrintTableDialog.js';

function rowsForPrint(list: FolderHotspot[]): string[][] {
  const max = list.reduce((m, r) => Math.max(m, r.weight), 0) || 1;
  return list.map((r) => [
    r.folder,
    String(r.missing),
    String(r.dynamic),
    String(r.observations),
    String(r.weight),
    `${Math.round((r.weight / max) * 100)}%`,
  ]);
}

export function HeatmapPage(): JSX.Element {
  const doc = useReport();
  const reportTitle = reportPageTitle(doc.toolVersion);
  const { query, setQuery } = useSearchQuery();
  const rowsAll = computeFolderHotspots(doc);
  const rows = rowsAll.filter((r) =>
    matchesSearch(query, r.folder, String(r.missing), String(r.dynamic), String(r.observations), String(r.weight)),
  );
  const pag = usePaginatedList('heatmap', rows);
  const trimmed = query.trim();
  const noSearchMatches = rowsAll.length > 0 && rows.length === 0 && trimmed !== '';
  const [printOpen, setPrintOpen] = useState(false);

  const max = rows.reduce((m, r) => Math.max(m, r.weight), 0) || 1;

  const getRows = (scope: PrintScope): string[][] => {
    const list = scope === 'full' ? rowsAll : scope === 'filtered' ? rows : pag.slice;
    return rowsForPrint(list);
  };

  if (rowsAll.length === 0) {
    return (
      <div>
        <h1 className="page-title">Folder hotspots</h1>
        <div className="card empty">Nothing to aggregate in this report.</div>
      </div>
    );
  }

  if (noSearchMatches) {
    return (
      <div>
        <h1 className="page-title">Folder hotspots (0)</h1>
        <SearchNoMatches noun="folders" onClear={() => setQuery('')} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Folder hotspots ({rows.length})</h1>
      <p className="page-lead">
        Top folders by weighted activity (missing keys by namespace prefix, dynamic sites and observations by file
        folder). Use the search bar to filter folders.
      </p>
      <ListTableSection
        printDisabled={rows.length === 0}
        onPrint={() => setPrintOpen(true)}
        table={
          <div className="table-wrap table-wrap--scroll">
            <table className="data">
              <thead>
                <tr>
                  <th>Folder / group</th>
                  <th>Missing</th>
                  <th>Dynamic</th>
                  <th>Obs.</th>
                  <th>Weight</th>
                  <th style={{ minWidth: '8rem' }}>Heat</th>
                </tr>
              </thead>
              <tbody>
                {pag.slice.map((r) => (
                  <tr key={r.folder}>
                    <td className="mono">{r.folder}</td>
                    <td>{r.missing}</td>
                    <td>{r.dynamic}</td>
                    <td>{r.observations}</td>
                    <td>{r.weight}</td>
                    <td>
                      <div className="heat-bar-track">
                        <div className="heat-bar-fill" style={{ width: `${Math.round((r.weight / max) * 100)}%` }} />
                      </div>
                    </td>
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
        sectionTitle="Folder hotspots"
        reportTitle={reportTitle}
        headers={['Folder / group', 'Missing', 'Dynamic', 'Obs.', 'Weight', 'Heat %']}
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
