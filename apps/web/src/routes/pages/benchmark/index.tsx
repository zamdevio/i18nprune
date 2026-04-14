import { ExternalLink, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import CodeBlock from "../../../components/code-block";
import PageHero from "../../../components/page-hero";
import { BENCHMARK_CASE_STUDY } from "../../../constants/benchmark";
import { docsJsonReportVsCliUrl, docsUrl, githubTree, LINKS } from "../../../constants/links";
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

/** Screenshots live in `public/benchmark/*.png` → served as `/benchmark/…`. */
function ProofSlot({ file, caption }: { file: string; caption: string }) {
  const src = `/benchmark/${file}`;
  return (
    <figure className="mt-4 overflow-hidden rounded-lg border border-border bg-card/40">
      <img
        src={src}
        alt={caption}
        className="w-full object-contain object-top"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <figcaption className="border-t border-border/60 bg-card/50 px-3 py-2 text-xs text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}

function CmdSection({
  kicker,
  title,
  what,
  code,
  caption,
  proofFile,
  proofCaption,
}: {
  kicker: string;
  title: string;
  what: ReactNode;
  code: string;
  caption: string;
  proofFile: string;
  proofCaption: string;
}) {
  return (
    <section className="reveal scroll-mt-24 rounded-xl border border-border bg-card p-5 sm:p-8 md:p-10">
      <p className="text-xs font-semibold uppercase tracking-wider text-sidebar-primary">{kicker}</p>
      <h2 className={`mt-2 ${DISPLAY_CARD_TITLE}`}>{title}</h2>
      <div className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">{what}</div>
      <div className="mt-6">
        <CodeBlock caption={caption} code={code} lang="bash" />
      </div>
      <ProofSlot file={proofFile} caption={proofCaption} />
    </section>
  );
}

const TIME_GATE = `time i18nprune validate --json | jq -e '.ok'`;

function GithubLink({ path, label }: { path: string; label: string }) {
  return (
    <a
      href={githubTree(path)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-mono text-[0.8rem] text-sidebar-primary underline-offset-4 hover:underline"
    >
      {label}
      <ExternalLink className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
    </a>
  );
}

export default function BenchmarkPage() {
  useRevealOnPage("benchmark");

  return (
    <main className="bg-background pb-24 md:pb-32">
      <PageHero
        eyebrow="Performance"
        title="Real projects, measurable runs"
        maxWidthClass="max-w-5xl"
        description={
          <>
            These commands do the heavy work: scanning sources, resolving keys, comparing locales, building reports. Run{" "}
            <code className="font-mono text-[0.85em]">time … --json | jq</code> on <em>your</em> tree — wall time scales with
            file count, disk, and CPU. Numbers here are <strong className="text-foreground">patterns to try</strong>, not a
            published SLA.
          </>
        }
      >
        <a
          href={docsUrl("README")}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-glow inline-flex items-center gap-2 rounded-full bg-sidebar-primary px-6 py-2.5 text-sm font-bold text-sidebar-primary-foreground transition-all"
        >
          Get Started
          <ArrowRight className="h-4 w-4" />
          <ExternalLink className="h-4 w-4 opacity-80" aria-hidden />
        </a>
        <Link
          to="/examples"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-6 py-2.5 text-sm font-semibold backdrop-blur transition-colors hover:border-sidebar-primary"
        >
          Copy-paste examples
        </Link>
      </PageHero>

      <div className="mx-auto max-w-6xl space-y-10 px-4 pt-8 sm:space-y-12 sm:px-6 sm:pt-12">
        <aside className="reveal rounded-xl border border-sidebar-primary/25 bg-sidebar-primary/5 p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-sidebar-primary">How we capture timings here</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Every command on this page is shown with{" "}
            <code className="rounded bg-secondary px-1 py-0.5 font-mono text-[0.8rem] text-foreground">--json</code> so
            screenshots and copy-paste blocks stay <strong className="text-foreground/90">compact</strong> — one machine-readable
            envelope per run, minimal fields, easy to pipe through{" "}
            <code className="rounded bg-secondary px-1 py-0.5 font-mono text-[0.8rem]">jq</code> or CI gates.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The <strong className="text-foreground/90">same commands</strong> run <strong className="text-foreground/90">without</strong>{" "}
            <code className="rounded bg-secondary px-1 py-0.5 font-mono text-[0.8rem]">--json</code> in a normal terminal: rich,
            real-time logger output (info, warn, error, progress) — better for day-to-day work; use JSON when you need stable
            automation or small proof snippets.
          </p>
        </aside>

        <section className="reveal rounded-xl border border-border bg-card p-5 sm:p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-sidebar-primary">Case study</p>
          <h2 className={`mt-2 ${DISPLAY_CARD_TITLE}`}>
            Where the screenshots and commands come from
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
            The terminal captures on this page were taken against{" "}
            <strong className="text-foreground">{BENCHMARK_CASE_STUDY.app}</strong> ({BENCHMARK_CASE_STUDY.path}) — a large frontend workspace the tool
            is developed next to. That keeps the CLI and core honest: if it cannot stay fast on a{" "}
            <strong className="text-foreground">hundreds-of-files</strong> tree with real routes, components, and locale JSON, it
            does not ship. Smaller apps are easier; this one is the stress test.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-secondary/40 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Source tree</p>
              <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-foreground">
                {BENCHMARK_CASE_STUDY.treeFiles}{" "}
                <span className="text-base font-normal text-muted-foreground">files</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {BENCHMARK_CASE_STUDY.treeDirs} dirs · excluding <code className="font-mono text-[0.65rem]">{BENCHMARK_CASE_STUDY.treeIgnore}</code>
              </p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/40 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Literal key observations</p>
              <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-foreground">
                {BENCHMARK_CASE_STUDY.literalKeyObservations.toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">One `validate --json` scan (`data.count`)</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/40 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dynamic call sites</p>
              <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-foreground">
                {BENCHMARK_CASE_STUDY.dynamicSites}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">Non-literal first args (`data.dynamic.count`)</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/40 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Wall time</p>
              <p className="mt-1 font-display text-2xl font-semibold text-foreground">&lt; 1s</p>
              <p className="mt-0.5 text-xs text-muted-foreground">validate / report / jq slices in captures</p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-sidebar-primary/30 bg-sidebar-primary/5 p-4 sm:p-5">
            <h3 className="font-display text-sm font-semibold text-foreground sm:text-base">Why it stays fast</h3>
            <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm text-muted-foreground md:text-[0.95rem]">
              <li>
                <strong className="text-foreground">No full AST</strong> — translation calls and key sites are found with targeted
                scans (regex + heuristics), not a TypeScript program dump.
              </li>
              <li>
                <strong className="text-foreground">Bounded work</strong> — per-file const maps, template literals, rebuilt static
                segments, then dynamic key sites — enough structure to compare locales and emit warnings without loading the whole
                program graph into memory.
              </li>
              <li>
                <strong className="text-foreground">One envelope</strong> — with <code className="font-mono text-xs">--json</code>{" "}
                you get structured <code className="font-mono text-xs">CliJsonEnvelope</code>; otherwise human-readable lines,
                mid-run warnings, and final status — same pipeline.
              </li>
            </ul>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-border/70 pt-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Extractor (source)</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                <li>
                  <GithubLink path="packages/cli/src/core/extractor" label="core/extractor" />
                </li>
                <li>
                  <GithubLink path="packages/cli/src/core/extractor/keySites" label="keySites" />
                </li>
                <li>
                  <GithubLink path="packages/cli/src/core/extractor/dynamic" label="dynamic" />
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Docs</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                <li>
                  <DocLink href={docsUrl("regex/extraction", { noReadme: true })}>Translation call extraction</DocLink>
                </li>
                <li>
                  <DocLink href={docsUrl("barriers/dynamic-keys", { noReadme: true })}>Dynamic keys barrier</DocLink>
                </li>
                <li>
                  <DocLink href={docsUrl("dynamic")}>Dynamic scan overview</DocLink>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Repo</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                <li>
                  <a
                    href={LINKS.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-sidebar-primary underline-offset-4 hover:underline"
                  >
                    github.com/zamdevio/i18nprune
                    <ExternalLink className="mb-0.5 ml-0.5 inline h-3 w-3 opacity-70" aria-hidden />
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Figures above are from a real run on that app; your counts and <code className="font-mono">time</code> output will
            differ by hardware and repo state.
          </p>
        </section>

        <section className="reveal rounded-xl border border-sidebar-primary/25 bg-sidebar-primary/5 p-5 sm:p-8">
          <h2 className={DISPLAY_CARD_TITLE}>How to show proof</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground md:text-base">
            <li>
              Screenshots for this page live under{" "}
              <code className="font-mono text-xs">apps/web/public/benchmark/*.png</code> (served as{" "}
              <code className="font-mono text-xs">/benchmark/…</code>).
            </li>
            <li>
              Same <code className="font-mono text-xs">dynamicKeySites</code> count across validate / sync / quality / review /
              cleanup on a given repo means one scan story — good sanity check for pipelines.
            </li>
          </ul>
        </section>

        <section className="reveal rounded-xl border border-border bg-secondary/30 p-5 sm:p-8 md:p-10">
          <h2 className={DISPLAY_CARD_TITLE}>Measure any command</h2>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            Gate CI on exit code + <code className="font-mono text-xs">.ok</code>:
          </p>
          <CodeBlock caption="Wall clock + boolean gate" code={TIME_GATE} lang="bash" />
        </section>

        <CmdSection
          kicker="Scan + keys"
          title="validate"
          what={
            <>
              Literal keys vs source JSON; dynamic call sites enumerated with file/line. Often the longest step in a tight
              feedback loop. See <DocLink href={docsUrl("commands/validate/README")}>command doc</DocLink>.
            </>
          }
          code={`time i18nprune validate --json | jq '{ ok, count: .data.count, dynamic: .data.dynamic.count, missing: (.data.missing | length) }'`}
          caption="`count` = literal key observations (same as `keyObservations.count`); `missing` length = keys in code missing from source JSON"
          proofFile="validate.png"
          proofCaption="validate --json | jq"
        />

        <CmdSection
          kicker="Locales"
          title="sync"
          what={
            <>
              Aligns target locale JSON shapes to the source; reports <code className="font-mono text-xs">changed</code> per
              file in <code className="font-mono text-xs">data.files</code>.
            </>
          }
          code={`time i18nprune sync --json | jq '{ ok, written: .data.writtenFiles, files: .data.files }'`}
          caption="Audit-friendly: no guessing from log prose"
          proofFile="sync.png"
          proofCaption="sync --json | jq"
        />

        <section className="reveal scroll-mt-24 rounded-xl border border-border bg-card p-5 sm:p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-sidebar-primary">Translator</p>
          <h2 className={`mt-2 ${DISPLAY_CARD_TITLE}`}>generate & fill</h2>
          <div className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
            String-leaf translation with the same session/progress model. Use explicit{" "}
            <code className="font-mono text-xs">--target</code> in CI. Batch with{" "}
            <code className="font-mono text-xs">targets.json</code> + <code className="font-mono text-xs">xargs</code> (one envelope
            per process) or comma-separated <code className="font-mono text-xs">--target</code> for one shot — see{" "}
            <Link to="/examples" className="font-medium text-sidebar-primary underline-offset-4 hover:underline">
              Examples
            </Link>
            .
          </div>
          <div className="mt-6">
            <CodeBlock
              caption="generate — dry-run: no API / no writes; `leavesProcessed` is the main workload signal"
              code={`time i18nprune generate --target so --dry-run --json | jq '{ ok, dynamicKeySites: .data.dynamicKeySites, leaves: .data.leavesProcessed }'`}
              lang="bash"
            />
          </div>
          <div className="mt-4">
            <CodeBlock
              caption="fill — `updated` counts leaves written; `sourceLeaves` is the baseline size"
              code={`time i18nprune fill --target so --dry-run --json | jq '{ ok, updated: .data.updated, sourceLeaves: .data.sourceLeaves, dynamicKeySites: .data.dynamicKeySites }'`}
              lang="bash"
            />
          </div>
          <ProofSlot file="generate.png" caption="generate & fill — dry-run or full run" />
        </section>

        <CmdSection
          kicker="Parity"
          title="quality"
          what={<>Leaf-level parity signals (e.g. English-identical counts) — large trees aggregate in one envelope.</>}
          code={`time i18nprune quality --json | jq '{ ok, total: .data.total, dynamicKeySites: .data.dynamicKeySites, issues: .issues }'`}
          caption="`total` = English-identical leaf count; pair with policies when you wire parity rules"
          proofFile="quality.png"
          proofCaption="quality --json | jq"
        />

        <CmdSection
          kicker="Overview"
          title="review"
          what={<>Per-locale file stats vs source — quick health snapshot for many locale files.</>}
          code={`time i18nprune review --json | jq '.data.locales | keys'`}
          caption="List locale basenames from payload"
          proofFile="review.png"
          proofCaption="review --json | jq"
        />

        <CmdSection
          kicker="Safety"
          title="cleanup"
          what={
            <>
              Unused-key analysis; optional ripgrep-backed checks. Timing and rollup counts are under{" "}
              <code className="font-mono text-xs">data.summary</code> in the same stdout envelope as{" "}
              <code className="font-mono text-xs">wouldRemove</code> / <code className="font-mono text-xs">dynamicKeySites</code>.
            </>
          }
          code={`time i18nprune cleanup --check-only --json | jq '{ ok, wouldRemove: .data.wouldRemove, summary: .data.summary }'`}
          caption="Check-only: no writes; single JSON document on stdout"
          proofFile="cleanup.png"
          proofCaption="cleanup --check-only --json | jq"
        />

        <section className="reveal scroll-mt-24 rounded-xl border border-dashed border-sidebar-primary/40 bg-sidebar-primary/5 p-5 sm:p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-sidebar-primary">Project report</p>
          <h2 className={`mt-2 ${DISPLAY_CARD_TITLE}`}>report</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
            Full repo scan → <code className="font-mono text-xs">i18nprune.projectReport</code> DTO. Default artifact style is{" "}
            <strong className="text-foreground">HTML</strong> (embedded report UI). Use{" "}
            <code className="font-mono text-xs">--format json|csv|text</code> for data exports. This is{" "}
            <strong className="text-foreground">not</strong> the same as global <code className="font-mono text-xs">--report-file</code> on other commands — see{" "}
            <DocLink href={docsJsonReportVsCliUrl()}>report JSON vs CLI JSON</DocLink> and{" "}
            <DocLink href={docsUrl("commands/report/README")}>report command</DocLink>. Run{" "}
            <code className="font-mono text-xs">i18nprune report -h</code> for flags and examples; the CLI also prints doc links when relevant.
          </p>
          <div className="mt-6">
            <CodeBlock
              caption="HTML report under ./reports/ (create the folder first if needed)"
              code={`mkdir -p reports\ntime i18nprune report --format html --out ./reports/index.html`}
              lang="bash"
            />
          </div>
          <div className="mt-4">
            <CodeBlock
              caption="JSON artifact on disk (not the same shape as validate --json stdout)"
              code={`time i18nprune report --format json --out ./reports/report.json`}
              lang="bash"
            />
          </div>
          <div className="mt-4">
            <CodeBlock
              caption="Same run, CLI JSON envelope on stdout (`--json` is the global JSON flag) — large `document` omitted in jq"
              code={`time i18nprune report --format json --out ./reports/report.json --json | jq '{ ok, format: .data.format, outputPath: .data.outputPath }'`}
              lang="bash"
            />
          </div>
          <ProofSlot file="report.png" caption="report — HTML and JSON artifact paths" />
        </section>

        <section className="reveal scroll-mt-24 rounded-xl border border-border bg-card p-5 sm:p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-sidebar-primary">Diagnostics</p>
          <h2 className={`mt-2 ${DISPLAY_CARD_TITLE}`}>doctor & config</h2>
          <div className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
            Fast environment checks (Node, rg, paths) and merged config snapshot — use for CI preflight. Paths and findings live
            under <code className="font-mono text-xs">data</code>, not the envelope root.
          </div>
          <div className="mt-6">
            <CodeBlock
              caption="doctor — one object per finding"
              code={`time i18nprune doctor --json | jq '.data.findings[] | {id, severity, title}'`}
              lang="bash"
            />
          </div>
          <div className="mt-4">
            <CodeBlock
              caption="config — resolved absolute paths"
              code={`time i18nprune config --json | jq '.data.resolvedPaths'`}
              lang="bash"
            />
          </div>
          <ProofSlot file="doctor-config.png" caption="doctor & config — minimal jq slices" />
        </section>

        <div className="reveal flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-sm text-muted-foreground">
          <Link to="/examples" className="hover:text-foreground">
            Examples
          </Link>
          <span>·</span>
          <Link to="/workflow" className="hover:text-foreground">
            Workflow
          </Link>
          <span>·</span>
          <Link to="/" className="hover:text-foreground">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
