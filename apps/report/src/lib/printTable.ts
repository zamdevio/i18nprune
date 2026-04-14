export type PrintReportTableInput = {
  reportTitle: string;
  sectionTitle: string;
  headers: string[];
  rows: string[][];
  metaLine?: string;
};

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function printReportTable(opts: PrintReportTableInput): void {
  if (opts.rows.length === 0) return;

  const head = opts.headers.map((h) => `<th>${esc(h)}</th>`).join('');
  const body = opts.rows
    .map((r) => `<tr>${r.map((c) => `<td class="mono">${esc(c)}</td>`).join('')}</tr>`)
    .join('');
  const meta = opts.metaLine ?? `${opts.rows.length} row(s)`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(opts.sectionTitle)} — ${esc(
    opts.reportTitle,
  )}</title>
  <style>
    body{font-family:ui-sans-serif,system-ui,sans-serif;padding:16px;color:#111;}
    h1{font-size:18px;margin:0 0 4px;}
    .meta{font-size:12px;color:#555;margin-bottom:16px;}
    table{border-collapse:collapse;width:100%;font-size:11px;}
    th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;vertical-align:top;}
    th{background:#f0f0f0;font-size:10px;text-transform:uppercase;letter-spacing:0.04em;}
    .mono{font-family:ui-monospace,Menlo,monospace;word-break:break-word;}
    @media print { body{padding:0;} }
  </style></head><body>
  <h1>${esc(opts.sectionTitle)}</h1>
  <p class="meta">${esc(meta)} · ${esc(opts.reportTitle)}</p>
  <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
  </body></html>`;

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    document.body.removeChild(iframe);
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  win.focus();
  win.print();
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 500);
}
