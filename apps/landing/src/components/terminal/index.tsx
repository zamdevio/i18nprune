import { useState, useEffect, useRef } from "react";
import { Check, Copy, RotateCcw } from "lucide-react";
import type { CSSProperties } from "react";
import { useTheme } from "../../hooks/useTheme";
import type { TerminalLine } from "../../types/terminal";

interface TerminalSession {
  id: string;
  label: string;
  command: string;
  lines: TerminalLine[];
}

interface TerminalProps {
  sessions: TerminalSession[];
  title?: string;
  className?: string;
}

function JsonHighlighter({ text }: { text: string }) {
  const parts = text.split(/(".*?"|[:{},[\]]|\d+|true|false|null)/g);

  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (!part) return null;

        if (part.startsWith('"') && parts[i + 1] === ":") {
          return (
            <span key={i} className="text-blue-600 dark:text-blue-400">
              {part}
            </span>
          );
        }

        if (part.startsWith('"')) {
          return (
            <span key={i} className="text-emerald-600 dark:text-emerald-400">
              {part}
            </span>
          );
        }

        if (/^\d+$/.test(part) || part === "true" || part === "false" || part === "null") {
          return (
            <span key={i} className="text-emerald-600 dark:text-emerald-400">
              {part}
            </span>
          );
        }

        if (/[:{},[\]]/.test(part)) {
          return (
            <span key={i} className="text-foreground/40 dark:text-foreground/60">
              {part}
            </span>
          );
        }

        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

/** Bash command line using the same Shiki themes as `CodeBlock` (github-light / github-dark). */
function TerminalPromptShiki({
  command,
  visible,
  className = "",
  style,
}: {
  command: string;
  visible: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const { theme } = useTheme();
  const [html, setHtml] = useState("");

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    void import("../../lib/shiki-highlight").then(({ highlightCode }) =>
      highlightCode(command, "bash", theme).then((h) => {
        if (!cancelled) setHtml(h);
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [command, theme, visible]);

  if (!visible) return null;

  return (
    <span className={className} style={style}>
      <span className="select-none font-bold text-emerald-600 dark:text-emerald-400">$ </span>
      {html ? (
        <span
          className="terminal-shiki-inline inline align-baseline font-mono text-[13px] leading-relaxed md:text-sm [&_.shiki]:!bg-transparent [&_code]:!bg-transparent [&_code]:!p-0 [&_code]:font-mono [&_code]:text-[13px] [&_pre]:!m-0 [&_pre]:!inline [&_pre]:!bg-transparent [&_pre]:!p-0 [&_pre]:align-baseline [&_pre]:font-mono [&_pre]:text-[13px]"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <span className="font-medium text-sidebar-primary">{command}</span>
      )}
    </span>
  );
}

function Line({ line, visible }: { line: TerminalLine; visible: boolean }) {
  if (!visible) return null;

  const customStyle = line.color ? { color: line.color } : {};
  const baseClass = line.className || "";

  switch (line.kind) {
    case "comment":
      return (
        <span
          style={customStyle}
          className={`text-muted-foreground/60 italic dark:text-muted-foreground/70 ${baseClass}`}
        >
          {line.text}
        </span>
      );
    case "prompt":
      return (
        <TerminalPromptShiki
          command={line.text}
          visible={visible}
          className={baseClass}
          style={customStyle}
        />
      );
    case "out":
      return (
        <span
          style={customStyle}
          className={`text-muted-foreground dark:text-muted-foreground/90 ${baseClass}`}
        >
          {line.text}
        </span>
      );
    case "ok":
      return (
        <span
          style={customStyle}
          className={`font-medium text-emerald-600 dark:text-emerald-400 ${baseClass}`}
        >
          {line.text}
        </span>
      );
    case "json":
      return (
        <span className={baseClass} style={customStyle}>
          <JsonHighlighter text={line.text} />
        </span>
      );
    default:
      return null;
  }
}

export default function Terminal({
  sessions,
  title = "i18nprune — terminal",
  className = "",
}: TerminalProps) {
  const [activeSessionId, setActiveSessionId] = useState(sessions[0]?.id);
  const [visibleLinesCount, setVisibleLinesCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetAndPlay = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setActiveSessionId(sessionId);
    setVisibleLinesCount(0);
    setIsTyping(true);

    const lines = session.lines;
    let current = 0;
    const playNext = () => {
      if (current < lines.length) {
        setVisibleLinesCount((prev) => prev + 1);
        current++;
        const delay = lines[current - 1]?.kind === "prompt" ? 800 : 150;
        timerRef.current = setTimeout(playNext, delay);
      } else {
        setIsTyping(false);
      }
    };

    timerRef.current = setTimeout(playNext, 400);
  };

  useEffect(() => {
    const first = sessions[0];
    if (first) resetAndPlay(first.id);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const copy = async () => {
    const text = activeSession.lines
      .map((l) => (l.kind === "prompt" ? `$ ${l.text}` : l.text))
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className={`terminal-window overflow-hidden rounded-xl border border-border bg-card/95 text-left shadow-2xl shadow-black/40 backdrop-blur-md ${className}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/80 bg-secondary/30 px-3 py-2">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
          </div>
          <span className="font-mono text-[11px] font-medium text-muted-foreground">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => resetAndPlay(activeSessionId ?? sessions[0]?.id ?? "")}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            title="Replay"
            type="button"
          >
            <RotateCcw className={`h-3 w-3 ${isTyping ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={copy}
            type="button"
            className="flex items-center gap-1 rounded-md border border-border/80 bg-card/95 px-2 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur transition-all hover:border-sidebar-primary/50 hover:bg-secondary hover:text-foreground"
          >
            {copied ? <Check className="h-3 w-3 text-sidebar-primary" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border/40 bg-secondary/10 p-1.5">
        {sessions.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => resetAndPlay(s.id)}
            className={`rounded-md px-2.5 py-1 font-mono text-[11px] font-semibold transition-all ${
              activeSessionId === s.id
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="relative min-h-[min(300px,42vh)] max-h-[min(28rem,52vh)] w-full min-w-0 max-w-full overflow-auto bg-[#f8f9fa] p-4 font-mono text-[13px] leading-relaxed sm:p-6 md:text-sm dark:bg-[#0d1117]">
        <div className="min-w-0 space-y-1.5">
          {activeSession.lines.map((line, i) => (
            <div key={`${activeSessionId}-${i}`} className="block">
              <Line line={line} visible={i < visibleLinesCount} />
            </div>
          ))}
          {isTyping ? (
            <span className="ml-1 inline-block h-[1.2em] w-2 animate-pulse bg-sidebar-primary/80 align-middle shadow-[0_0_12px_hsl(var(--sidebar-primary)/0.6)]" />
          ) : null}
        </div>
      </div>
    </div>
  );
}
