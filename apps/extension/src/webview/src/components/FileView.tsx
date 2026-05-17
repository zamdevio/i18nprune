import React, { useEffect, useRef, useState } from 'react';
import { FileCode, Image, Loader2, ShieldCheck, Zap } from 'lucide-react';
import { fileNameToShikiLang, getI18npruneHighlighter, themeForMode } from '../lib/i18npruneShiki';
import { isVsCodeWebview, readWorkspaceFile } from '../services/api';

interface FileViewProps {
  fileName: string;
  filePath: string;
  isDarkMode: boolean;
}

const MOCK_CODE = `import React from "react";
import { useTranslation } from "react-i18next";

export default function Component() {
  const { t } = useTranslation();

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">
        {t("common.welcome")}
      </h1>
      <p className="text-gray-500">
        {t("dashboard.description")}
      </p>
      <button className="btn">
        {t(\`actions.\${isReady ? "save" : "wait"}\`)}
      </button>
    </div>
  );
}`;

/** Client-side hint: don’t fetch obvious binaries in the webview. */
const NO_CODE_PREVIEW = /\.(png|jpe?g|gif|webp|ico|bmp|avif|pdf|zip|7z|gz|tar|woff2?|ttf|eot|otf|mp3|mp4|mov|webm|dmg|exe|dll|so|dylib|wasm|bin)$/i;

type BodyState =
  | { kind: 'loading' }
  | { kind: 'binary' }
  | { kind: 'error'; message: string }
  | { kind: 'text'; lines: string[]; truncated: boolean };

