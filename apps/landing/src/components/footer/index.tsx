import { Link } from "react-router-dom";
import { Github, Twitter, ExternalLink } from "lucide-react";
import { LINKS } from "../../constants/links";
import { FOOTER_LINKS } from "../../constants/footer";
import VersionBadge from "../version";

export function Footer() {
  return (
    <footer className="relative border-t border-border/40 bg-background/50 py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-secondary/20 pointer-events-none" />
      <div className="grid-texture absolute inset-0 z-0 opacity-20 pointer-events-none" />
      
      <div className="container relative z-10 mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between lg:gap-10 xl:gap-14">
          <div className="max-w-md shrink-0 lg:max-w-sm">
            <Link to="/" className="group mb-8 flex w-fit items-center gap-3">
              <img
                src="/i18nprune.svg"
                alt="i18nprune logo"
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 object-contain transition-transform group-hover:scale-105"
              />
              <span className="font-display text-2xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                i18nprune
              </span>
            </Link>
            <p className="mb-8 max-w-sm text-base leading-relaxed text-muted-foreground font-medium">
              The production i18n toolkit for modern engineering teams. 
              Built for validation, sync, generation, and cleanup directly in CI.
            </p>
            <div className="flex items-center gap-5">
              <a 
                href={LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-10 w-10 items-center justify-center rounded-full bg-secondary/50 text-muted-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:scale-110"
              >
                <Github className="h-5 w-5" />
              </a>
              <a href="https://x.com/zamdevio" className="group flex h-10 w-10 items-center justify-center rounded-full bg-secondary/50 text-muted-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:scale-110">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="grid min-w-0 flex-1 grid-cols-2 gap-10 sm:grid-cols-3 sm:gap-x-8 lg:gap-x-12 xl:gap-x-16">
            {Object.entries(FOOTER_LINKS).map(([category, links]) => (
              <div key={category} className="min-w-0">
                <h4 className="mb-6 text-sm font-bold uppercase tracking-widest text-foreground">
                  {category}
                </h4>
                <ul className="space-y-4 text-base font-medium text-muted-foreground">
                  {links.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a 
                          href={link.href} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex w-fit items-center gap-1.5 transition-colors hover:text-primary"
                        >
                          {link.label}
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-50 transition-opacity group-hover:opacity-100" aria-hidden />
                        </a>
                      ) : (
                        <Link 
                          to={link.href}
                          className="inline-flex w-fit items-center gap-1 transition-colors hover:text-primary"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 flex flex-col items-center justify-between gap-6 border-t border-border/40 pt-8 sm:flex-row">
          <p className="text-sm font-medium text-muted-foreground">
            © {new Date().getFullYear()} zamdevio. Released under the MIT License.
          </p>
          <div className="flex items-center gap-4">
            <VersionBadge className="!normal-case" />
          </div>
        </div>
      </div>
    </footer>
  );
}
