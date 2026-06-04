import React from "react";

export default function SiteFooter() {
  return (
    <footer className="border-t border-border/60 mt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} i18nprune — Release Portal
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <a href="https://i18nprune.dev" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              Product
            </a>
            <a href="https://docs.i18nprune.dev" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              Docs
            </a>
            <a href="https://www.npmjs.com/package/i18nprune" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              npm
            </a>
            <a href="/feed.xml" className="hover:text-foreground transition-colors">
              RSS
            </a>
            <a href="/sitemap.xml" className="hover:text-foreground transition-colors">
              Sitemap
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
