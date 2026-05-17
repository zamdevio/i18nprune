import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutTemplate, Loader2, Play, Square, X } from 'lucide-react';
import {
  cancelWorkspaceGenerate,
  isVsCodeWebview,
  navigateDashboardTab,
  requestWorkspaceGenerate,
  type GenerateUiPayload,
} from '../services/api';
import type { TranslationProviderRow } from '../hooks/useDashboardBootstrap';
import type { CatalogRow } from '../utils/filterLanguageCatalog';
import { filterLanguageCatalog } from '../utils/filterLanguageCatalog';

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-vsc-border/40 last:border-0">
      <div>
        <div className="text-[11px] font-bold text-vsc-text-bright">{label}</div>
        {description ? <p className="text-[10px] text-vsc-text-muted mt-0.5">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${checked ? 'bg-vsc-accent' : 'bg-vsc-bg border border-vsc-border'}`}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${checked ? 'left-6' : 'left-1'}`}
        />
      </button>
    </div>
  );
}

type GenerateFinishedMsg = {
  command?: string;
  requestId?: number;
  ok?: boolean;
  error?: string;
  result?: {
    payload?: { targetResults?: unknown[] };
    issues?: unknown[];
  };
};

type GenerateProgressMsg = {
  command?: string;
  requestId?: number;
  event?: Record<string, unknown>;
};

type ConfirmRow = {
  target: string;
  localeJson?: string;
};

function parseConfirmRows(m: GenerateFinishedMsg): ConfirmRow[] {
  const raw = m.result?.payload?.targetResults;
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => {
    const r = row as {
      target?: string;
      paths?: { localeJson?: string };
    };
    return {
      target: typeof r.target === 'string' ? r.target : '?',
      localeJson: r.paths?.localeJson,
    };
  });
}

function uniquePaths(rows: ConfirmRow[]): string[] {
  const out: string[] = [];
  for (const r of rows) {
    if (r.localeJson) out.push(r.localeJson);
  }
  return [...new Set(out)];
}

type Props = {
  languageCatalog: CatalogRow[];
  translationProviders: TranslationProviderRow[];
  discoveredProjectsCount: number;
};

