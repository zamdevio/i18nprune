import { Button } from '@/components/ui/button';
import {
  buildInstallSnippets,
  PACKAGE_MANAGERS,
  type InstallTarget,
  type PackageManager,
} from '@/lib/install-snippets';
import { cn } from '@/lib/cn';
import { copyText } from '@i18nprune/ui/utils/clipboard';
import { Check, Copy, Terminal } from 'lucide-react';
import { useMemo, useState } from 'react';

type InstallTabsProps = {
  target: InstallTarget;
  compact?: boolean;
};

export default function InstallTabs({ target, compact = false }: InstallTabsProps) {
  const snippets = useMemo(() => buildInstallSnippets(target), [target]);
  const [manager, setManager] = useState<PackageManager>('npm');
  const [copied, setCopied] = useState(false);
  const snippet = snippets[manager];

  const handleCopy = async () => {
    await copyText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted font-mono text-xs text-foreground hover:bg-accent transition-colors group"
        title={`Copy (${manager})`}
      >
        <Terminal className="h-3 w-3 text-muted-foreground" />
        <span className="truncate max-w-[200px]">{snippet}</span>
        {copied ? (
          <Check className="h-3 w-3 text-primary shrink-0" />
        ) : (
          <Copy className="h-3 w-3 text-muted-foreground group-hover:text-foreground shrink-0" />
        )}
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
      <div className="flex border-b border-border bg-muted/50">
        {PACKAGE_MANAGERS.map((pm) => (
          <button
            key={pm}
            type="button"
            onClick={() => setManager(pm)}
            className={cn(
              'flex-1 px-3 py-2 text-xs font-medium uppercase tracking-wide transition-colors',
              manager === pm
                ? 'bg-background text-foreground border-b-2 border-primary -mb-px'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
            )}
          >
            {pm}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/50">
        <Terminal className="h-4 w-4 text-muted-foreground shrink-0" />
        <code className="flex-1 font-mono text-sm text-foreground truncate">{snippet}</code>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleCopy}>
          {copied ? (
            <Check className="h-4 w-4 text-primary" />
          ) : (
            <Copy className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
    </div>
  );
}
