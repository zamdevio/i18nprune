import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import CodeBlock from "../../../components/code-block";
import PageHero from "../../../components/page-hero";
import Terminal from "../../../components/terminal";
import { apiPageCiJsonTerminal } from "./terminal";
import {
  getDocsUrl,
  LINKS,
} from "../../../constants/links";
import { DISPLAY_CARD_TITLE } from "../../../constants/typography";
import { useRevealOnPage } from "../../../hooks/useRevealOnPage";

const CONFIG_FULL = `import { defineConfig, type I18nPruneConfig } from 'i18nprune/core/config';

export default defineConfig({
  source: 'locales/en.json',
  localesDir: 'locales',
  src: 'src',
  functions: ['t', 'i18n.t'],
  policies: {
    preserve: {
      'common.*': true,
    },
    parity: {},
  },
}) satisfies Partial<I18nPruneConfig>;`

const CORE_SCAN = `import {
  resolveContext,
  scanSources,
  exactLiteralKeys,
  scanProjectDynamicKeySites,
} from 'i18nprune/core';
import { createNodeRuntimeAdapters } from 'i18nprune/core/runtime/node';

const ctx = resolveContext();
const runtime = createNodeRuntimeAdapters();
const text = scanSources(runtime, ctx.paths.srcRoot);
const literals = exactLiteralKeys(text, ctx.config.functions, {});
const dynamic = scanProjectDynamicKeySites({
  srcRoot: ctx.paths.srcRoot,
  functions: ctx.config.functions,
  runtime,
});`

const CORE_NAMESPACED = `import { context, extractor, dynamic, validate, files } from 'i18nprune/core';

const ctx = context.resolveContext();
const usage = extractor.scanProjectLiteralKeyUsage(ctx);
const sites = dynamic.scanProjectDynamicKeySites(ctx);
const raw = files.readJsonFile(ctx.paths.sourceLocale);
const missing = validate.computeMissingLiteralKeys(ctx, raw);`

const HEADLESS_ENVELOPE = `import {
  tryResolveContext,
  runValidate,
  stringifyEnvelope,
} from 'i18nprune/core';

const res = tryResolveContext(process.cwd());
if (!res.ok) {
  console.error(JSON.stringify(res.issues, null, 2));
  process.exit(1);
}

const envelope = runValidate(res.data);
// Same CliJsonEnvelope as \`i18nprune validate --json\` (use stringifyEnvelope like stdout)
process.stdout.write(stringifyEnvelope(envelope) + '\\n');
if (!envelope.ok) process.exit(1);`

const BASH_CI = `set -euo pipefail
# Single primary document on stdout for most JSON-capable commands
i18nprune validate --json > report.json
# Exit code + file: both are part of the contract (see docs: behavior / exit codes)
jq -e '.ok' report.json >/dev/null`

const PACKAGE_JSON = `{
  "scripts": {
    "i18n": "i18nprune"
  }
}`

function DocLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-medium text-sidebar-primary underline-offset-4 hover:underline"
    >
      {children}
      <ExternalLink className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
    </a>
  );
}

function SectionIntro({ title, children }: { title: string; children: ReactNode }) {
  return (
    <header className="border-b border-border/80 pb-4">
      <h2 className={DISPLAY_CARD_TITLE}>{title}</h2>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground md:text-base">{children}</div>
    </header>
  );
}

