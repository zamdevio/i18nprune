import { Link } from "react-router-dom";
import { Github, Twitter, Linkedin, ExternalLink } from "lucide-react";
import { LINKS } from "../../constants/links";
import { FOOTER_LINKS } from "../../constants/footer";
import VersionBadge from "../version";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background py-16">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between lg:gap-10 xl:gap-14">
          <div className="max-w-md shrink-0 lg:max-w-sm">
            <Link to="/" className="group mb-6 flex w-fit items-center gap-2">
              <img
                src="/favicon.svg"
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 shrink-0 rounded-lg transition-transform group-hover:scale-105"
              />
              <span className="font-display text-xl font-bold tracking-tight text-foreground">
                i18nprune
              </span>
              <VersionBadge className="!normal-case !tracking-normal" />
            </Link>
            <p className="mb-8 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The production i18n toolkit for modern engineering teams. 
              Built for validation, sync, generation, and cleanup.
            </p>
            <div className="flex items-center gap-4">
              <a 
                href={LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-sidebar-primary"
              >
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground transition-colors hover:text-sidebar-primary">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground transition-colors hover:text-sidebar-primary">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="grid min-w-0 flex-1 grid-cols-2 gap-10 sm:grid-cols-3 sm:gap-x-8 lg:gap-x-10">
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category} className="min-w-0">
              <h4 className="mb-6 text-sm font-bold uppercase tracking-widest text-foreground">
                {category}
              </h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a 
                        href={link.href} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-underline inline-flex w-fit items-center gap-1 text-sm transition-colors hover:text-sidebar-primary"
                      >
                        {link.label}
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                      </a>
                    ) : (
                      <Link 
                        to={link.href}
                        className="link-underline inline-flex w-fit items-center gap-1 text-sm transition-colors hover:text-sidebar-primary"
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

        <div className="mt-16 border-t border-border/60 pt-8 text-center text-xs text-muted-foreground md:text-left">
          <p>© {new Date().getFullYear()} zamdevio. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
