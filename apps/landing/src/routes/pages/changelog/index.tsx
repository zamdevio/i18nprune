import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import PageHero from "../../../components/page-hero";
import { getDocsUrl } from "../../../constants/links";
import { DISPLAY_CARD_TITLE } from "../../../constants/typography";
import { useRevealOnPage } from "../../../hooks/useRevealOnPage";
import { getValidatedChangelogEntries } from "./data";

function formatDateLabel(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "2-digit" }).format(parsed);
}

export default function ChangelogPage() {
  useRevealOnPage("changelog");
  const entries = getValidatedChangelogEntries();

  return (
    <main className="bg-background pb-24 md:pb-32">
      <PageHero
        eyebrow="Changelog"
        title="Product and contract history"
        description="Release notes for i18nprune CLI, JSON contracts, docs, and web surfaces. Built as an append-only, structured timeline."
      >
        <a
          href={getDocsUrl("changelog/README")}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-glow inline-flex items-center gap-2 rounded-full bg-sidebar-primary px-6 py-2.5 text-sm font-bold text-sidebar-primary-foreground transition-all"
        >
          Changelog docs
          <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
      </PageHero>

      <div className="mx-auto max-w-6xl space-y-8 px-4 pt-8 sm:px-6 sm:pt-12">
        {entries.length === 0 ? (
          <section className="reveal rounded-xl border border-border bg-card p-6 sm:p-8">
            <h2 className={DISPLAY_CARD_TITLE}>No published entries yet</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
              This page is ready. The first release note appears after the first public version is cut. Until then, see
              the docs placeholder for planned release-note conventions.
            </p>
          </section>
        ) : (
          entries.map((entry) => (
            <section key={`${entry.version}-${entry.date}`} className="reveal rounded-xl border border-border bg-card p-6 sm:p-8">
              <header className="border-b border-border pb-4">
                <h2 className={DISPLAY_CARD_TITLE}>{entry.version}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{formatDateLabel(entry.date)}</p>
              </header>

              {entry.highlights.length > 0 ? (
                <div className="mt-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-primary">Highlights</p>
                  <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground md:text-base">
                    {entry.highlights.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {entry.sections.length > 0 ? (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {entry.sections.map((section) => (
                    <article key={`${entry.version}-${section.title}`} className="rounded-lg border border-border/80 bg-secondary/20 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-sidebar-primary">{section.type}</p>
                      <h3 className="mt-1 text-sm font-semibold text-foreground md:text-base">{section.title}</h3>
                      <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
                        {section.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              ) : null}

              {entry.links?.length ? (
                <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                  {entry.links.map((link) => (
                    <a
                      key={`${entry.version}-${link.href}`}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-sidebar-primary underline-offset-4 hover:underline"
                    >
                      {link.label}
                      <ExternalLink className="h-3 w-3 opacity-70" aria-hidden />
                    </a>
                  ))}
                </div>
              ) : null}
            </section>
          ))
        )}

        <div className="reveal text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            Back to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
