import { linkHref } from '../lib/meta';
import { useMeta } from '../context/MetaContext';

export default function Footer() {
  const year = new Date().getFullYear();
  const { links, cliVersion } = useMeta();
  return (
    <footer className="relative border-t border-border/40 bg-background" data-testid="site-footer">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <img src="/i18nprune.svg" alt="i18nprune" className="w-6 h-6 rounded-md" />
              <span className="font-display font-semibold tracking-tight">i18nprune</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Compiler-grade i18n infrastructure. Validate, sync, generate, and prune
              translations across every locale, in CI, on the edge.
            </p>
          </div>
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">
              Product
            </h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
              <li><a href="#commands" className="hover:text-primary transition-colors">Commands</a></li>
              <li><a href="#install" className="hover:text-primary transition-colors">Install</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">
              Resources
            </h4>
            <ul className="space-y-2 text-sm">
              <li><a href={linkHref(links, 'docs')} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Documentation</a></li>
              <li><a href={linkHref(links, 'githubRepo')} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">GitHub</a></li>
              <li><a href={linkHref(links, 'npmCli')} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">npm</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground font-mono">
            MIT licensed · © {year} zamdevio
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            v{cliVersion} · Built for engineers shipping at the speed of CI
          </p>
        </div>
      </div>
    </footer>
  );
}
