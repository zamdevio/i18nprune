import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import PageHero from "../../../components/page-hero";
import Terminal from "../../../components/terminal";
import { workflowPipelineTerminal } from "./terminal";
import { getDocsUrl } from "../../../constants/links";
import { DISPLAY_CARD_TITLE } from "../../../constants/typography";
import { useRevealOnPage } from "../../../hooks/useRevealOnPage";

function DocLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-sidebar-primary underline-offset-4 hover:underline"
    >
      {children}
      <ExternalLink className="mb-0.5 ml-0.5 inline h-3 w-3 opacity-70" aria-hidden />
    </a>
  );
}

export default function WorkflowPage() {
  useRevealOnPage("workflow");

  return (
    <main className="bg-background pb-24 md:pb-32">
      <PageHero
        eyebrow="Workflow"
        title="Detect, repair, prove"
        maxWidthClass="max-w-5xl"
        description="A pipeline you can repeat locally and in CI: surface drift, align locale files with policy, then emit artifacts reviewers and automation both trust. Details and flags live in the docs — this page is the spine."
      >
        <Link
          to="/commands"
          className="btn-glow inline-flex items-center gap-2 rounded-full bg-sidebar-primary px-6 py-2.5 text-sm font-bold text-sidebar-primary-foreground transition-all"
        >
          CLI reference
        </Link>
        <Link
          to="/examples"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-6 py-2.5 text-sm font-semibold backdrop-blur transition-colors hover:border-sidebar-primary"
        >
          Examples
        </Link>
      </PageHero>

      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 pt-8 sm:space-y-10 sm:px-6 sm:pt-12 lg:max-w-7xl">
        <section className="reveal w-full rounded-xl border border-border bg-card p-5 sm:p-8 md:p-10 lg:p-12">
          <h2 className={DISPLAY_CARD_TITLE}>Step 1 — Detect</h2>
          <p className="mt-4 max-w-none text-sm leading-relaxed text-muted-foreground md:text-base">
            <strong className="font-medium text-foreground">What:</strong> compare literal translation keys in source to
            your source locale JSON; surface non-literal call sites as dynamic-key locations.
          </p>
          <p className="mt-3 max-w-none text-sm leading-relaxed text-muted-foreground md:text-base">
            <strong className="font-medium text-foreground">Why:</strong> you fix drift before it becomes silent wrong
            strings in production locales.
          </p>
          <p className="mt-3 max-w-none text-sm leading-relaxed text-muted-foreground md:text-base">
            <strong className="font-medium text-foreground">Where:</strong>{" "}
            <DocLink href={getDocsUrl("commands/validate/README")}>validate</DocLink>,{" "}
            <DocLink href={getDocsUrl("commands/missing/README")}>missing</DocLink>,{" "}
            <DocLink href={getDocsUrl("barriers/dynamic-keys")}>dynamic keys</DocLink>. Use{" "}
            <code className="font-mono text-xs">validate --json</code> when a machine report should drive automation.
          </p>
        </section>

        <section className="reveal reveal-delay-1 w-full rounded-xl border border-border bg-card p-5 sm:p-8 md:p-10 lg:p-12">
          <h2 className={DISPLAY_CARD_TITLE}>Step 2 — Repair</h2>
          <p className="mt-4 max-w-none text-sm leading-relaxed text-muted-foreground md:text-base">
            <strong className="font-medium text-foreground">What:</strong> merge and prune locale files to match the
            catalog, add missing paths, optionally remove dead keys with safety checks, run generate (including{" "}
            <code className="font-mono text-xs">--resume</code>) when copy needs refresh.
          </p>
          <p className="mt-3 max-w-none text-sm leading-relaxed text-muted-foreground md:text-base">
            <strong className="font-medium text-foreground">Why:</strong> structure and content move together — not a
            one-off JSON edit per PR.
          </p>
          <p className="mt-3 max-w-none text-sm leading-relaxed text-muted-foreground md:text-base">
            <strong className="font-medium text-foreground">Where:</strong>{" "}
            <DocLink href={getDocsUrl("commands/sync/README")}>sync</DocLink>,{" "}
            <DocLink href={getDocsUrl("commands/cleanup/README")}>cleanup</DocLink>,{" "}
            <DocLink href={getDocsUrl("config/policies/README")}>policies</DocLink>,{" "}
            <DocLink href={getDocsUrl("commands/generate/README")}>generate</DocLink>{" "}
            (<code className="font-mono text-xs">--resume</code> for top-ups).
          </p>
        </section>

        <section className="reveal reveal-delay-2 w-full rounded-xl border border-border bg-card p-5 sm:p-8 md:p-10 lg:p-12">
          <h2 className={DISPLAY_CARD_TITLE}>Step 3 — Prove</h2>
          <p className="mt-4 max-w-none text-sm leading-relaxed text-muted-foreground md:text-base">
            <strong className="font-medium text-foreground">What:</strong> emit HTML/JSON/CSV/text reports and keep machine
            outputs on stdout with <code className="font-mono text-xs">--json</code>; persist with shell redirection when needed.
          </p>
          <p className="mt-3 max-w-none text-sm leading-relaxed text-muted-foreground md:text-base">
            <strong className="font-medium text-foreground">Why:</strong> humans get a shareable artifact; automation
            keeps parsing the same envelope as local runs.
          </p>
          <p className="mt-3 max-w-none text-sm leading-relaxed text-muted-foreground md:text-base">
            <strong className="font-medium text-foreground">Where:</strong>{" "}
            <DocLink href={getDocsUrl("commands/report/README")}>report</DocLink>,{" "}
            <DocLink href={getDocsUrl("report/README")}>report UI</DocLink>,{" "}
            <DocLink href={getDocsUrl("json/README")}>JSON output</DocLink>.
          </p>
        </section>

        <section className="reveal w-full rounded-xl border border-border bg-card p-5 sm:p-8 md:p-10 lg:p-12">
          <h2 className={DISPLAY_CARD_TITLE}>Config and sanity checks</h2>
          <p className="mt-3 max-w-none text-sm leading-relaxed text-muted-foreground md:text-base">
            Merge order and discovery warnings are the same in CI as locally — if something is wrong, fix it before you
            trust JSON output. <DocLink href={getDocsUrl("commands/config/README")}>config</DocLink> prints merged values;{" "}
            <DocLink href={getDocsUrl("commands/doctor/README")}>doctor</DocLink> checks Node, ripgrep, paths, and optional{" "}
            <code className="font-mono text-xs">--json</code>.
          </p>
        </section>

        <section className="reveal w-full rounded-xl border border-dashed border-border bg-secondary/20 p-5 sm:p-8 md:p-10 lg:p-12">
          <h2 className={DISPLAY_CARD_TITLE}>CI sketch</h2>
          <ul className="mt-4 max-w-none list-inside list-disc space-y-2 text-sm text-muted-foreground md:text-base">
            <li>
              Install CLI; run <DocLink href={getDocsUrl("commands/doctor/README")}>doctor</DocLink> locally until clean for
              your matrix.
            </li>
            <li>
              Run <code className="font-mono text-xs">validate --json</code> (and other JSON gates you need); fail on
              non-zero exit and/or <code className="font-mono text-xs">.ok === false</code>.
            </li>
            <li>
              Long-running or interactive flows: <DocLink href={getDocsUrl("behavior/json-long")}>JSON + long runs</DocLink>.
            </li>
          </ul>
          <div className="mt-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Interactive pipeline
            </p>
            <Terminal 
              title="~/repo" 
              sessions={[
                { id: "pipeline", label: "pipeline", command: "i18nprune pipeline", lines: workflowPipelineTerminal }
              ]} 
            />
          </div>
        </section>

        <div className="reveal text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            Back to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