export function FileView({ fileName, filePath, isDarkMode }: FileViewProps) {
  const [body, setBody] = useState<BodyState>(() =>
    NO_CODE_PREVIEW.test(fileName) ? { kind: 'binary' } : { kind: 'loading' },
  );
  const [highlightedLines, setHighlightedLines] = useState<string[]>([]);
  const [highlightsReady, setHighlightsReady] = useState(false);
  const loadGen = useRef(0);
  const highlightGen = useRef(0);
  const [fsReloadTick, setFsReloadTick] = useState(0);

  const isClientBinary = NO_CODE_PREVIEW.test(fileName);

  useEffect(() => {
    const onFs = (e: MessageEvent) => {
      if ((e.data as { command?: string })?.command === 'workspaceFilesystemStale') {
        setFsReloadTick((t) => t + 1);
      }
    };
    window.addEventListener('message', onFs);
    return () => window.removeEventListener('message', onFs);
  }, []);

  // Load file text (or mock in browser dev).
  useEffect(() => {
    if (isClientBinary) {
      loadGen.current += 1;
      setBody({ kind: 'binary' });
      setHighlightedLines([]);
      setHighlightsReady(false);
      return;
    }

    const gen = ++loadGen.current;
    setBody({ kind: 'loading' });
    setHighlightedLines([]);
    setHighlightsReady(false);

    const run = async () => {
      if (!isVsCodeWebview) {
        const lines = MOCK_CODE.split('\n');
        if (gen !== loadGen.current) return;
        setBody({ kind: 'text', lines, truncated: false });
        return;
      }

      try {
        const r = await readWorkspaceFile(filePath);
        if (gen !== loadGen.current) return;
        if (r.kind === 'text') {
          const lines = r.text.split(/\r?\n/);
          setBody({ kind: 'text', lines, truncated: Boolean(r.truncated) });
        } else if (r.kind === 'binary') {
          setBody({ kind: 'binary' });
        } else {
          setBody({ kind: 'error', message: r.message });
        }
      } catch (e) {
        if (gen !== loadGen.current) return;
        setBody({
          kind: 'error',
          message: e instanceof Error ? e.message : String(e),
        });
      }
    };

    void run();
  }, [fileName, filePath, isClientBinary, fsReloadTick]);

  // Shiki highlight when we have text lines.
  useEffect(() => {
    if (body.kind !== 'text') {
      return;
    }

    const lines = body.lines;
    const gen = ++highlightGen.current;
    setHighlightsReady(false);
    setHighlightedLines([]);

    let cancelled = false;

    const run = async () => {
      try {
        const highlighter = await getI18npruneHighlighter();
        if (cancelled || gen !== highlightGen.current) return;
        const lang = fileNameToShikiLang(fileName);
        const theme = themeForMode(isDarkMode);
        const highlighted = await Promise.all(
          lines.map((line) => highlighter.codeToHtml(line || ' ', { lang, theme })),
        );
        if (cancelled || gen !== highlightGen.current) return;
        setHighlightedLines(highlighted);
        setHighlightsReady(true);
      } catch {
        if (cancelled || gen !== highlightGen.current) return;
        setHighlightedLines([]);
        setHighlightsReady(true);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [body, fileName, isDarkMode]);

  const isTranslationLine = (line: string) => line.includes('t(');

  const FileGlyph = fileName.endsWith('.json') ? FileCode : body.kind === 'binary' ? Image : FileCode;

  const textLines = body.kind === 'text' ? body.lines : [];

  return (
    <div className="flex flex-col h-full bg-vsc-sidebar border border-vsc-border rounded-sm overflow-hidden shadow-2xl">
      <div className="flex items-center gap-3 px-6 py-2.5 border-b border-vsc-border bg-vsc-bg">
        <div className="p-1.5 bg-vsc-accent/10 rounded">
          <FileGlyph
            className={`w-3.5 h-3.5 ${fileName.endsWith('.json') ? 'text-vsc-warn' : 'text-vsc-accent'}`}
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-black text-vsc-text-bright tracking-tight truncate">{fileName}</span>
          <span className="text-[9px] font-bold text-vsc-text-muted opacity-60 font-mono truncate">{filePath}</span>
        </div>
        <div className="ml-auto flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-2 py-0.5 bg-black/10 dark:bg-white/5 border border-vsc-border rounded text-[9px] font-bold text-vsc-text-muted uppercase tracking-tighter">
            <ShieldCheck className="w-3 h-3" />
            READ ONLY
          </div>
        </div>
      </div>

      {body.kind === 'loading' && (
        <div className="flex-1 overflow-auto themed-scrollbar bg-vsc-bg flex flex-col items-center justify-center gap-2 p-8 text-vsc-text-muted text-sm">
          <Loader2 className="w-8 h-8 animate-spin text-vsc-accent" />
          <span>Loading file…</span>
        </div>
      )}

      {body.kind === 'error' && (
        <div className="flex-1 overflow-auto themed-scrollbar bg-vsc-bg flex flex-col items-center justify-center p-8 text-center">
          <p className="text-sm text-vsc-error max-w-md">{body.message}</p>
          <p className="text-[11px] font-mono text-vsc-text-muted/70 mt-3 break-all max-w-lg">{filePath}</p>
        </div>
      )}

      {body.kind === 'binary' && (
        <div className="flex-1 overflow-auto themed-scrollbar bg-vsc-bg flex flex-col items-center justify-center p-8 text-center">
          <Image className="w-12 h-12 text-vsc-text-muted/40 mb-3" strokeWidth={1.25} />
          <p className="text-sm text-vsc-text-muted max-w-sm">
            Binary or non-text file — open in the editor to view. (Scan-based explorer filtering will narrow this list
            later.)
          </p>
          <p className="text-[11px] font-mono text-vsc-text-muted/70 mt-3 break-all max-w-lg">{filePath}</p>
        </div>
      )}

      {body.kind === 'text' && (
        <div className="flex-1 overflow-auto themed-scrollbar bg-vsc-bg relative">
          {body.truncated && (
            <div className="sticky top-0 z-10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wide bg-vsc-warn/15 text-vsc-warn border-b border-vsc-border">
              Preview truncated — file exceeds size limit. Open in editor for the full file.
            </div>
          )}
          <div className="min-w-max py-4">
            {textLines.map((line, i) => (
              <div
                key={i}
                className={`flex group transition-colors leading-6 min-h-[1.5rem] ${isTranslationLine(line) ? 'bg-vsc-accent/5' : ''}`}
              >
                <div className="w-14 shrink-0 flex items-center justify-end pr-4 text-[10px] font-bold text-vsc-text-muted/30 select-none border-r border-vsc-border/30 mr-6 relative">
                  {isTranslationLine(line) && (
                    <div className="absolute left-1 flex items-center justify-center w-4 h-full">
                      <div className="w-1.5 h-1.5 bg-vsc-success rounded-full shadow-[0_0_8px_var(--color-vsc-success)] animate-dot-glow" />
                    </div>
                  )}
                  {i + 1}
                </div>
                <div className="flex-1 pr-8">
                  {highlightsReady && highlightedLines[i] ? (
                    <div
                      className="shiki-code text-[12px]"
                      dangerouslySetInnerHTML={{ __html: highlightedLines[i]! }}
                    />
                  ) : (
                    <code className="text-[12px] opacity-40">{line}</code>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {body.kind === 'text' && (
        <div className="px-6 py-2 bg-vsc-sidebar border-t border-vsc-border flex items-center justify-between text-[10px] font-bold text-vsc-text-muted uppercase tracking-widest">
          <div className="flex gap-6">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-vsc-warn" />
              {textLines.length} lines
            </span>
            <span>{fileName.split('.').pop() || 'Text'}</span>
          </div>
          <div className="flex items-center gap-2 text-vsc-success">
            <div className="w-1.5 h-1.5 rounded-full bg-vsc-success shadow-[0_0_8px_var(--color-vsc-success)]" />
            <span>{textLines.filter(isTranslationLine).length} Translations detected</span>
          </div>
        </div>
      )}

      {(body.kind === 'binary' || body.kind === 'error' || body.kind === 'loading') && (
        <div className="px-6 py-2 bg-vsc-sidebar border-t border-vsc-border flex items-center justify-between text-[10px] font-bold text-vsc-text-muted uppercase tracking-widest">
          <span>{fileName.split('.').pop() || '—'}</span>
        </div>
      )}

      <style>{`
        .shiki-code pre { background: transparent !important; margin: 0; padding: 0; }
        .shiki-code code { background: transparent !important; }
      `}</style>
    </div>
  );
}
