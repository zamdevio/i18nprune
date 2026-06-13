import type { ReactNode } from 'react';
import { inlineCodeClassName } from '@/features/release/inline-text';

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightPlainText(text: string, tokens: readonly string[], keyOffset: number): ReactNode[] {
  const normalized = tokens.map((t) => t.trim().toLowerCase()).filter((t) => t.length >= 2);
  if (!normalized.length) return [text];

  const pattern = new RegExp(`(${normalized.map(escapeRegex).join('|')})`, 'gi');
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    const isMatch = normalized.some((t) => part.toLowerCase() === t);
    if (!isMatch) {
      return <span key={`${keyOffset}-${index}-${part.slice(0, 8)}`}>{part}</span>;
    }
    return (
      <mark
        key={`${keyOffset}-${index}-${part}`}
        className="rounded-sm bg-primary/25 px-0.5 font-medium text-foreground ring-1 ring-primary/30"
      >
        {part}
      </mark>
    );
  });
}

const INLINE_CODE_RE = /`([^`]+)`/g;

/** Search highlight that preserves `` `inline code` `` spans from release YAML copy. */
export function highlightInlineText(text: string, tokens: readonly string[]): ReactNode {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  INLINE_CODE_RE.lastIndex = 0;
  while ((match = INLINE_CODE_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(...highlightPlainText(text.slice(lastIndex, match.index), tokens, key));
      key += 100;
    }
    parts.push(
      <code key={key++} className={inlineCodeClassName}>
        {match[1]}
      </code>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(...highlightPlainText(text.slice(lastIndex), tokens, key));
  }

  return parts.length > 0 ? parts : highlightTokens(text, tokens);
}

export function highlightTokens(text: string, tokens: readonly string[]): ReactNode {
  const highlighted = highlightPlainText(text, tokens, 0);
  return highlighted.length === 1 ? highlighted[0] : highlighted;
}
