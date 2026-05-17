import React, { useEffect, useState } from 'react';
import { AlertTriangle, Copy, FolderGit2, LayoutTemplate } from 'lucide-react';
import type { WorkspaceProjectRow } from '../../hooks/useDashboardBootstrap';
import { isVsCodeWebview, postSelectWorkspaceProject, requestConfigPreview } from '../../services/api';
import { ConfigCodePreview } from '../../components/ConfigCodePreview';
import { Card } from '../../components/shared';

type ConfigValidationIssuePayload = {
  code: string;
  message: string;
  pathLabel: string;
  keys?: string[];
};

type ConfigValidationWarningPayload = {
  title: string;
  summary: string;
  issues: ConfigValidationIssuePayload[];
};

type ConfigPreviewMsg = {
  command?: string;
  requestId?: number;
  error?: string;
  configPath?: string | null;
  rawText?: string | null;
  parsedPretty?: string;
  hint?: string | null;
  validationWarning?: ConfigValidationWarningPayload | null;
};

function previewFileLabel(configPath: string | null): string {
  if (!configPath) return 'i18nprune.resolved.json';
  const base = configPath.replace(/\\/g, '/').split('/').pop() ?? 'config';
  return base || 'i18nprune.config.ts';
}

export default function ConfigPage({
  isDarkMode,
  workspaceProjects,
  activeProjectId,
}: {
  isDarkMode: boolean;
  workspaceProjects: WorkspaceProjectRow[];
  activeProjectId: string;
}) {
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [parsedPretty, setParsedPretty] = useState<string>('');
  const [previewHint, setPreviewHint] = useState<string | null>(null);
  const [validationWarning, setValidationWarning] = useState<ConfigValidationWarningPayload | null>(null);
  const [copied, setCopied] = useState(false);
  const [fsRefreshKey, setFsRefreshKey] = useState(0);

  useEffect(() => {
    const onFs = (e: MessageEvent) => {
      if ((e.data as { command?: string })?.command === 'workspaceFilesystemStale') {
        setFsRefreshKey((k) => k + 1);
      }
    };
    window.addEventListener('message', onFs);
    return () => window.removeEventListener('message', onFs);
  }, []);

  useEffect(() => {
    if (!isVsCodeWebview) {
      setPreviewLoading(false);
      setPreviewError(null);
      setPreviewPath(null);
      setRawText(null);
      setParsedPretty('');
      setPreviewHint('Open this dashboard inside VS Code to load project config.');
      setValidationWarning(null);
      return;
    }

    setPreviewLoading(true);
    setPreviewError(null);
    const reqId = requestConfigPreview();
    if (reqId < 0) {
      setPreviewLoading(false);
      return;
    }

    const onMsg = (e: MessageEvent) => {
      const m = e.data as ConfigPreviewMsg;
      if (m.command !== 'configPreview' || m.requestId !== reqId) return;
      setPreviewLoading(false);
      if (m.error) {
        setPreviewError(m.error);
        setPreviewPath(null);
        setRawText(null);
        setParsedPretty('');
        setPreviewHint(null);
        setValidationWarning(null);
        return;
      }
      setPreviewError(null);
      setPreviewPath(m.configPath ?? null);
      setRawText(m.rawText ?? null);
      setParsedPretty(typeof m.parsedPretty === 'string' ? m.parsedPretty : '');
      setPreviewHint(m.hint != null && typeof m.hint === 'string' ? m.hint : null);
      const vw = m.validationWarning;
      setValidationWarning(
        vw && typeof vw === 'object' && Array.isArray(vw.issues) && vw.issues.length > 0 ? vw : null,
      );
    };

    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [activeProjectId, fsRefreshKey]);

  const displaySource =
    rawText !== null && rawText !== ''
      ? rawText
      : parsedPretty
        ? `// Resolved merge (no on-disk file or empty read).\n// Showing authoritative parsed JSON.\n${parsedPretty}`
        : '';

  const fileLabel =
    rawText !== null && rawText !== '' ? previewFileLabel(previewPath) : 'i18nprune.resolved.json';

  const copyVisible = async () => {
    const txt =
      rawText !== null && rawText !== ''
        ? rawText
        : parsedPretty || '';
    try {
      await navigator.clipboard.writeText(txt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setPreviewError('Clipboard permission denied.');
    }
  };

  const discoveredCount = workspaceProjects.filter((p) => p.kind === 'config').length;

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="text-xl font-bold text-vsc-text-bright uppercase tracking-widest mb-2">Project config</h1>
        <p className="text-xs text-vsc-text-muted leading-relaxed">
          Workspace-level: picks which <span className="font-mono">i18nprune.config.*</span> drives generate,
          validation, and paths.
          {discoveredCount > 1 ? (
            <span className="text-vsc-warn"> Multiple configs — choose the app you are editing.</span>
          ) : null}
        </p>
      </header>

      <section className="rounded border border-vsc-border bg-vsc-sidebar/50 p-4 space-y-3">
        <div className="flex items-start gap-2">
          <FolderGit2 className="w-4 h-4 text-vsc-accent shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-vsc-text-bright uppercase tracking-wide">Active project</h4>
            <p className="text-[10px] text-vsc-text-muted mt-1">
              Maps to the folder that contains your config file (or workspace root when using defaults).
            </p>
          </div>
        </div>
        <select
          className="w-full bg-vsc-bg border border-vsc-border rounded px-2 py-2 text-xs"
          value={activeProjectId}
          onChange={(e) => postSelectWorkspaceProject(e.target.value)}
        >
          {workspaceProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label} — {p.projectRoot}
            </option>
          ))}
        </select>
      </section>

      <section className="rounded border border-vsc-border bg-vsc-sidebar/50 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-vsc-accent" />
            <h4 className="text-xs font-bold text-vsc-text-bright uppercase tracking-wide">Config preview</h4>
            {previewLoading ? (
              <span className="text-[10px] text-vsc-text-muted animate-pulse">Loading…</span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={copyVisible}
            disabled={!displaySource}
            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-vsc-border text-[10px] font-bold uppercase text-vsc-accent hover:bg-vsc-hover disabled:opacity-30"
          >
            <Copy className="w-3 h-3" />
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {previewError ? (
          <div className="text-[11px] text-red-400 border border-red-500/30 rounded p-2">{previewError}</div>
        ) : null}
        {previewHint ? <p className="text-[10px] text-vsc-text-muted italic">{previewHint}</p> : null}
        {previewPath ? (
          <p className="text-[10px] font-mono text-vsc-text-muted break-all">Source: {previewPath}</p>
        ) : null}

        <ConfigCodePreview
          fileLabel={fileLabel}
          source={displaySource}
          isDarkMode={isDarkMode}
          emptyHint={
            previewLoading ? undefined : 'No config content yet — fix workspace folder or config discovery.'
          }
        />

        {validationWarning ? (
          <div className="rounded overflow-hidden border border-amber-500/45 bg-amber-500/[0.07]">
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/20 border-b border-amber-500/35">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wide text-amber-200">
                {validationWarning.title}
              </span>
            </div>
            <div className="px-3 py-3 space-y-3">
              <p className="text-[11px] text-amber-100/90 leading-relaxed">{validationWarning.summary}</p>
              <ul className="space-y-2">
                {validationWarning.issues.map((iss, i) => (
                  <li
                    key={`${iss.code}-${iss.pathLabel}-${i}`}
                    className="text-[11px] rounded border border-amber-500/25 bg-black/20 px-2.5 py-2"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="font-mono text-[10px] text-amber-300/90">{iss.code}</span>
                      <span className="font-mono text-[10px] text-vsc-text-muted">at {iss.pathLabel}</span>
                    </div>
                    <p className="text-vsc-text mt-1 leading-snug">{iss.message}</p>
                    {iss.keys && iss.keys.length > 0 ? (
                      <p className="text-[10px] font-mono text-amber-200/80 mt-1.5 break-all">
                        Keys: {iss.keys.join(', ')}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </section>

      <Card title="Structured editing">
        <p className="text-[11px] text-vsc-text-muted leading-relaxed mb-3">
          Coming next: form sections bound to <span className="font-mono">I18nPruneConfig</span>, surgical merges into the
          existing file (create missing keys, preserve untouched branches), backup-before-write, and validation via{' '}
          <span className="font-mono">parseI18nPruneConfig</span> before persistence.
        </p>
        <ul className="text-[10px] text-vsc-text-muted list-disc pl-4 space-y-1">
          <li>Never truncate user-authored keys outside edited sections.</li>
          <li>Optional `.bak` or git-only workflow before overwriting.</li>
          <li>JSON configs first; TS codegen/E-tag semantics evaluated separately.</li>
        </ul>
      </Card>
    </div>
  );
}
