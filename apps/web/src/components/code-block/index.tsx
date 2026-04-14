import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { CODE_LANG_LABEL } from "../../constants/code-lang";
import { useTheme } from "../../hooks/useTheme";
import type { CodeBlockProps } from "../../types/code-block";

export default function CodeBlock({ code, lang = "bash", caption, className = "" }: CodeBlockProps) {
  const { theme } = useTheme();
  const [html, setHtml] = useState("");
  const [copied, setCopied] = useState(false);
  const headerLabel = CODE_LANG_LABEL[lang];

  useEffect(() => {
    let cancelled = false;
    void import("../../lib/shiki-highlight").then(({ highlightCode: run }) =>
      run(code, lang, theme).then((out) => {
        if (!cancelled) setHtml(out);
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [code, lang, theme]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code.trimEnd());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className={className}>
      {caption ? (
        <p className="mb-2 text-xs font-medium text-muted-foreground md:text-sm">{caption}</p>
      ) : null}
      <div className="code-block-root group overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-border/80 bg-secondary/30 px-3 py-2">
          <span className="min-w-0 truncate font-mono text-xs font-medium text-muted-foreground">{headerLabel}</span>
          <button
            type="button"
            onClick={copy}
            aria-label={copied ? "Copied" : "Copy code"}
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border/80 bg-card/95 px-2 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur transition-colors hover:border-sidebar-primary/50 hover:bg-secondary hover:text-foreground"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-sidebar-primary" strokeWidth={2.5} />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" strokeWidth={2} />
                Copy
              </>
            )}
          </button>
        </div>
        {html ? (
          <div
            className="code-block-shiki overflow-x-auto px-3 py-3 [&_.shiki]:!bg-transparent [&_pre]:!m-0 [&_pre]:!bg-transparent [&_pre]:!p-0"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <pre className="overflow-x-auto px-3 py-3 font-mono text-xs text-muted-foreground">
            <code>{code.trimEnd()}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
