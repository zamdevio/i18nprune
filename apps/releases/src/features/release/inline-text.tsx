import type { ReactNode } from 'react';

export const inlineCodeClassName =
  'rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground border border-border/60';

const INLINE_CODE_RE = /`([^`]+)`/g;

/** Split release copy on `` `...` `` spans and render inline code styling. */
export function parseInlineCode(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  INLINE_CODE_RE.lastIndex = 0;
  while ((match = INLINE_CODE_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <code key={key++} className={inlineCodeClassName}>
        {match[1]}
      </code>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

type ReleaseInlineTextProps = {
  text: string;
  className?: string;
};

export default function ReleaseInlineText({ text, className }: ReleaseInlineTextProps) {
  return <span className={className}>{parseInlineCode(text)}</span>;
}
