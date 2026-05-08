import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import CodeBlock from "../../../components/code-block";
import PageHero from "../../../components/page-hero";
import Terminal from "../../../components/terminal";
import { examplesPowerChainingTerminal } from "./terminal";
import { getDocsUrl } from "../../../constants/links";
import { DISPLAY_CARD_TITLE } from "../../../constants/typography";
import { useRevealOnPage } from "../../../hooks/useRevealOnPage";

const CI_EXIT = `i18nprune validate --json | jq -e '.ok'`

const JSON_VALIDATE = `i18nprune validate --json | jq`

const JSON_SYNC_FILTER = `i18nprune sync --json | jq '.data.files[] | select(.changed == true)'`

const GENERATE_TARGET = `i18nprune generate --target ar --json`

const FILL_ALL = `i18nprune fill --all --json`

const FILL_DRY = `i18nprune fill --all --dry-run --json`

const KEY_OBS = `i18nprune validate --json | jq '.data.keyObservations'`

const SYNC_FILES = `i18nprune sync --json | jq '.data.files'`

const PIPELINE = `jq -r '.targets[]' targets.json | xargs -I {} i18nprune generate --target {} --json`

const PIPELINE_JQ = `jq -r '.targets[]' targets.json | xargs -I {} i18nprune generate --target {} --json | jq`

const REVIEW_JSON = `i18nprune review --json | jq '.data.locales | keys'`

const QUALITY_JSON = `i18nprune quality --json | jq '.data.total, .issues'`

const DOCTOR_JSON = `i18nprune doctor --json | jq '.data.findings[] | {id, severity, title}'`

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

function PowerSection({
  eyebrow,
  title,
  children,
  code,
  caption,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  code: string;
  caption?: string;
}) {
  return (
    <section className="reveal space-y-4 rounded-xl border border-border bg-card p-5 sm:p-8 md:p-10">
      <p className="text-xs font-semibold uppercase tracking-wider text-sidebar-primary">{eyebrow}</p>
      <h2 className={DISPLAY_CARD_TITLE}>{title}</h2>
      <div className="max-w-none text-sm leading-relaxed text-muted-foreground md:text-base">{children}</div>
      <CodeBlock caption={caption} code={code} lang="bash" />
    </section>
  );
}

