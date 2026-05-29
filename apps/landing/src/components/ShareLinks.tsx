import { useState } from 'react';
import { Check, Link2, Linkedin } from 'lucide-react';
import {
  linkedInShareUrl,
  mastodonShareHint,
  sharePageUrl,
  twitterShareUrl,
} from '../lib/share';

type ShareLinksProps = {
  className?: string;
  /** Compact row for footer; default includes a short label */
  variant?: 'footer' | 'inline';
};

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      />
    </svg>
  );
}

export default function ShareLinks({ className = '', variant = 'footer' }: ShareLinksProps) {
  const [copied, setCopied] = useState(false);
  const pageUrl = sharePageUrl();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard denied — share URLs still work */
    }
  };

  const btn =
    'inline-flex items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors';

  return (
    <div className={className} data-testid="share-links">
      {variant === 'footer' && (
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">
          Share
        </p>
      )}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Share this page">
        <a
          href={twitterShareUrl(pageUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className={btn}
          data-testid="share-twitter"
        >
          <XIcon className="w-3.5 h-3.5" />
          Post
        </a>
        <a
          href={linkedInShareUrl(pageUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className={btn}
          data-testid="share-linkedin"
        >
          <Linkedin className="w-3.5 h-3.5" />
          LinkedIn
        </a>
        <button type="button" onClick={copyLink} className={btn} data-testid="share-copy">
          {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Link2 className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy link'}
        </button>
        <a
          href={`https://mastodonshare.com/?text=${encodeURIComponent(mastodonShareHint(pageUrl))}&url=${encodeURIComponent(pageUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={btn}
          data-testid="share-mastodon"
        >
          Mastodon
        </a>
      </div>
    </div>
  );
}