export default function ApiPage() {
  useRevealOnPage("api");
  const docsJsonReportVsCliReadmeUrl = getDocsUrl("json/README#report-json-on-disk-vs-cli-json-stdout");

  return (
    <main className="bg-background pb-24 md:pb-32">
      <PageHero
        eyebrow="API"
        title="CLI, JSON, and programmatic core"
        description={
          <>
            Build real automation with the same engine behind the CLI: stable JSON for CI/pipelines and in-process
            TypeScript helpers for custom tools. This page focuses on how teams ship with it; deep contracts stay in
            the docs.
          </>
        }
      >
        <Link
          to="/commands"
          className="btn-glow inline-flex items-center gap-2 rounded-full bg-sidebar-primary px-6 py-2.5 text-sm font-bold text-sidebar-primary-foreground transition-all"
        >
          Command flows
        </Link>
        <Link
          to="/examples"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-6 py-2.5 text-sm font-semibold backdrop-blur transition-colors hover:border-sidebar-primary"
        >
          Examples
        </Link>
      </PageHero>

      <div className="mx-auto max-w-6xl space-y-10 px-4 pt-8 sm:space-y-14 sm:px-6 sm:pt-10">
        <section className="reveal space-y-6 rounded-xl border border-border bg-card p-5 sm:p-6 md:p-8">
          <SectionIntro title="CLI `--json` and automation">
            <p>
              <strong className="font-medium text-foreground">What:</strong> supported subcommands print one primary{" "}
              <code className="font-mono text-xs">CliJsonEnvelope</code> on stdout —{" "}
              <code className="font-mono text-xs">ok</code>, <code className="font-mono text-xs">kind</code>,{" "}
              <code className="font-mono text-xs">data</code>, <code className="font-mono text-xs">issues[]</code>,{" "}
              <code className="font-mono text-xs">meta</code>.
            </p>
            <p>
              <strong className="font-medium text-foreground">Why it matters:</strong> gates, dashboards, and glue
              scripts consume a stable contract — not colored tables. Exit codes stay aligned with domain outcomes.
            </p>
            <p>
              <strong className="font-medium text-foreground">Go deeper:</strong>{" "}
              <DocLink href={getDocsUrl("json/README")}>JSON output (`--json`)</DocLink>,{" "}
              <DocLink href={getDocsUrl("behavior/json-long")}>long-running commands + `--json`</DocLink>,{" "}
              <DocLink href={getDocsUrl("issues")}>issue codes</DocLink>,{" "}
              <DocLink href={getDocsUrl("examples/jq-cookbook/README")}>jq cookbook</DocLink>.
            </p>
          </SectionIntro>

          <CodeBlock caption="Shell — redirect, gate on exit + jq (patterns, not a full CI recipe)" code={BASH_CI} lang="bash" />

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Interactive — CI-shaped
            </p>
            <Terminal 
              title="~/repo" 
              sessions={[
                { id: "ci", label: "ci-json", command: "i18nprune validate --json", lines: apiPageCiJsonTerminal }
              ]} 
            />
          </div>
          <aside className="rounded-lg border border-sidebar-primary/25 bg-sidebar-primary/5 px-4 py-3 text-left text-sm leading-relaxed text-muted-foreground md:text-base">
            <strong className="font-medium text-foreground">Report file vs validate JSON:</strong> an on-disk{" "}
            <code className="font-mono text-xs">report --format json</code> artifact is{" "}
            <strong className="text-foreground">not</strong> the same document as{" "}
            <code className="font-mono text-xs">validate --json</code> stdout — both are valid; see{" "}
            <a
              href={docsJsonReportVsCliReadmeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-sidebar-primary underline-offset-4 hover:underline"
            >
              docs: Report JSON on disk vs CLI JSON stdout
              <ExternalLink className="mb-0.5 ml-0.5 inline h-3 w-3 opacity-70" aria-hidden />
            </a>
            .
          </aside>
        </section>

        <section className="reveal reveal-delay-1 space-y-6 rounded-xl border border-border bg-card p-5 sm:p-6 md:p-8">
          <SectionIntro title="Same envelope from TypeScript">
            <p>
              <strong className="font-medium text-foreground">What:</strong>{" "}
              <code className="font-mono text-xs">tryResolveContext</code> (no throw) plus{" "}
              <code className="font-mono text-xs">runValidate</code>, <code className="font-mono text-xs">runSync</code>, …
              return the same payload the CLI would print with global <code className="font-mono text-xs">--json</code>.
            </p>
            <p>
              <strong className="font-medium text-foreground">Why it matters:</strong> in-process tools (pre-commit,
              codegen, services) avoid spawning a shell but stay bitwise-compatible with automation that parses CLI
              JSON.
            </p>
            <p>
              <strong className="font-medium text-foreground">Go deeper:</strong>{" "}
              <DocLink href={getDocsUrl("json/programmatic")}>Programmatic API + CLI JSON contract</DocLink>,{" "}
              <DocLink href={getDocsUrl("exports/core")}>Core exports</DocLink>.
            </p>
          </SectionIntro>

          <CodeBlock
            caption="Headless — same CliJsonEnvelope as `i18nprune validate --json`"
            code={HEADLESS_ENVELOPE}
            lang="typescript"
          />
        </section>

        <section className="reveal reveal-delay-2 rounded-xl border border-border bg-secondary/30 p-5 sm:p-6 md:p-8">
          <h2 className="font-display text-xl font-semibold text-foreground">When to use which</h2>
          <ul className="mt-4 list-inside list-disc space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>
              <strong className="text-foreground">Shell / CI / any language:</strong> invoke the CLI with{" "}
              <code className="font-mono text-xs">--json</code>; consume stdout and exit codes.
            </li>
            <li>
              <strong className="text-foreground">Node / TS tooling:</strong> call <code className="font-mono text-xs">run*</code>{" "}
              from <code className="font-mono text-xs">core</code> when subprocess overhead or quoting is wrong for your
              control flow.
            </li>
            <li>
              <strong className="text-foreground">Day-to-day editing:</strong> prefer the interactive{" "}
              <Link className="font-medium text-sidebar-primary underline-offset-2 hover:underline" to="/commands">
                CLI
              </Link>{" "}
              — it owns argv, prompts, and human tables.
            </li>
          </ul>
          <aside className="mt-5 rounded-lg border border-border/80 bg-background/50 px-4 py-3 text-left text-sm leading-relaxed text-muted-foreground md:text-base">
            <strong className="font-medium text-foreground">Config and CI:</strong> global{" "}
            <code className="font-mono text-xs">--json</code>, duplicate config files, and missing config interact
            with prompts and exit codes as documented in{" "}
            <a
              href={getDocsUrl("behavior/README")}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-sidebar-primary underline-offset-4 hover:underline"
            >
              Behavior: interactivity
              <ExternalLink className="mb-0.5 ml-0.5 inline h-3 w-3 opacity-70" aria-hidden />
            </a>{" "}
            (same summary as on the{" "}
            <Link to="/commands" className="font-medium text-sidebar-primary underline-offset-4 hover:underline">
              commands
            </Link>{" "}
            page).
          </aside>
        </section>

        <section className="reveal space-y-6 rounded-xl border border-border bg-card p-5 sm:p-6 md:p-8">
          <SectionIntro title="i18nprune/core">
            <p>
              <strong className="font-medium text-foreground">What:</strong>{" "}
              <code className="font-mono text-xs">defineConfig</code> from{" "}
              <code className="font-mono text-xs">i18nprune/core/config</code> provides typed config authoring; no
              filesystem I/O happens until core or the CLI resolves config.
            </p>
            <p>
              <strong className="font-medium text-foreground">Go deeper:</strong>{" "}
              <DocLink href={getDocsUrl("exports/config")}>Configuration API</DocLink>,{" "}
              <DocLink href={getDocsUrl("commands/config/README")}>config command</DocLink>.
            </p>
          </SectionIntro>

          <CodeBlock
            caption="Typical i18nprune.config.ts — policies mirror CLI merge behavior"
            code={CONFIG_FULL}
            lang="typescript"
          />
        </section>

        <section className="reveal reveal-delay-1 space-y-6 rounded-xl border border-border bg-card p-5 sm:p-6 md:p-8">
          <SectionIntro title="i18nprune/core — scanning without the envelope">
            <p>
              <strong className="font-medium text-foreground">What:</strong> lower-level primitives — same heuristics as{" "}
              <code className="font-mono text-xs">validate</code> — when you need raw literals, dynamic sites, or custom
              reporting before wrapping a <code className="font-mono text-xs">run*</code> call.
            </p>
            <p>
              <strong className="font-medium text-foreground">Go deeper:</strong>{" "}
              <DocLink href={getDocsUrl("exports/examples")}>Examples & recipes</DocLink>,{" "}
              <DocLink href={getDocsUrl("regex/README#detection-limits")}>Detection limits</DocLink>.
            </p>
          </SectionIntro>

          <CodeBlock
            caption="Scan sources — literal keys + dynamic sites (same pipeline validate uses)"
            code={CORE_SCAN}
            lang="typescript"
          />
        </section>

        <section className="reveal reveal-delay-2 space-y-6 rounded-xl border border-border bg-card p-5 sm:p-6 md:p-8">
          <SectionIntro title="Flat imports vs namespaced core">
            <p>
              <strong className="font-medium text-foreground">What:</strong> the package exports the{" "}
              <strong className="font-medium text-foreground">same symbols</strong> two ways — flat (
              <code className="font-mono text-xs">resolveContext</code>, …) and grouped under namespaces (
              <code className="font-mono text-xs">context</code>, <code className="font-mono text-xs">extractor</code>, …).
              Neither is deprecated.
            </p>
            <p>
              <strong className="font-medium text-foreground">When it matters:</strong> flat stays fine for small scripts.
              Namespaces scale better in larger tools — clearer ownership in the IDE and a mental model that mirrors{" "}
              <code className="font-mono text-xs">packages/cli/src/core/</code>.
            </p>
            <p>
              <strong className="font-medium text-foreground">Why both exist:</strong> ergonomics and backward
              compatibility; semver policy is documented with the API tier table.
            </p>
            <p>
              <strong className="font-medium text-foreground">Go deeper:</strong>{" "}
              <DocLink href={getDocsUrl("exports/core")}>Core API — flat vs namespaced</DocLink>.
            </p>
          </SectionIntro>

          <CodeBlock
            caption="Namespaced entry — same functions as flat imports, grouped by domain"
            code={CORE_NAMESPACED}
            lang="typescript"
          />
        </section>

        <section className="reveal rounded-xl border border-border bg-secondary/30 p-5 sm:p-6 md:p-8">
          <h2 className="font-display text-xl font-semibold text-foreground">CLI binary in the repo</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Keep a script name contributors recognize; call <code className="font-mono text-xs">core</code> from TypeScript
            when a TTY-free integration fits better than a subprocess.
          </p>
          <div className="mt-4 max-w-lg">
            <CodeBlock caption="package.json — local CLI" code={PACKAGE_JSON} lang="json" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Install: <DocLink href={LINKS.npm}>npm</DocLink> · <DocLink href={getDocsUrl("workflow/README")}>Workflow</DocLink>
          </p>
        </section>

        <div className="reveal flex flex-col items-center gap-4 border-t border-border pt-10 text-center sm:flex-row sm:justify-center">
          <a
            href={getDocsUrl("exports/README")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-sidebar-primary hover:bg-card"
          >
            Full exports index
            <ExternalLink className="h-4 w-4" />
          </a>
          <Link
            to="/workflow"
            className="inline-flex rounded-md border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-sidebar-primary hover:bg-card"
          >
            Workflow
          </Link>
        </div>
      </div>
    </main>
  );
}