export default function ExamplesPage() {
  useRevealOnPage("examples");

  return (
    <main className="bg-background pb-24 md:pb-32">
      <PageHero
        eyebrow="Examples"
        title="Power mode"
        maxWidthClass="max-w-5xl"
        description="Copy-paste patterns for CI, scripts, and audits — not a tutorial. Same JSON envelope everywhere; deterministic exits."
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
          API &amp; JSON spec
        </Link>
        <Link
          to="/benchmark"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-6 py-2.5 text-sm font-semibold backdrop-blur transition-colors hover:border-sidebar-primary"
        >
          Performance
        </Link>
      </PageHero>

      <div className="mx-auto max-w-6xl space-y-8 px-4 pt-8 sm:space-y-10 sm:px-6 sm:pt-12 lg:max-w-7xl">
        <PowerSection
          eyebrow="CI"
          title="Exit codes"
          caption="Fail the job when validation fails — jq enforces .ok; CLI exit code is non-zero on error"
          code={CI_EXIT}
        >
          <p>
            Non-zero when the envelope is not OK or jq rejects <code className="font-mono text-xs">.ok</code>. Safe for
            CI: one line, no log scraping.
          </p>
        </PowerSection>

        <PowerSection
          eyebrow="Automation"
          title="JSON-first"
          caption="Inspect the full envelope or pipe into jq filters"
          code={JSON_VALIDATE}
        >
          <p className="mb-3">
            Second line: filter changed sync rows only — same <code className="font-mono text-xs">data</code> shape every
            run.
          </p>
          <CodeBlock caption="Filter sync output" code={JSON_SYNC_FILTER} lang="bash" />
        </PowerSection>

        <PowerSection
          eyebrow="CI"
          title="Targeted generation"
          caption="Explicit target — no prompts, stable stdout"
          code={GENERATE_TARGET}
        >
          <p>
            Non-interactive runs <strong className="text-foreground">require</strong>{" "}
            <code className="font-mono text-xs">--target</code> (or your configured selector). No TTY guessing — contract
            in the envelope.
          </p>
        </PowerSection>

        <PowerSection
          eyebrow="Bulk"
          title="Fill all locales"
          caption="Then dry-run: same envelope, no writes"
          code={FILL_ALL}
        >
          <p className="mb-3">Preview first:</p>
          <CodeBlock caption="Dry-run (counts, no API / writes)" code={FILL_DRY} lang="bash" />
        </PowerSection>

        <PowerSection
          eyebrow="Introspection"
          title="Key observations"
          caption="Where literals were resolved — use jq to drill into observations"
          code={KEY_OBS}
        >
          <p>
            <code className="font-mono text-xs">keyObservations</code> carries structured scan results (paths, spans — see{" "}
            <DocLink href={getDocsUrl("json/README")}>docs</DocLink>
            ).
          </p>
        </PowerSection>

        <PowerSection
          eyebrow="Audit"
          title="Sync transparency"
          caption="Per-file changed flag — scriptable audits"
          code={SYNC_FILES}
        >
          <p>
            <code className="font-mono text-xs">data.files</code> lists{" "}
            <code className="font-mono text-xs">path</code> + <code className="font-mono text-xs">changed</code> — diff
            without parsing prose.
          </p>
        </PowerSection>

        <section className="reveal space-y-4 rounded-xl border border-dashed border-sidebar-primary/40 bg-sidebar-primary/5 p-5 sm:p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-sidebar-primary">Pipelines</p>
          <h2 className={DISPLAY_CARD_TITLE}>Chaining &amp; batch targets</h2>
          <p className="max-w-none text-sm leading-relaxed text-muted-foreground md:text-base">
            Use a manifest like <code className="font-mono text-xs">targets.json</code>{" "}
            <code className="font-mono text-xs">{`{ "targets": ["fr","ja",…] }`}</code> — jq extracts codes;{" "}
            <code className="font-mono text-xs">xargs</code> runs one <code className="font-mono text-xs">generate</code> per
            code. Append <code className="font-mono text-xs">| jq</code> for pretty-printed envelopes.
          </p>
          <CodeBlock
            caption="One generate process per target (compact JSON lines on stdout)"
            code={PIPELINE}
            lang="bash"
          />
          <CodeBlock
            caption="Same pipeline — pretty-print each envelope (multiple JSON objects in sequence)"
            code={PIPELINE_JQ}
            lang="bash"
          />
          <aside className="rounded-lg border border-border/80 bg-background/80 px-4 py-3 text-sm text-muted-foreground">
            <strong className="text-foreground">Multi-document stdout:</strong> each <code className="font-mono text-xs">generate</code>{" "}
            invocation prints <strong className="text-foreground">one</strong> <code className="font-mono text-xs">CliJsonEnvelope</code>
            . Running six targets yields six objects back-to-back — parse as NDJSON or run <code className="font-mono text-xs">generate --target a,b,c</code> for a single envelope when you want one shot.
          </aside>
          <div className="pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Interactive narrative
            </p>
            <Terminal 
              title="~/repo" 
              sessions={[
                { id: "chaining", label: "chaining", command: "i18nprune chaining", lines: examplesPowerChainingTerminal }
              ]} 
            />
          </div>
        </section>

        <PowerSection
          eyebrow="More JSON"
          title="Review, quality, doctor"
          caption="Per-locale file keys in review payload"
          code={REVIEW_JSON}
        >
          <p className="text-sm text-muted-foreground md:text-base">
            Same envelope pattern — slice with <code className="font-mono text-xs">jq</code> for dashboards or gates.
          </p>
          <div className="mt-4 space-y-4">
            <CodeBlock caption="Quality: total parity leaves + issues" code={QUALITY_JSON} lang="bash" />
            <CodeBlock caption="Doctor: structured findings" code={DOCTOR_JSON} lang="bash" />
          </div>
        </PowerSection>

        <section className="reveal rounded-xl border border-border bg-secondary/30 p-5 sm:p-8 md:p-10">
          <h2 className={DISPLAY_CARD_TITLE}>Why JSON</h2>
          <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-muted-foreground md:text-base">
            <li>One <code className="font-mono text-xs">CliJsonEnvelope</code> — same keys in CI and locally.</li>
            <li>
              <code className="font-mono text-xs">issues[]</code> with stable codes + optional{" "}
              <code className="font-mono text-xs">docHref</code> for deep links.
            </li>
            <li>No styled logger output on stdout in JSON mode — scripts stay parseable.</li>
          </ul>
        </section>

        <div className="reveal text-center">
          <Link to="/benchmark" className="text-sm text-muted-foreground hover:text-foreground">
            Benchmarks
          </Link>
          <span className="mx-2 text-muted-foreground">·</span>
          <Link to="/workflow" className="text-sm text-muted-foreground hover:text-foreground">
            Workflow
          </Link>
          <span className="mx-2 text-muted-foreground">·</span>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
