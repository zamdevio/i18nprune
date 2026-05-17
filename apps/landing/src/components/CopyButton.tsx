import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface Props {
  text: string;
  className?: string;
  testId?: string;
}

export default function CopyButton({ text, className = '', testId }: Props) {
  const [copied, setCopied] = useState(false);

  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={handle}
      data-testid={testId ?? 'copy-button'}
      aria-label="Copy to clipboard"
      className={`inline-flex items-center justify-center w-8 h-8 rounded-md border border-border/60 bg-card/60 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all ${className}`}
    >
      <span className="relative w-3.5 h-3.5">
        <Copy
          className={`absolute inset-0 w-3.5 h-3.5 transition-all duration-300 ${
            copied ? 'opacity-0 scale-50 rotate-45' : 'opacity-100 scale-100 rotate-0'
          }`}
        />
        <Check
          className={`absolute inset-0 w-3.5 h-3.5 text-primary transition-all duration-300 ${
            copied ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-45'
          }`}
        />
      </span>
    </button>
  );
}
