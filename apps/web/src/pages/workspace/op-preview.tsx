import type { WorkerApiEnvelope } from '@i18nprune/core';
import { WorkspaceTreePanel } from '../../components/workspace/WorkspaceTreePanel';

type Props = {
  /** Same label as the workspace result header (e.g. `Metadata`, `Validate error`). */
  title: string;
  /** Raw result from `runAction` — full `WorkerApiEnvelope`, `{ message }` errors, or `{ ok: true }`. */
  payload: unknown | null;
};

function isEnvelope(x: unknown): x is WorkerApiEnvelope<unknown> {
  return Boolean(x && typeof x === 'object' && 'success' in x && typeof (x as WorkerApiEnvelope<unknown>).success === 'boolean');
}

function envData(x: unknown): unknown {
  if (!isEnvelope(x)) return x;
  return x.data;
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return Boolean(x && typeof x === 'object' && !Array.isArray(x));
}

function previewSnippet(x: unknown, max = 88): string {
  try {
    const s = typeof x === 'string' ? x : JSON.stringify(x);
    if (s.length <= max) return s;
    return `${s.slice(0, max)}…`;
  } catch {
    return '…';
  }
}

function Stat({ label, value }: { label: string; value: string | number | null | undefined }) {
  const v = value === undefined || value === null || value === '' ? '—' : String(value);
  return (
    <div className="op-preview__stat">
      <dt className="op-preview__dt">{label}</dt>
      <dd className="op-preview__dd">{v}</dd>
    </div>
  );
}

