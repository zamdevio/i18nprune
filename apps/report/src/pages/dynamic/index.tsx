import { useState } from 'react';
import { reportPageTitle } from '../../constants/brand.js';
import { useReport } from '../../context/report/index.js';
import { matchesSearch, useSearchQuery } from '../../context/search/index.js';
import { usePaginatedList } from '../../context/pagination/index.js';
import { ListPagination } from '../../components/pagination/index.js';
import { ListTableSection } from '../../components/ListTableSection.js';
import { PrintTableDialog } from '../../components/PrintTableDialog.js';
import { SearchNoMatches } from '../../components/search/SearchNoMatches.js';
import { previewCell } from '../../lib/format/index.js';
import { yesNoCell } from '../../lib/format/boolLabel.js';
import { FileLink } from '../../components/file/index.js';
import { printReportTable } from '../../lib/printTable.js';
import type { PrintScope } from '../../components/PrintTableDialog.js';

type DynRow = {
  kind?: unknown;
  functionName?: unknown;
  filePath?: unknown;
  line?: unknown;
  preview?: unknown;
  isMultilineCall?: unknown;
  isCommented?: unknown;
  isSourceFile?: unknown;
};

function isCommentedSite(r: DynRow): boolean {
  return Boolean(r.isCommented) || r.kind === 'commented';
}

function asRow(x: unknown): DynRow {
  return typeof x === 'object' && x !== null ? (x as DynRow) : {};
}

function rowCells(raw: unknown): string[] {
  const r = asRow(raw);
  const fp = r.filePath !== undefined && r.filePath !== '' ? String(r.filePath) : '';
  const loc =
    fp !== '' ? `${fp}${r.line !== undefined ? `:${String(r.line)}` : ''}` : '—';
  return [
    previewCell(r.kind, 200),
    previewCell(r.functionName),
    loc,
    previewCell(r.preview, 400),
    yesNoCell(isCommentedSite(r)),
    yesNoCell(r.isSourceFile === undefined ? undefined : Boolean(r.isSourceFile)),
  ];
}

export function DynamicPage(): JSX.Element {
  const doc = useReport();
  const reportTitle = reportPageTitle(doc.toolVersion);
  const { query, setQuery } = useSearchQuery();
  const sites = doc.details.dynamicSites;

  const filtered = sites.filter((raw) => {
    const r = asRow(raw);
    return matchesSearch(
      query,
      previewCell(r.kind, 200),
      previewCell(r.functionName),
      previewCell(r.filePath),
      previewCell(r.line),
      previewCell(r.preview, 400),
      yesNoCell(isCommentedSite(r)),
      yesNoCell(r.isSourceFile === undefined ? undefined : Boolean(r.isSourceFile)),
      previewCell(r.isMultilineCall),
    );
  });

  const pag = usePaginatedList('dynamic', filtered);
  const trimmed = query.trim();
  const noSearchMatches = sites.length > 0 && filtered.length === 0 && trimmed !== '';
  const [printOpen, setPrintOpen] = useState(false);

  const getRows = (scope: PrintScope): string[][] => {
    const list =
      scope === 'full' ? sites : scope === 'filtered' ? filtered : pag.slice;
    return list.map((raw) => rowCells(raw));
  };

  if (sites.length === 0) {
    return (
      <div>
        <h1 className="page-title">Dynamic sites</h1>
        <div className="card empty">No non-literal translation call sites were reported.</div>
      </div>
    );
  }

  if (noSearchMatches) {
    return (
      <div>
        <h1 className="page-title">Dynamic sites (0)</h1>
        <SearchNoMatches noun="sites" onClear={() => setQuery('')} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Dynamic sites ({filtered.length})</h1>
      <p className="page-lead">Calls where the translation key is not a static string (heuristic scan).</p>
      <ListTableSection
        printDisabled={filtered.length === 0}
        onPrint={() => setPrintOpen(true)}
        table={
          <div className="table-wrap table-wrap--scroll">
            <table className="data">
              <thead>
                <tr>
                  <th>Kind</th>
                  <th>Function</th>
                  <th>Location</th>
                  <th>Preview</th>
                  <th>In comment</th>
                  <th>Source file</th>
                </tr>
              </thead>
              <tbody>
                {pag.slice.map((raw, i) => {
                  const r = asRow(raw);
                  const fp = r.filePath !== undefined && r.filePath !== '' ? String(r.filePath) : '';
                  const loc =
                    fp !== ''
                      ? `${fp}${r.line !== undefined ? `:${String(r.line)}` : ''}`
                      : '—';
                  return (
                    <tr key={`${String(pag.rangeStart + i)}-${loc}`}>
                      <td>
                        <span className="badge">{previewCell(r.kind, 80)}</span>
                      </td>
                      <td className="mono">{previewCell(r.functionName)}</td>
                      <td className="mono">
                        {fp ? (
                          <FileLink filePath={fp}>
                            {loc}
                          </FileLink>
                        ) : (
                          loc
                        )}
                      </td>
                      <td className="mono">{previewCell(r.preview, 160)}</td>
                      <td>
                        <span className={`badge${isCommentedSite(r) ? ' badge--attn' : ''}`}>
                          {yesNoCell(isCommentedSite(r))}
                        </span>
                      </td>
                      <td>
                        <span className="badge">{yesNoCell(r.isSourceFile === undefined ? undefined : Boolean(r.isSourceFile))}</span>
                      </td>
                    </tr>
                  );
                })}
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
        sectionTitle="Dynamic sites"
        reportTitle={reportTitle}
        headers={['Kind', 'Function', 'Location', 'Preview', 'In comment', 'Source file']}
        counts={{
          page: pag.slice.length,
          filtered: filtered.length,
          full: sites.length,
        }}
        getRows={getRows}
        onCommitPrint={(o) => printReportTable(o)}
      />
    </div>
  );
}
