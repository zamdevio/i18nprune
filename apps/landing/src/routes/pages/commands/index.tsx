import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import CodeBlock from "../../../components/code-block";
import PageHero from "../../../components/page-hero";
import Terminal from "../../../components/terminal";
import { getDocsUrl } from "../../../constants/links";
import { commandExamplesHref, COMMAND_CATEGORIES, primaryDocHref } from "./data";
import type { CommandDocLink, CommandSection } from "../../../types/commands-page";
import { useRevealOnPage } from "../../../hooks/useRevealOnPage";

function DocLinks({ links }: { links: CommandDocLink[] }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
      {links.map((item) => (
        <li key={item.path}>
          <a
            href={getDocsUrl(item.path)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-sidebar-primary underline-offset-4 hover:underline"
          >
            {item.label}
            <ExternalLink className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  );
}

function CommandBlock({ section }: { section: CommandSection }) {
  const examplesHref = commandExamplesHref(section.slug);
  return (
    <article
      id={section.slug}
      className="scroll-mt-28 rounded-xl border border-border bg-card p-6 md:p-8"
    >
      <div className="flex flex-col gap-2 border-b border-border/80 pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="font-mono text-xl font-semibold text-foreground md:text-2xl">{section.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">{section.summary}</p>
          {section.detail ? (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{section.detail}</p>
          ) : null}
        </div>
        <div className="mt-2 flex shrink-0 items-center gap-2 md:mt-0">
          <a
            href={primaryDocHref(section.slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-sidebar-primary hover:bg-secondary/50"
          >
            Command docs
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
          {examplesHref ? (
            <a
              href={examplesHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-sidebar-primary hover:bg-secondary/50"
            >
              Full examples
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-6 space-y-8">
        {section.examples.map((ex) => (
          <div key={ex.caption}>
            <CodeBlock caption={ex.caption} code={ex.code} lang={ex.lang} />
            {ex.outcome ? (
              <p className="mt-2 text-xs text-muted-foreground md:text-sm">
                <span className="font-semibold text-foreground/80">Expected: </span>
                {ex.outcome}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      {section.sessionTerminal?.length ? (
        <div className="mt-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Interactive session
          </p>
          <Terminal 
            title="~/your-repo" 
            sessions={[
              { id: section.slug, label: section.title.toLowerCase(), command: `i18nprune ${section.title.toLowerCase()}`, lines: section.sessionTerminal }
            ]} 
          />
        </div>
      ) : null}

      {section.moreLinks?.length ? <DocLinks links={section.moreLinks} /> : null}
    </article>
  );
}

export default function CommandsPage() {
  useRevealOnPage("commands");

  return (
    <main className="bg-background pb-24 md:pb-32">
      <PageHero
        eyebrow="Commands"
        title="CLI reference — examples & outcomes"
        description={
          <>
            Run{" "}
            <code className="rounded-md bg-secondary/80 px-1.5 py-0.5 font-mono text-[0.9em] text-foreground">
              i18nprune
            </code>{" "}
            from your PATH (npm/pnpm global or project scripts). Each command below links to the full docs for flags,
            edge cases, and CI patterns — this page focuses on copy-pasteable flows and what you should expect on stdout,
            exit codes, and files.
          </>
        }
      >
        <Link
          to="/examples"
          className="btn-glow inline-flex items-center gap-2 rounded-full bg-sidebar-primary px-6 py-2.5 text-sm font-bold text-sidebar-primary-foreground transition-all"
        >
          Examples
        </Link>
        <Link
          to="/api"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-6 py-2.5 text-sm font-semibold backdrop-blur transition-colors hover:border-sidebar-primary"
        >
          Programmatic API
        </Link>
      </PageHero>

      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-12">
        <aside className="reveal mb-8 rounded-lg border border-border/80 bg-secondary/30 px-4 py-3 text-left text-sm leading-relaxed text-muted-foreground sm:mb-10 md:px-5 md:py-4">
          <strong className="font-medium text-foreground">Global flags and CI:</strong>{" "}
          <code className="rounded bg-secondary/80 px-1 py-0.5 font-mono text-xs">--json</code> makes duplicate{" "}
          <code className="rounded bg-secondary/80 px-1 py-0.5 font-mono text-xs">i18nprune.config.*</code> files fail
          unless you pass{" "}
          <code className="rounded bg-secondary/80 px-1 py-0.5 font-mono text-xs">-c</code> /{" "}
          <code className="rounded bg-secondary/80 px-1 py-0.5 font-mono text-xs">--config</code>; with no config file,
          implicit bootstrap matches{" "}
          <code className="rounded bg-secondary/80 px-1 py-0.5 font-mono text-xs">--yes</code>. Commands that emit JSON
          should put machine-readable failures in{" "}
          <code className="rounded bg-secondary/80 px-1 py-0.5 font-mono text-xs">issues[]</code> (e.g.{" "}
          <code className="rounded bg-secondary/80 px-1 py-0.5 font-mono text-xs">validate</code> when the source locale
          cannot be read). Details:{" "}
          <a
            href={getDocsUrl("behavior/README")}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sidebar-primary underline-offset-4 hover:underline"
          >
            Behavior: interactivity and exit codes
            <ExternalLink className="mb-0.5 ml-0.5 inline h-3 w-3 opacity-70" aria-hidden />
          </a>
          .
        </aside>
        <nav
          aria-label="On this page"
          className="reveal mb-12 rounded-xl border border-dashed border-border bg-secondary/20 p-4 md:p-6"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Jump to section</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {COMMAND_CATEGORIES.map((c) => (
              <a
                key={c.id}
                href={`#cat-${c.id}`}
                className="rounded-md border border-sidebar-primary/30 bg-sidebar-primary/10 px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:border-sidebar-primary"
              >
                {c.title}
              </a>
            ))}
          </div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Commands</p>
          <div className="flex flex-wrap gap-2">
            {COMMAND_CATEGORIES.flatMap((c) =>
              c.commands.map((cmd: CommandSection) => (
                <a
                  key={cmd.slug}
                  href={`#${cmd.slug}`}
                  className="rounded-md border border-border bg-card px-2.5 py-1 font-mono text-xs text-foreground transition-colors hover:border-sidebar-primary"
                >
                  {cmd.title}
                </a>
              )),
            )}
          </div>
        </nav>

        <div className="space-y-16">
          {COMMAND_CATEGORIES.map((cat, ci) => (
            <section
              key={cat.id}
              id={`cat-${cat.id}`}
              className={`reveal reveal-delay-${Math.min(ci + 1, 3)} scroll-mt-24 space-y-8`}
            >
              <header className="border-b border-border pb-2">
                <h2 className="font-display text-3xl font-semibold text-foreground">{cat.title}</h2>
                {cat.intro ? (
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
                    {cat.intro}
                  </p>
                ) : null}
              </header>
              <div className="space-y-10">
                {cat.commands.map((cmd) => (
                  <div key={cmd.slug}>
                    <CommandBlock section={cmd} />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="reveal mt-16 flex flex-col items-center gap-4 border-t border-border pt-12 text-center sm:flex-row sm:justify-center">
          <a
            href={getDocsUrl("workflow/README")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-sidebar-primary hover:bg-card"
          >
            Workflow guide
            <ExternalLink className="h-4 w-4" />
          </a>
          <Link
            to="/workflow"
            className="inline-flex rounded-md border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-sidebar-primary hover:bg-card"
          >
            Product workflow page
          </Link>
        </div>
        <div className="reveal mt-6 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            Back to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
