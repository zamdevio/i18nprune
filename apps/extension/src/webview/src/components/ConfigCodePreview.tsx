import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { fileNameToShikiLang, getI18npruneHighlighter, themeForMode } from '../lib/i18npruneShiki';

type Props = {
  /** Virtual filename for grammar selection (e.g. `i18nprune.config.ts`). */
  fileLabel: string;
  source: string;
  isDarkMode: boolean;
  emptyHint?: string;
};

/**
 * Read-only Shiki preview — same engine as {@link FileView} (line-by-line for stable layout).
 */
export function ConfigCodePreview({ fileLabel, source, isDarkMode, emptyHint }: Props) {
  const lines = useMemo(() => (source.length > 0 ? source.split(/\r?\n/) : []), [source]);
  const [highlightedLines, setHighlightedLines] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const genRef = useRef(0);

  useEffect(() => {
    const gen = ++genRef.current;
    setReady(false);
    setHighlightedLines([]);

    if (lines.length === 0) {
      setReady(true);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const highlighter = await getI18npruneHighlighter();
        if (cancelled || gen !== genRef.current) return;
        const lang = fileNameToShikiLang(fileLabel);
        const theme = themeForMode(isDarkMode);
        const highlighted = await Promise.all(
          lines.map((line) => highlighter.codeToHtml(line || ' ', { lang, theme })),
        );
        if (cancelled || gen !== genRef.current) return;
        setHighlightedLines(highlighted);
        setReady(true);
      } catch {
        if (cancelled || gen !== genRef.current) return;
        setHighlightedLines([]);
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [source, fileLabel, isDarkMode, lines]);

  if (lines.length === 0) {
    return (
      <div className="text-[11px] text-vsc-text-muted italic px-3 py-6 border border-vsc-border rounded bg-black/10">
        {emptyHint ?? 'No source text to display.'}
      </div>
    );
  }

  return (
    <div className="border border-vsc-border rounded bg-vsc-bg overflow-hidden">
      {!ready && (
        <div className="flex items-center gap-2 px-3 py-2 text-[10px] text-vsc-text-muted border-b border-vsc-border">
          <Loader2 className="w-3 h-3 animate-spin" />
          Highlighting…
        </div>
      )}
      <div className="max-h-[min(28rem,50vh)] overflow-auto themed-scrollbar text-[12px]">
        <div className="min-w-max py-2">
          {lines.map((line, i) => (
            <div key={i} className="flex leading-6 min-h-[1.5rem] hover:bg-white/[0.02]">
              <div className="w-12 shrink-0 text-right pr-3 text-[10px] text-vsc-text-muted/40 select-none border-r border-vsc-border/30">
                {i + 1}
              </div>
              <div className="flex-1 pr-4 pl-3">
                {ready && highlightedLines[i] ? (
                  <div
                    className="shiki-code"
                    dangerouslySetInnerHTML={{ __html: highlightedLines[i]! }}
                  />
                ) : (
                  <code className="opacity-40">{line}</code>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .shiki-code pre { background: transparent !important; margin: 0; padding: 0; }
        .shiki-code code { background: transparent !important; }
      `}</style>
    </div>
  );
}