export default function GeneratePage({
  languageCatalog,
  translationProviders,
  discoveredProjectsCount,
}: Props) {
  const [catalogQuery, setCatalogQuery] = useState('');
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [dryRun, setDryRun] = useState(true);
  const [metadata, setMetadata] = useState(true);
  const [resume, setResume] = useState(false);
  const [force, setForce] = useState(false);
  const [providerPin, setProviderPin] = useState('');
  const [workers, setWorkers] = useState('');
  const [sourceOverride, setSourceOverride] = useState('');
  const [configOverridesJson, setConfigOverridesJson] = useState('');

  const [running, setRunning] = useState(false);
  const [progressLine, setProgressLine] = useState<string>('');
  const [progressPct, setProgressPct] = useState<number | null>(null);
  const [finished, setFinished] = useState<{
    ok: boolean;
    error?: string;
    summary?: string;
  } | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    rows: ConfirmRow[];
    paths: string[];
  } | null>(null);

  const previewReqRef = useRef<number | null>(null);
  const writeReqRef = useRef<number | null>(null);
  const pendingWritePayloadRef = useRef<GenerateUiPayload | null>(null);

  const multiProjects = discoveredProjectsCount > 1;

  const filteredCatalog = useMemo(
    () => filterLanguageCatalog(languageCatalog, catalogQuery),
    [languageCatalog, catalogQuery],
  );

  useEffect(() => {
    if (!providerPin) return;
    const row = translationProviders.find((p) => p.id === providerPin);
    if (row) setWorkers(String(row.defaultWorkers));
  }, [providerPin, translationProviders]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const m = e.data as GenerateProgressMsg | GenerateFinishedMsg;
      const rid = typeof m.requestId === 'number' ? m.requestId : -1;
      const tracking = rid === previewReqRef.current || rid === writeReqRef.current;

      if (m.command === 'generateProgress' && tracking) {
        const ev = (m as GenerateProgressMsg).event ?? {};
        const phase = typeof ev.phase === 'string' ? ev.phase : '';
        const label = typeof ev.label === 'string' ? ev.label : '';
        const current = typeof ev.current === 'number' ? ev.current : undefined;
        const total = typeof ev.total === 'number' ? ev.total : undefined;
        let line = `${phase}${label ? ` — ${label}` : ''}`;
        if (current !== undefined && total !== undefined) {
          line += ` (${current}/${total})`;
          setProgressPct(Math.min(100, Math.round((current / Math.max(total, 1)) * 100)));
        } else {
          setProgressPct(null);
        }
        setProgressLine(line);
        return;
      }

      if (m.command !== 'generateFinished' || !tracking) return;

      const fm = m as GenerateFinishedMsg;

      if (rid === previewReqRef.current) {
        previewReqRef.current = null;
        setRunning(false);
        setProgressLine('');
        setProgressPct(null);

        if (!fm.ok) {
          pendingWritePayloadRef.current = null;
          setFinished({ ok: false, error: fm.error ?? 'Generate preview failed' });
          return;
        }

        const rows = parseConfirmRows(fm);
        const paths = uniquePaths(rows);
        if (paths.length === 0) {
          pendingWritePayloadRef.current = null;
          setFinished({
            ok: false,
            error:
              'Preview finished but no output paths were reported. Enable metadata or check core payload.',
          });
          return;
        }

        setConfirmModal({ rows, paths });
        return;
      }

      if (rid === writeReqRef.current) {
        writeReqRef.current = null;
        setRunning(false);
        setProgressLine('');
        setProgressPct(null);
        pendingWritePayloadRef.current = null;

        if (!fm.ok) {
          setFinished({ ok: false, error: fm.error ?? 'Generate write failed' });
          return;
        }
        const targetRows = fm.result?.payload?.targetResults?.length ?? 0;
        const issues = fm.result?.issues?.length ?? 0;
        setFinished({
          ok: true,
          summary: `Wrote locales: ${targetRows} target row(s), ${issues} issue(s) from engine.`,
        });
      }
    };

    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const toggleTarget = useCallback((code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code].sort(),
    );
  }, []);

  const removeTarget = useCallback((code: string) => {
    setSelectedCodes((prev) => prev.filter((c) => c !== code));
  }, []);

  const buildPayload = useCallback((): GenerateUiPayload | null => {
    if (selectedCodes.length === 0) {
      setFinished({ ok: false, error: 'Pick at least one target locale.' });
      return null;
    }

    let configOverrides: unknown = undefined;
    const trimmed = configOverridesJson.trim();
    if (trimmed) {
      try {
        configOverrides = JSON.parse(trimmed) as unknown;
      } catch {
        setFinished({ ok: false, error: 'Config overrides must be valid JSON.' });
        return null;
      }
    }

    const workersNum = workers.trim() === '' ? undefined : Number(workers);
    return {
      targets: selectedCodes,
      dryRun,
      metadata,
      resume,
      force,
      source: sourceOverride.trim() || undefined,
      configOverrides,
      provider: providerPin || undefined,
      workers: workersNum !== undefined && Number.isFinite(workersNum) ? workersNum : undefined,
    };
  }, [
    selectedCodes,
    dryRun,
    metadata,
    resume,
    force,
    sourceOverride,
    configOverridesJson,
    providerPin,
    workers,
  ]);

  const startRun = () => {
    setFinished(null);
    setProgressLine('');
    setProgressPct(null);
    setConfirmModal(null);

    const payload = buildPayload();
    if (!payload) return;

    if (!isVsCodeWebview) {
      setRunning(true);
      setProgressLine('Dev browser — open the dashboard in VS Code to run generate.');
      setProgressPct(null);
      window.setTimeout(() => {
        setRunning(false);
        setFinished({ ok: true, summary: 'Dev mock only.' });
      }, 800);
      return;
    }

    if (payload.dryRun) {
      previewReqRef.current = null;
      const rid = requestWorkspaceGenerate(payload);
      if (rid < 0) return;
      writeReqRef.current = rid;
      pendingWritePayloadRef.current = null;
      setRunning(true);
      return;
    }

    previewReqRef.current = null;
    writeReqRef.current = null;
    const previewPayload: GenerateUiPayload = { ...payload, dryRun: true };
    const rid = requestWorkspaceGenerate(previewPayload);
    if (rid < 0) return;
    previewReqRef.current = rid;
    pendingWritePayloadRef.current = payload;
    setRunning(true);
  };

  const confirmWrite = () => {
    const payload = pendingWritePayloadRef.current;
    if (!payload || !isVsCodeWebview) {
      setConfirmModal(null);
      pendingWritePayloadRef.current = null;
      return;
    }
    setConfirmModal(null);
    const rid = requestWorkspaceGenerate(payload);
    if (rid < 0) return;
    writeReqRef.current = rid;
    previewReqRef.current = null;
    setRunning(true);
    setProgressLine('');
    setProgressPct(null);
  };

  const cancelConfirm = () => {
    setConfirmModal(null);
    pendingWritePayloadRef.current = null;
    setFinished({ ok: false, error: 'Save cancelled — disk was not modified.' });
  };

  const stopRun = () => {
    if (!isVsCodeWebview) return;
    if (previewReqRef.current !== null) cancelWorkspaceGenerate(previewReqRef.current);
    if (writeReqRef.current !== null) cancelWorkspaceGenerate(writeReqRef.current);
  };

  return (
    <div className="space-y-8 max-w-3xl relative">
      <header>
        <h1 className="text-xl font-bold text-vsc-text-bright uppercase tracking-widest mb-2">Generate</h1>
        <p className="text-xs text-vsc-text-muted leading-relaxed">
          Targets and overrides run against whichever i18n project is selected under{' '}
          <span className="text-vsc-text-bright font-semibold">Project config</span>. With dry run off, the extension
          runs a quick preview first, then asks you to confirm paths before writing.
        </p>
      </header>

      {multiProjects ? (
        <div className="rounded border border-vsc-warn/40 bg-vsc-warn/5 px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <p className="text-[11px] text-vsc-text leading-relaxed">
            This workspace has multiple <span className="font-mono">i18nprune.config.*</span> projects. Pick the
            correct app under Project config before generating.
          </p>
          <button
            type="button"
            onClick={() => navigateDashboardTab('config')}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-vsc-border bg-vsc-sidebar text-[10px] font-bold uppercase tracking-wide hover:border-vsc-accent hover:text-vsc-accent shrink-0"
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            Project config
          </button>
        </div>
      ) : null}

      <section className="rounded border border-vsc-border bg-vsc-sidebar/40 p-4 space-y-3">
        <h2 className="text-[10px] font-bold uppercase text-vsc-text-muted tracking-wider">Target locales</h2>
        <p className="text-[11px] text-vsc-text-muted">
          Search the language catalog (same data as <span className="font-mono">@i18nprune/core</span>). Toggle rows
          to build the target list.
        </p>
        <input
          type="search"
          placeholder="Filter catalog…"
          value={catalogQuery}
          onChange={(e) => setCatalogQuery(e.target.value)}
          className="w-full bg-vsc-bg border border-vsc-border rounded px-2 py-1.5 text-xs"
        />
        {selectedCodes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedCodes.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => removeTarget(code)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-vsc-accent/15 text-[10px] font-mono border border-vsc-accent/30 hover:bg-vsc-accent/25"
              >
                {code}
                <X className="w-3 h-3" />
              </button>
            ))}
          </div>
        )}
        <div className="max-h-48 overflow-y-auto themed-scrollbar border border-vsc-border rounded divide-y divide-vsc-border/40">
          {filteredCatalog.slice(0, 120).map((row) => {
            const on = selectedCodes.includes(row.code);
            return (
              <button
                key={row.code}
                type="button"
                onClick={() => toggleTarget(row.code)}
                className={`w-full text-left px-2 py-1.5 text-[11px] flex justify-between gap-2 hover:bg-vsc-hover ${on ? 'bg-vsc-accent/10' : ''}`}
              >
                <span className="font-mono text-vsc-accent shrink-0">{row.code}</span>
                <span className="text-vsc-text-muted truncate">
                  {row.english} · {row.native}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded border border-vsc-border bg-vsc-sidebar/40 p-4 space-y-1">
        <h2 className="text-[10px] font-bold uppercase text-vsc-text-muted tracking-wider mb-2">Run options</h2>
        <ToggleRow label="Dry run (no writes)" checked={dryRun} onChange={setDryRun} />
        <ToggleRow label="Metadata sidecars" checked={metadata} onChange={setMetadata} />
        <ToggleRow label="Resume / top-up" checked={resume} onChange={setResume} />
        <ToggleRow label="Force" checked={force} onChange={setForce} />
      </section>

      <section className="rounded border border-vsc-border bg-vsc-sidebar/40 p-4 space-y-3">
        <h2 className="text-[10px] font-bold uppercase text-vsc-text-muted tracking-wider">Overrides</h2>
        <p className="text-[10px] text-vsc-text-muted">
          Optional CLI-style pins. Leave provider empty to use the loaded config’s primary provider.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase text-vsc-text-muted">Provider</div>
            <select
              value={providerPin}
              onChange={(e) => setProviderPin(e.target.value)}
              className="w-full bg-vsc-bg border border-vsc-border rounded px-2 py-2 text-xs"
            >
              <option value="">From config (no pin)</option>
              {translationProviders.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} — {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase text-vsc-text-muted">
              Workers (defaults from core when you pick a provider)
            </div>
            <input
              type="number"
              min={1}
              placeholder="e.g. 4"
              value={workers}
              onChange={(e) => setWorkers(e.target.value)}
              className="w-full bg-vsc-bg border border-vsc-border rounded px-2 py-2 text-xs font-mono"
            />
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase text-vsc-text-muted">Source locale path (optional)</div>
          <input
            type="text"
            placeholder="Relative path override — same as CLI --source"
            value={sourceOverride}
            onChange={(e) => setSourceOverride(e.target.value)}
            className="w-full bg-vsc-bg border border-vsc-border rounded px-2 py-2 text-xs font-mono"
          />
        </div>
        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase text-vsc-text-muted">Partial config JSON</div>
          <textarea
            placeholder='Merged into loaded config before generate, e.g. { "translate": { "primary": "google" } }'
            value={configOverridesJson}
            onChange={(e) => setConfigOverridesJson(e.target.value)}
            rows={4}
            className="w-full bg-vsc-bg border border-vsc-border rounded px-2 py-2 text-[11px] font-mono"
          />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={running || !!confirmModal}
          onClick={startRun}
          className="inline-flex items-center gap-2 px-4 py-2 rounded bg-vsc-accent text-vsc-bg text-xs font-bold uppercase tracking-wide disabled:opacity-40"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Run generate
        </button>
        <button
          type="button"
          disabled={!running}
          onClick={stopRun}
          className="inline-flex items-center gap-2 px-3 py-2 rounded border border-vsc-border text-xs text-vsc-text-muted hover:bg-vsc-hover disabled:opacity-30"
        >
          <Square className="w-3.5 h-3.5" />
          Cancel signal
        </button>
      </div>

      {(running || progressLine) && (
        <div className="rounded border border-vsc-border bg-vsc-bg/80 p-3 space-y-2">
          <div className="text-[10px] font-bold uppercase text-vsc-text-muted">Progress</div>
          {progressPct !== null ? (
            <div className="h-2 bg-vsc-sidebar rounded overflow-hidden">
              <div
                className="h-full bg-vsc-accent transition-[width] duration-75 ease-linear"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          ) : (
            <div className="h-2 bg-vsc-sidebar rounded overflow-hidden animate-pulse" />
          )}
          <p className="text-[11px] font-mono text-vsc-text break-all">{progressLine || 'Starting…'}</p>
        </div>
      )}

      {finished && (
        <div
          className={`rounded border p-3 text-xs ${finished.ok ? 'border-green-500/40 bg-green-500/5' : 'border-red-500/40 bg-red-500/5'}`}
        >
          {finished.ok ? finished.summary : finished.error}
        </div>
      )}

      {confirmModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-save-title"
        >
          <div className="w-full max-w-lg rounded-lg border border-vsc-border bg-vsc-bg shadow-xl flex flex-col max-h-[min(90vh,32rem)]">
            <div className="px-4 py-3 border-b border-vsc-border shrink-0">
              <h2 id="confirm-save-title" className="text-sm font-bold text-vsc-text-bright uppercase tracking-wide">
                Save translations?
              </h2>
              <p className="text-[10px] text-vsc-text-muted mt-1 leading-relaxed">
                Preview completed (dry run). Confirm to write locale files to the paths below.
              </p>
            </div>
            <div className="px-4 py-3 overflow-y-auto themed-scrollbar flex-1 min-h-0 space-y-3">
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase text-vsc-text-muted">Per target</div>
                <ul className="space-y-2 text-[11px]">
                  {confirmModal.rows.map((r) => (
                    <li key={r.target} className="border border-vsc-border/50 rounded p-2 bg-vsc-sidebar/40">
                      <div className="font-mono text-vsc-accent mb-1">{r.target}</div>
                      {r.localeJson ? (
                        <div className="font-mono text-[10px] text-vsc-text break-all">locale: {r.localeJson}</div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-vsc-text-muted mb-1">All paths</div>
                <ul className="font-mono text-[10px] text-vsc-text-muted space-y-1 max-h-32 overflow-y-auto themed-scrollbar">
                  {confirmModal.paths.map((p) => (
                    <li key={p} className="break-all">
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-vsc-border flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={cancelConfirm}
                className="px-3 py-2 rounded border border-vsc-border text-[11px] font-bold uppercase text-vsc-text-muted hover:bg-vsc-hover"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmWrite}
                className="px-3 py-2 rounded bg-vsc-accent text-vsc-bg text-[11px] font-bold uppercase"
              >
                Save to these paths
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
