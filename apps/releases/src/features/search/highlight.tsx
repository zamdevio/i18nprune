import type { ReactNode } from 'react';

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function highlightTokens(text: string, tokens: readonly string[]): ReactNode {
  const normalized = tokens.map((t) => t.trim().toLowerCase()).filter((t) => t.length >= 2);
  if (!normalized.length) return text;

  const pattern = new RegExp(`(${normalized.map(escapeRegex).join('|')})`, 'gi');
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    const isMatch = normalized.some((t) => part.toLowerCase() === t);
    if (!isMatch) {
      return <span key={`${index}-${part.slice(0, 8)}`}>{part}</span>;
    }
    return (
      <mark
        key={`${index}-${part}`}
        className="rounded-sm bg-primary/25 px-0.5 font-medium text-foreground ring-1 ring-primary/30"
      >
        {part}
      </mark>
    );
  });
}
