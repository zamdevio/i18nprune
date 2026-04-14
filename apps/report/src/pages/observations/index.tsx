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

type ObsRow = {
  kind?: unknown;
  resolvedKey?: unknown;
  raw?: unknown;
  templateRaw?: unknown;
  span?: { filePath?: unknown; line?: unknown; functionName?: unknown; isMultilineCall?: unknown };
};

function asRow(x: unknown): ObsRow {
  return typeof x === 'object' && x !== null ? (x as ObsRow) : {};
}

function keyTextOf(r: ObsRow, raw: unknown): string {
  return r.resolvedKey !== undefined
    ? String(r.resolvedKey)
    : r.templateRaw !== undefined
      ? String(r.templateRaw)
      : r.raw !== undefined
        ? String(r.raw)
        : previewCell(raw, 120);
}

export function ObservationsPage(): JSX.Element {
  const doc = useReport();
  const reportTitle = reportPageTitle(doc.toolVersion);
  const { query, setQuery } = useSearchQuery();
  const obs = doc.details.keyObservations;

  const filtered = obs.filter((raw) => {
    const r = asRow(raw);
    const keyText = keyTextOf(r, raw);
    const sp = r.span;
    const loc =
      sp?.filePath !== undefined && String(sp.filePath) !== ''
        ? `${String(sp.filePath)}${sp.line !== undefined ? `:${String(sp.line)}` : ''}`
        : '—';
    return matchesSearch(
      query,
      keyText,
      previewCell(r.kind, 80),
      loc,
      previewCell(sp?.functionName),
      yesNoCell(sp?.isMultilineCall === undefined ? undefined : Boolean(sp.isMultilineCall)),
      sp?.filePath !== undefined ? String(sp.filePath) : '',
    );
  });

  const pag = usePaginatedList('observations', filtered);
  const trimmed = query.trim();
  const noSearchMatches = obs.length > 0 && filtered.length === 0 && trimmed !== '';
  const [printOpen, setPrintOpen] = useState(false);

  const rowStrings = (raw: unknown): string[] => {
    const r = asRow(raw);
    const keyText = keyTextOf(r, raw);
    const sp = r.span;
    const fp =
      sp?.filePath !== undefined && String(sp.filePath) !== '' ? String(sp.filePath) : '';
    const loc =
      fp !== '' ? `${fp}${sp?.line !== undefined ? `:${String(sp.line)}` : ''}` : '—';
    return [
      previewCell(r.kind, 40),
      keyText,
      loc,
      yesNoCell(sp?.isMultilineCall === undefined ? undefined : Boolean(sp.isMultilineCall)),
    ];
  };

  const getRows = (scope: PrintScope): string[][] => {
    const list = scope === 'full' ? obs : scope === 'filtered' ? filtered : pag.slice;
    return list.map((raw) => rowStrings(raw));
  };

  if (obs.length === 0) {
    return (
      <div>
        <h1 className="page-title">Key observations</h1>
        <div className="card empty">No key observations were extracted.</div>
      </div>
    );
  }

  if (noSearchMatches) {
    return (
      <div>
        <h1 className="page-title">Key observations (0)</h1>
        <SearchNoMatches noun="observations" onClear={() => setQuery('')} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Key observations ({filtered.length})</h1>
      <p className="page-lead">Literal and template-resolved key usages from the key-sites scan.</p>
      <ListTableSection
        printDisabled={filtered.length === 0}
        onPrint={() => setPrintOpen(true)}
        table={
          <div className="table-wrap table-wrap--scroll">
            <table className="data">
              <thead>
                <tr>
                  <th>Kind</th>
                  <th>Key / template</th>
                  <th>Location</th>
                  <th>Multiline call</th>
                </tr>
              </thead>
              <tbody>
                {pag.slice.map((raw, i) => {
                  const r = asRow(raw);
                  const keyText = keyTextOf(r, raw);
                  const sp = r.span;
                  const fp =
                    sp?.filePath !== undefined && String(sp.filePath) !== '' ? String(sp.filePath) : '';
                  const loc =
                    fp !== ''
                      ? `${fp}${sp?.line !== undefined ? `:${String(sp.line)}` : ''}`
                      : '—';
                  const multiline = Boolean(sp?.isMultilineCall);
                  return (
                    <tr key={`${String(pag.rangeStart + i)}-${keyText}`}>
                      <td>
                        <span className="badge">{previewCell(r.kind, 40)}</span>
                      </td>
                      <td className="mono">{keyText}</td>
                      <td className="mono">
                        {fp ? <FileLink filePath={fp}>{loc}</FileLink> : loc}
                      </td>
                      <td>
                        <span className={`badge${multiline ? ' badge--attn' : ''}`}>
                          {yesNoCell(multiline)}
                        </span>
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
        sectionTitle="Key observations"
        reportTitle={reportTitle}
        headers={['Kind', 'Key / template', 'Location', 'Multiline call']}
        counts={{
          page: pag.slice.length,
          filtered: filtered.length,
          full: obs.length,
        }}
        getRows={getRows}
        onCommitPrint={(o) => printReportTable(o)}
      />
    </div>
  );
}
