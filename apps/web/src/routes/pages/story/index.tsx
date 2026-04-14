import {
  ArrowUpRight,
  ExternalLink,
  BookOpen,
  Sparkles,
  Flame,
  Shield,
  Cpu,
  Gauge,
  Zap,
  TestTube2,
  Terminal as TerminalIcon,
  History,
  GitCommit,
  Quote,
} from "lucide-react";
import PageHero from "../../../components/page-hero";
import Terminal from "../../../components/terminal";
import { docsUrl, LINKS } from "../../../constants/links";
import { DISPLAY_SECTION_TITLE } from "../../../constants/typography";
import { storyGitLogSessions } from "../../../data/terminal";
import { SITE_DATA } from "../../../data/site";
import { useRevealOnPage } from "../../../hooks/useRevealOnPage";

const TIMELINE = [
  { date: "Mar 24", event: "First Commit", desc: "Core validation engine prototype." },
  { date: "Mar 30", event: "The Pivot", desc: "Shifted from simple regex to full AST-aware scanning." },
  { date: "Apr 05", event: "Scale Test", desc: "First run on CepatEdge (350+ files)." },
  { date: "Apr 15", event: "v1.0 Ship", desc: "Stable CLI with JSON/HTML reporting." },
];

export default function StoryPage() {
  useRevealOnPage("story");
  const gitLogSessions = storyGitLogSessions();

  return (
    <main className="bg-background pb-24 md:pb-32">
      <PageHero
        eyebrow="The Narrative"
        title="From Blocker to Tooling"
        description="Solo-built, shipped fast, battle-tested on a real codebase. This isn't just a project; it's the result of a developer fighting back against localization debt."
      >
        <div className="flex w-full flex-wrap justify-center gap-3 sm:w-auto sm:gap-4">
          <a
            href={docsUrl("origin/README")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-glow inline-flex w-full items-center justify-center gap-2 rounded-full bg-sidebar-primary px-6 py-3 text-sm font-bold text-sidebar-primary-foreground transition-all sm:w-auto sm:px-8"
          >
            <BookOpen className="h-5 w-5" />
            Why this exists
            <ExternalLink className="h-4 w-4 opacity-80" aria-hidden />
          </a>
          <a
            href={docsUrl("cursor/README")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card/80 px-6 py-3 text-sm font-semibold backdrop-blur transition-colors hover:border-sidebar-primary sm:w-auto sm:px-8"
          >
            <Sparkles className="h-5 w-5 text-sidebar-primary" />
            Built with Agents
            <ExternalLink className="h-4 w-4 opacity-80" aria-hidden />
          </a>
        </div>
      </PageHero>

      <div className="container mx-auto max-w-6xl px-4">
        {/* The "Vibe Check" Section */}
        <section className="reveal mb-20 text-center sm:mb-24 md:mb-32">
          <div className="mx-auto max-w-3xl">
            <Quote className="mx-auto mb-8 h-12 w-12 text-sidebar-primary/20" />
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
              Scratch-built, <span className="text-sidebar-primary italic">not inherited</span>
            </h2>
            <p className="mt-8 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              i18nprune wasn't born in a boardroom. It was born in the trenches of a monorepo where localization was killing velocity. We didn't need another "sync" tool; we needed a <span className="text-foreground font-semibold underline decoration-sidebar-primary/30 underline-offset-4">truth machine</span> for our JSON.
            </p>
          </div>
        </section>

        {/* Origin Grid */}
        <section className="reveal mb-20 grid gap-10 sm:mb-24 md:mb-32 md:gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-destructive">
              <Flame className="h-3 w-3" />
              The Pain Point
            </div>
            <h3 className={DISPLAY_SECTION_TITLE}>
              It was throughput dying.
            </h3>
            <p className="text-lg text-muted-foreground">
              On CepatEdge-scale code, i18n stops being "we'll fix it Friday" and starts blocking releases. Pausing to build a dedicated tool was cheaper than pretending spreadsheets were governance.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Keys missing in real flows",
                "Locales drifting apart",
                "Zero trust in CI",
                "Manual cleanup hell",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                  <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-sidebar-primary/5 blur-3xl" />
              <Terminal title="git-log — inception" sessions={gitLogSessions} />
          </div>
        </section>

        {/* Scale Section */}
        <section className="reveal mb-32">
          <div className="rounded-3xl border border-border bg-secondary/20 p-8 md:p-16">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-sidebar-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-sidebar-primary">
                  <Cpu className="h-3 w-3" />
                  The Load
                </div>
                <h2 className={DISPLAY_SECTION_TITLE}>
                  When the repo fights back.
                </h2>
                <p className="text-muted-foreground">
                  CepatEdge isn't a tutorial app. The frontend alone is <strong className="text-foreground">350+ files</strong> with over <strong className="text-foreground">1,200 keys</strong>. That's enough surface area for drift to become a permanent tax on every ship.
                </p>
                <div className="flex flex-wrap gap-6 pt-4 sm:gap-8">
                  <div>
                    <div className="text-4xl font-bold text-sidebar-primary">350+</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Files Scanned</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-sidebar-primary">~1.2k</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Keys Observed</div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Shield, label: "Policy Aware", desc: "No vibes, just rules." },
                  { icon: Zap, label: "Instant Sync", desc: "Harmony in ms." },
                  { icon: TerminalIcon, label: "CI Ready", desc: "JSON first design." },
                  { icon: TestTube2, label: "AST Engine", desc: "Deep code analysis." },
                ].map((item, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card p-6 transition-transform hover:-translate-y-1">
                    <item.icon className="mb-4 h-6 w-6 text-sidebar-primary" />
                    <h4 className="font-bold">{item.label}</h4>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Timeline & Agent Section */}
        <div className="grid gap-16 lg:grid-cols-3">
          <section className="reveal lg:col-span-2 space-y-12">
            <div className="space-y-4">
              <h2 className={DISPLAY_SECTION_TITLE}>
                The Agent Loop
              </h2>
              <p className="text-lg text-muted-foreground">
                I leaned hard on <strong className="text-foreground">Cursor's agents</strong>. They didn't decide the product; they removed the friction of boilerplate, refactors, and test-writing so I could focus on the CLI's soul.
              </p>
            </div>
            
            <div className="relative space-y-8 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-border">
              {TIMELINE.map((item, i) => (
                <div key={i} className="relative pl-10">
                  <div className="absolute left-0 top-1.5 h-6 w-6 rounded-full border-4 border-background bg-sidebar-primary shadow-sm" />
                  <div className="text-[10px] font-bold uppercase tracking-widest text-sidebar-primary">{item.date}</div>
                  <h4 className="font-bold text-xl">{item.event}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8">
              <div className="flex gap-4">
                <Gauge className="h-6 w-6 shrink-0 text-amber-500" />
                <div className="space-y-2">
                  <h4 className="font-bold">Pro quota gone before the CLI</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    I burned through Cursor Pro usage before the first meaningful commit. The whole build ran under quota pressure: shorter hops, tighter prompts, more manual steering. Most of the heavy lifting happened in <strong className="text-foreground">Auto</strong> mode. That's the flex: constraints, not infinite credits.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <aside className="reveal space-y-8">
            <div className="rounded-2xl border border-border bg-card p-8">
              <History className="mb-6 h-8 w-8 text-sidebar-primary" />
              <h3 className="mb-4 font-display text-xl font-bold">3 Weeks.</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                From zero to a production-ready CLI. No multi-quarter committees, just focused work and agent-assisted velocity.
              </p>
              <div className="mt-6 space-y-3 border-t border-border pt-6">
                <div className="flex items-center gap-3">
                  <GitCommit className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-mono">
                    {SITE_DATA.git.commitCount} commits on {SITE_DATA.git.headBranch} (snapshot)
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Terminal output matches <code className="font-mono">git log</code> at site build (
                  {new Date(SITE_DATA.generatedAt).toLocaleDateString()}).
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-sidebar-primary p-8 text-sidebar-primary-foreground">
              <h3 className="mb-4 font-display text-xl font-bold">Receipts?</h3>
              <p className="mb-6 text-sm opacity-90">
                The code is the truth. Check the git log, the tests, and the docs. We don't hide the process.
              </p>
              <a 
                href={LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold hover:underline"
              >
                Explore the Repo
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </aside>
        </div>

        {/* Final CTA */}
        <section className="reveal mt-20 rounded-3xl border border-border bg-gradient-to-b from-card to-transparent p-6 text-center sm:mt-24 sm:p-8 md:mt-32 md:p-12">
          <h2 className="mb-4 font-display text-2xl font-bold tracking-tight sm:text-3xl">Want the long-form versions?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-muted-foreground">
            Same facts, different voice. Pick the lane you care about—the motivation behind the build or the technical deep-dive into agent-assisted development.
          </p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            <a 
              href={docsUrl("origin/README")} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-sidebar-primary px-6 py-3 text-sm font-bold text-sidebar-primary-foreground transition-all hover:opacity-90 sm:w-auto sm:px-8"
            >
              Motivation Write-up
              <ExternalLink className="h-4 w-4 opacity-80" aria-hidden />
            </a>
            <a 
              href={docsUrl("cursor/README")} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-bold transition-all hover:border-sidebar-primary sm:w-auto sm:px-8"
            >
              Cursor Agents Write-up
              <ExternalLink className="h-4 w-4 opacity-80" aria-hidden />
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
