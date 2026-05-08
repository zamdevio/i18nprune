import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import PageHero from "../../../components/page-hero";
import Terminal from "../../../components/terminal";
import {
  featuresReportTerminal,
  featuresSyncTerminal,
  featuresValidateTerminal,
} from "./terminal";
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

export default function FeaturesPage() {
  useRevealOnPage("features");

  return (
    <main className="bg-background pb-24 md:pb-32">
      <PageHero
        eyebrow="Features"
        title="What the tool actually does"
        description="Validation, repair, and reporting are separate concerns — each with explicit commands and stable machine-readable modes. Below is a map of capabilities; flags and edge cases stay in the docs."
      >
        <Link
          to="/commands"
          className="btn-glow inline-flex items-center gap-2 rounded-full bg-sidebar-primary px-6 py-2.5 text-sm font-bold text-sidebar-primary-foreground transition-all"
        >
          Command reference
        </Link>
        <Link
          to="/api"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-6 py-2.5 text-sm font-semibold backdrop-blur transition-colors hover:border-sidebar-primary"
        >
          API &amp; JSON
        </Link>
      </PageHero>

      <div className="mx-auto max-w-6xl space-y-10 px-4 pt-8 sm:space-y-14 sm:px-6 sm:pt-12">
        <section className="reveal space-y-5 rounded-xl border border-border bg-card p-5 sm:space-y-6 sm:p-8 md:p-10">
          <h2 className={DISPLAY_CARD_TITLE}>Detection and validation</h2>
          <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
            Literal keys from your configured call patterns; missing keys against the source locale; dynamic call sites
            reported with the same heuristics the CLI documents. Diagnostics for config and environment when something is
            miswired.
          </p>
          <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
            <li>
              <DocLink href={getDocsUrl("commands/validate/README")}>validate</DocLink>,{" "}
              <DocLink href={getDocsUrl("commands/doctor/README")}>doctor</DocLink>,{" "}
              <DocLink href={getDocsUrl("commands/config/README")}>config</DocLink>
            </li>
            <li>
              <DocLink href={getDocsUrl("barriers/dynamic-keys")}>Dynamic keys</DocLink> ·{" "}
              <DocLink href={getDocsUrl("regex/README#detection-limits")}>Detection limits</DocLink>
            </li>
          </ul>
          <div className="pt-2">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Interactive — validate
            </p>
            <Terminal 
              title="~/repo" 
              sessions={[
                { id: "validate", label: "validate", command: "i18nprune validate", lines: featuresValidateTerminal }
              ]} 
            />
          </div>
        </section>

        <section className="reveal reveal-delay-1 space-y-6 rounded-xl border border-border bg-card p-5 sm:p-8 md:p-10">
          <h2 className={DISPLAY_CARD_TITLE}>Repair and locale structure</h2>
          <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
            Sync merges and prunes locale JSON to match the source shape under <code className="font-mono text-xs">policies</code>.
            Missing adds paths; cleanup removes unused keys with optional ripgrep-backed checks. Generate and fill cover
            translation workflows when you need new locales or refreshed copy.
          </p>
          <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
            <li>
              <DocLink href={getDocsUrl("commands/sync/README")}>sync</DocLink>,{" "}
              <DocLink href={getDocsUrl("commands/missing/README")}>missing</DocLink>,{" "}
              <DocLink href={getDocsUrl("commands/cleanup/README")}>cleanup</DocLink>
            </li>
            <li>
              <DocLink href={getDocsUrl("config/policies/README")}>Policies</DocLink> ·{" "}
              <DocLink href={getDocsUrl("commands/locales/README")}>locales</DocLink> subcommands
            </li>
          </ul>
          <div className="pt-2">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Interactive — sync
            </p>
            <Terminal 
              title="~/repo" 
              sessions={[
                { id: "sync", label: "sync", command: "i18nprune sync", lines: featuresSyncTerminal }
              ]} 
            />
          </div>
        </section>

        <section className="reveal reveal-delay-2 space-y-6 rounded-xl border border-border bg-card p-5 sm:p-8 md:p-10">
          <h2 className={DISPLAY_CARD_TITLE}>Automation and reporting</h2>
          <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
            Global <code className="font-mono text-xs">--json</code> on supported commands emits a single envelope (or
            documented multi-line flows). Quality and review commands support structured output for release gates;{" "}
            <code className="font-mono text-xs">report</code> writes HTML/JSON/CSV/text for humans and pipelines.
          </p>
          <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
            <li>
              <DocLink href={getDocsUrl("json/README")}>JSON output</DocLink>,{" "}
              <DocLink href={getDocsUrl("behavior/json-long")}>long runs</DocLink>
            </li>
            <li>
              <DocLink href={getDocsUrl("commands/report/README")}>report</DocLink>,{" "}
              <DocLink href={getDocsUrl("commands/quality/README")}>quality</DocLink>,{" "}
              <DocLink href={getDocsUrl("commands/review/README")}>review</DocLink>
            </li>
          </ul>
          <div className="pt-2">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Interactive — report
            </p>
            <Terminal 
              title="~/repo" 
              sessions={[
                { id: "report", label: "report", command: "i18nprune report", lines: featuresReportTerminal }
              ]} 
            />
          </div>
        </section>

        <section className="reveal rounded-xl border border-border bg-secondary/30 p-5 sm:p-8 md:p-10">
          <h2 className={DISPLAY_CARD_TITLE}>Programmatic surface</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The same primitives power the CLI and <code className="font-mono text-xs">@i18nprune/core</code> — when
            you need in-process automation without duplicating the contract. See{" "}
            <Link className="font-medium text-sidebar-primary underline-offset-4 hover:underline" to="/api">
              API
            </Link>{" "}
            and <DocLink href={getDocsUrl("exports/README")}>exports</DocLink>.
          </p>
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