export function OpPreview({ title, payload }: Props) {
  const baseTitle = title.replace(/\s+error$/i, '').trim();
  const isErr = /error$/i.test(title);

  if (payload === null || payload === undefined) {
    return (
      <div className="op-preview op-preview--empty">
        <h3 className="op-preview__title">Result preview</h3>
        <p className="muted op-preview__hint">Run an operation above to see a short summary here. Raw JSON stays in the panel below.</p>
      </div>
    );
  }

  const env = isEnvelope(payload) ? payload : null;
  if (isErr || (env !== null && !env.success)) {
    const msg =
      !env && payload && typeof payload === 'object' && 'message' in payload
        ? String((payload as { message: unknown }).message)
        : env?.errors[0]
          ? `${env.errors[0].code}: ${env.errors[0].message}`
          : 'Request failed.';
    return (
      <div className="op-preview op-preview--error">
        <h3 className="op-preview__title">Result preview · {baseTitle || title}</h3>
        <p className="op-preview__err">{msg}</p>
      </div>
    );
  }

  const data = envData(payload);
  const d = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;

  if (baseTitle === 'Reprocess with config override' && d && 'ok' in d) {
    return (
      <div className="op-preview">
        <h3 className="op-preview__title">Result preview · Reprocess</h3>
        <p className="op-preview__ok">Override applied and project rebuilt.</p>
      </div>
    );
  }

  if (baseTitle === 'Metadata' && d) {
    const ext = d.extraction && typeof d.extraction === 'object' ? (d.extraction as Record<string, unknown>) : null;
    return (
      <div className="op-preview">
        <h3 className="op-preview__title">Result preview · Metadata</h3>
        <dl className="op-preview__grid">
          <Stat label="Project" value={typeof d.projectId === 'string' ? d.projectId : undefined} />
          <Stat label="Files" value={typeof d.fileCount === 'number' ? d.fileCount : undefined} />
          <Stat label="Text files" value={typeof d.textFileCount === 'number' ? d.textFileCount : undefined} />
          <Stat label="Locales" value={Array.isArray(d.localeTags) ? (d.localeTags as unknown[]).length : undefined} />
          <Stat label="Config path" value={typeof d.detectedConfigPath === 'string' ? d.detectedConfigPath : undefined} />
          <Stat label="Extraction" value={ext && typeof ext.computedAt === 'string' ? ext.computedAt : undefined} />
        </dl>
      </div>
    );
  }

  if (baseTitle === 'Tree' && d) {
    const stats = d.stats && typeof d.stats === 'object' ? (d.stats as Record<string, unknown>) : null;
    return (
      <div className="op-preview">
        <h3 className="op-preview__title">Result preview · Tree</h3>
        <dl className="op-preview__grid">
          <Stat label="Project" value={typeof d.projectId === 'string' ? d.projectId : undefined} />
          <Stat label="Files" value={stats && typeof stats.fileCount === 'number' ? stats.fileCount : undefined} />
          <Stat label="Text files" value={stats && typeof stats.textFileCount === 'number' ? stats.textFileCount : undefined} />
          <Stat label="Zip bytes" value={stats && typeof stats.zipBytes === 'number' ? stats.zipBytes : undefined} />
        </dl>
        <WorkspaceTreePanel roots={d.tree} />
      </div>
    );
  }

  if (baseTitle === 'Snapshot' && d && d.snapshot && typeof d.snapshot === 'object') {
    const s = d.snapshot as Record<string, unknown>;
    return (
      <div className="op-preview">
        <h3 className="op-preview__title">Result preview · Snapshot</h3>
        <dl className="op-preview__grid">
          <Stat label="Project" value={typeof d.projectId === 'string' ? d.projectId : undefined} />
          <Stat label="Files" value={typeof s.fileCount === 'number' ? s.fileCount : undefined} />
          <Stat label="Text files" value={typeof s.textFileCount === 'number' ? s.textFileCount : undefined} />
          <Stat label="Tree nodes" value={Array.isArray(s.tree) ? s.tree.length : undefined} />
          <Stat label="Locales cached" value={s.localeJsonByTag && typeof s.localeJsonByTag === 'object' ? Object.keys(s.localeJsonByTag as object).length : undefined} />
        </dl>
        <WorkspaceTreePanel roots={s.tree} />
      </div>
    );
  }

  if (baseTitle === 'Validate' && d) {
    const missing = Array.isArray(d.missing) ? d.missing.length : 0;
    const dynObj = d.dynamic && typeof d.dynamic === 'object' ? (d.dynamic as Record<string, unknown>) : null;
    const dyn = typeof dynObj?.count === 'number' ? dynObj.count : undefined;
    const dynSites = Array.isArray(dynObj?.sites) ? (dynObj.sites as unknown[]) : [];
    const koObj = d.keyObservations && typeof d.keyObservations === 'object' ? (d.keyObservations as Record<string, unknown>) : null;
    const ko = typeof koObj?.count === 'number' ? koObj.count : undefined;
    const koObs = Array.isArray(koObj?.observations) ? (koObj.observations as unknown[]) : [];
    const scanCount = typeof d.count === 'number' ? d.count : undefined;
    return (
      <div className="op-preview">
        <h3 className="op-preview__title">Result preview · Validate</h3>
        <dl className="op-preview__grid">
          <Stat label="Missing keys" value={missing} />
          <Stat label="Dynamic sites" value={typeof dyn === 'number' ? dyn : undefined} />
          <Stat label="Key observations" value={typeof ko === 'number' ? ko : undefined} />
          <Stat label="Extractor index size" value={scanCount} />
        </dl>
        {dynSites.length > 0 ? (
          <>
            <p className="op-preview__subhead">Dynamic sites (sample)</p>
            <ul className="op-preview__micro-list">
              {dynSites.slice(0, 5).map((s, i) => (
                <li key={i}>{previewSnippet(s)}</li>
              ))}
            </ul>
          </>
        ) : dyn !== undefined && dyn > 0 ? (
          <p className="muted op-preview__hint">
            Listing: run <code className="text-xs font-mono">i18nprune locales dynamic</code>.
          </p>
        ) : null}
        {koObs.length > 0 ? (
          <>
            <p className="op-preview__subhead">Key observations (sample)</p>
            <ul className="op-preview__micro-list">
              {koObs.slice(0, 4).map((o, i) => (
                <li key={i}>{previewSnippet(o)}</li>
              ))}
            </ul>
          </>
        ) : ko !== undefined && ko > 0 ? (
          <p className="muted op-preview__hint">
            Rows: run <code className="text-xs font-mono">i18nprune report</code>.
          </p>
        ) : null}
      </div>
    );
  }

  if (baseTitle === 'Review' && d) {
    const locMap =
      d.kind === 'localeReview' && d.locales && typeof d.locales === 'object' && !Array.isArray(d.locales)
        ? (d.locales as Record<string, unknown>)
        : null;
    if (locMap) {
      const entries = Object.entries(locMap).sort(([a], [b]) => a.localeCompare(b));
      const dyn = typeof d.dynamicKeySites === 'number' ? d.dynamicKeySites : undefined;
      const src = typeof d.sourceLocale === 'string' ? d.sourceLocale : undefined;
      const dir = typeof d.localesDir === 'string' ? d.localesDir : undefined;
      return (
        <div className="op-preview">
          <h3 className="op-preview__title">Result preview · Review</h3>
          <dl className="op-preview__grid">
            <Stat label="Source locale" value={src} />
            <Stat label="Locales dir" value={dir} />
            <Stat label="Dynamic key sites" value={dyn} />
            <Stat label="Target locale files" value={entries.length} />
          </dl>
          <p className="op-preview__subhead">Per-locale stats</p>
          <div className="op-preview__locale-cards">
            {entries.slice(0, 8).map(([file, raw]) => {
              const st = isRecord(raw) ? raw : null;
              const num = (k: string) => (st && typeof st[k] === 'number' ? (st[k] as number) : undefined);
              return (
                <div key={file} className="op-preview__locale-card">
                  <h4>{file}</h4>
                  <dl className="op-preview__grid">
                    <Stat label="String paths" value={num('stringPaths')} />
                    <Stat label="Needs review" value={num('needsReviewTrue')} />
                    <Stat label="Same as English" value={num('englishIdentical')} />
                    <Stat label="Structured leaves" value={num('structuredLeaves')} />
                  </dl>
                </div>
              );
            })}
          </div>
          {entries.length > 8 ? (
            <p className="muted op-preview__hint">+{entries.length - 8} more locale file(s) — see Raw JSON below.</p>
          ) : null}
        </div>
      );
    }
    const keys = Object.keys(d).filter((k) => k !== 'projectId');
    return (
      <div className="op-preview">
        <h3 className="op-preview__title">Result preview · Review</h3>
        <p className="muted op-preview__hint">{keys.length} top-level review fields — open JSON for full diff-style payload.</p>
        <ul className="op-preview__chips">
          {keys.slice(0, 12).map((k) => (
            <li key={k} className="op-preview__chip">
              {k}
            </li>
          ))}
          {keys.length > 12 ? <li className="op-preview__chip op-preview__chip--more">+{keys.length - 12} more</li> : null}
        </ul>
      </div>
    );
  }

  if (baseTitle === 'Report' && d) {
    const doc = d.document && typeof d.document === 'object' ? (d.document as Record<string, unknown>) : null;
    const sum = doc?.summary && typeof doc.summary === 'object' ? (doc.summary as Record<string, unknown>) : null;
    const schemaVersion = doc && typeof doc.schemaVersion === 'string' ? doc.schemaVersion : undefined;
    const generatedAt = doc && typeof doc.generatedAt === 'string' ? doc.generatedAt : undefined;
    const toolVersion = doc && typeof doc.toolVersion === 'string' ? doc.toolVersion : undefined;
    const proj = doc?.project && typeof doc.project === 'object' ? (doc.project as Record<string, unknown>) : null;
    return (
      <div className="op-preview">
        <h3 className="op-preview__title">Result preview · Report</h3>
        <dl className="op-preview__grid">
          <Stat label="OK" value={sum && typeof sum.ok === 'boolean' ? (sum.ok ? 'yes' : 'no') : undefined} />
          <Stat label="Missing keys" value={sum && typeof sum.missingKeysCount === 'number' ? sum.missingKeysCount : undefined} />
          <Stat label="Dynamic sites" value={sum && typeof sum.dynamicSitesCount === 'number' ? sum.dynamicSitesCount : undefined} />
          <Stat label="Observations" value={sum && typeof sum.keyObservationsCount === 'number' ? sum.keyObservationsCount : undefined} />
          <Stat label="Schema" value={schemaVersion} />
          <Stat label="Generated" value={generatedAt ? new Date(generatedAt).toLocaleString() : undefined} />
          <Stat label="Tool" value={toolVersion} />
          <Stat label="Source locale" value={proj && typeof proj.sourceLocaleTag === 'string' ? proj.sourceLocaleTag : undefined} />
        </dl>
      </div>
    );
  }

  if (baseTitle === 'Missing' && d) {
    const paths = Array.isArray(d.toAdd) ? (d.toAdd as unknown[]) : [];
    const toAddCount = paths.length;
    return (
      <div className="op-preview">
        <h3 className="op-preview__title">Result preview · Missing</h3>
        <dl className="op-preview__grid">
          <Stat label="Target tag" value={typeof d.targetTag === 'string' ? d.targetTag : undefined} />
          <Stat label="Paths to add" value={toAddCount} />
          <Stat label="Skipped (not in scan)" value={Array.isArray(d.skippedNotInScan) ? d.skippedNotInScan.length : undefined} />
        </dl>
        {paths.length > 0 ? (
          <>
            <p className="op-preview__subhead">Paths (sample)</p>
            <ul className="op-preview__paths">
              {paths.slice(0, 14).map((p, i) => (
                <li key={i}>
                  <code>{typeof p === 'string' ? p : previewSnippet(p, 200)}</code>
                </li>
              ))}
            </ul>
            {paths.length > 14 ? <p className="muted op-preview__hint">+{paths.length - 14} more in Raw JSON.</p> : null}
          </>
        ) : null}
      </div>
    );
  }

  if (baseTitle === 'Locales' && d) {
    const locs = Array.isArray(d.locales) ? (d.locales as { tag?: string }[]) : [];
    return (
      <div className="op-preview">
        <h3 className="op-preview__title">Result preview · Locales</h3>
        <p className="muted op-preview__hint">{locs.length} locale(s)</p>
        <ul className="op-preview__chips">
          {locs.slice(0, 24).map((L, i) => {
            const src = typeof L === 'object' && L && 'isSource' in L && (L as { isSource?: boolean }).isSource;
            return (
              <li key={`${L.tag ?? i}`} className="op-preview__chip">
                {typeof L.tag === 'string' ? L.tag : '?'}
                {src ? ' · source' : ''}
              </li>
            );
          })}
          {locs.length > 24 ? <li className="op-preview__chip op-preview__chip--more">+{locs.length - 24}</li> : null}
        </ul>
      </div>
    );
  }

  if (baseTitle === 'LocaleByTag' && d) {
    const lj = d.localeJson && typeof d.localeJson === 'object' ? (d.localeJson as Record<string, unknown>) : null;
    const n = lj ? Object.keys(lj).length : 0;
    return (
      <div className="op-preview">
        <h3 className="op-preview__title">Result preview · Locale by tag</h3>
        <dl className="op-preview__grid">
          <Stat label="Tag" value={typeof d.tag === 'string' ? d.tag : undefined} />
          <Stat label="Top-level keys" value={n} />
        </dl>
      </div>
    );
  }

  if (baseTitle === 'Doctor' && d) {
    const checks = Array.isArray(d.checks) ? (d.checks as { id?: string; ok?: boolean; message?: string }[]) : [];
    const max = 12;
    const shown = checks.slice(0, max);
    return (
      <div className="op-preview">
        <h3 className="op-preview__title">Result preview · Doctor</h3>
        <p className="muted op-preview__hint">Overall {d.ok === true ? 'healthy' : 'needs attention'}</p>
        <ul className="op-preview__checks">
          {shown.map((c, i) => (
            <li key={c.id ?? `${String(c.message)}-${i}`} className={`op-preview__check op-preview__check--${c.ok ? 'ok' : 'bad'}`}>
              <span className="op-preview__check-mark">{c.ok ? '✓' : '✗'}</span>
              <span>{c.message ?? c.id}</span>
            </li>
          ))}
        </ul>
        {checks.length > max ? <p className="muted op-preview__hint">+{checks.length - max} more checks in Raw JSON.</p> : null}
      </div>
    );
  }

  if (baseTitle === 'Re-uploaded' && d && 'message' in d) {
    return (
      <div className="op-preview">
        <h3 className="op-preview__title">Result preview · Re-upload</h3>
        <p className="op-preview__ok">{String((d as { message: string }).message)}</p>
      </div>
    );
  }

  return (
    <div className="op-preview op-preview--generic">
      <h3 className="op-preview__title">Result preview · {baseTitle || title}</h3>
      <p className="muted op-preview__hint">No tailored layout for this response — use the JSON panel below.</p>
    </div>
  );
}
