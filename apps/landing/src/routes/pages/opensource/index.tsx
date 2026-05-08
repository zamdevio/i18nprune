import {
  Github,
  Heart,
  Users,
  Code2,
  Globe,
  Shield,
  Star,
  GitFork,
  MessageSquare,
  Terminal as TerminalIcon,
  ExternalLink,
  Package,
} from "lucide-react";
import { useEffect, useState } from "react";
import PageHero from "../../../components/page-hero";
import Terminal from "../../../components/terminal";
import { getDocsUrl, LINKS } from "../../../constants/links";
import { DISPLAY_SECTION_TITLE } from "../../../constants/typography";
import { openSourceContributeSessions } from "../../../data/terminal";
import { SITE_DATA } from "../../../data/site";
import { useRevealOnPage } from "../../../hooks/useRevealOnPage";
import {
  fetchGithub,
  formatGithubCount,
  type GitHubRepoMeta,
} from "../../../lib/github";

const STACK = [
  { name: "TypeScript", description: "Type-safe core logic", icon: Code2 },
  { name: "Node.js", description: "Fast CLI runtime", icon: TerminalIcon },
  { name: "Ripgrep", description: "Blazing fast code scanning", icon: Globe },
  { name: "MIT License", description: "Free for everyone", icon: Shield },
];

export default function OpenSourcePage() {
  useRevealOnPage("opensource");
  const [runtimeGitHub, setRuntimeGitHub] = useState<GitHubRepoMeta | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchGithub().then((meta) => {
      if (!cancelled) {
        setRuntimeGitHub(meta);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const gh = {
    stars: runtimeGitHub?.stars ?? SITE_DATA.gitHub.stars,
    contributors: runtimeGitHub?.contributors ?? SITE_DATA.gitHub.contributors,
    forks: runtimeGitHub?.forks ?? SITE_DATA.gitHub.forks,
    openIssues: runtimeGitHub?.openIssues ?? SITE_DATA.gitHub.openIssues,
  };
  const stats = [
    { label: "GitHub Stars", value: formatGithubCount(gh.stars), icon: Star, color: "text-amber-400" },
    { label: "Contributors", value: formatGithubCount(gh.contributors), icon: Users, color: "text-sidebar-primary" },
    { label: "Forks", value: formatGithubCount(gh.forks), icon: GitFork, color: "text-emerald-400" },
    {
      label: "Open issues",
      value: formatGithubCount(gh.openIssues),
      icon: MessageSquare,
      color: "text-blue-400",
    },
  ];
  const contributeSessions = openSourceContributeSessions();
  const runtimeCacheInfo =
    runtimeGitHub?.fetchedAtUnix && runtimeGitHub?.nextRefreshUnix
      ? `Cache ${runtimeGitHub.source ?? "unknown"} · fetched ${new Date(runtimeGitHub.fetchedAtUnix * 1000).toLocaleTimeString()} · next refresh ${new Date(runtimeGitHub.nextRefreshUnix * 1000).toLocaleTimeString()}`
      : null;

  return (
    <main className="bg-background pb-24 md:pb-32">
      <PageHero
        eyebrow="Community"
        title="Built in the Open"
        description="i18nprune is MIT licensed and community driven. Transparency isn't a feature; it's our foundation. We believe in building tools that empower the engineering community without lock-in."
      >
        <div className="flex w-full flex-wrap justify-center gap-3 sm:w-auto sm:gap-4">
          <a
            href={LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-glow inline-flex w-full items-center justify-center gap-2 rounded-full bg-sidebar-primary px-6 py-3 text-sm font-bold text-sidebar-primary-foreground transition-all sm:w-auto sm:px-8"
          >
            View on GitHub
            <ExternalLink className="h-4 w-4 opacity-80" aria-hidden />
          </a>
          <a
            href={LINKS.npm}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card/80 px-6 py-3 text-sm font-semibold backdrop-blur transition-colors hover:border-sidebar-primary sm:w-auto sm:px-8"
          >
            npm package
            <ExternalLink className="h-4 w-4 opacity-80" aria-hidden />
          </a>
          <a
            href={getDocsUrl("contributors/README")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card/80 px-6 py-3 text-sm font-semibold backdrop-blur transition-colors hover:border-sidebar-primary sm:w-auto sm:px-8"
          >
            Contribution Guide
            <ExternalLink className="h-4 w-4 opacity-80" aria-hidden />
          </a>
        </div>
      </PageHero>

      <div className="container mx-auto max-w-6xl px-4">
        <section className="reveal mb-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:mb-20 md:mb-24 md:grid-cols-4">
          {stats.map((stat, i) => (
            <div key={i} className="bg-card p-5 text-center transition-colors hover:bg-secondary/20 sm:p-6 md:p-8">
              <stat.icon className={`mx-auto mb-4 h-6 w-6 ${stat.color}`} />
              <div className="mb-1 text-2xl font-bold tracking-tight sm:text-3xl">{stat.value}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </section>
        {runtimeCacheInfo ? (
          <p className="reveal mb-10 text-center text-[11px] text-muted-foreground">{runtimeCacheInfo}</p>
        ) : null}

        <div className="grid gap-16 lg:grid-cols-2 lg:items-start">
          <section className="reveal space-y-6">
            <div className="space-y-4">
              <h2 className={DISPLAY_SECTION_TITLE}>
                Join the development
              </h2>
              <p className="text-muted-foreground">
                Monorepo: use Corepack + <span className="font-mono text-foreground">pnpm</span> at the repo root.
                Numbers below come from the last site data generation (git + Vitest).
              </p>
            </div>
            <Terminal title="contributing-to-i18nprune" sessions={contributeSessions} />
            <div className="rounded-xl border border-border bg-secondary/30 p-6">
              <h3 className="mb-2 flex items-center gap-2 font-semibold">
                <Heart className="h-4 w-4 text-red-500" />
                Support the project
              </h3>
              <p className="text-sm text-muted-foreground">
                If i18nprune helps your team, consider starring the repo or sharing it with other developers. Your
                support keeps the project alive.
              </p>
            </div>
          </section>

          <section className="reveal space-y-12">
            <div className="space-y-8">
              <h2 className={DISPLAY_SECTION_TITLE}>The Open Stack</h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {STACK.map((item, i) => (
                  <div
                    key={i}
                    className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-sidebar-primary/50 hover:shadow-lg hover:shadow-sidebar-primary/5"
                  >
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary/10 text-sidebar-primary transition-colors group-hover:bg-sidebar-primary group-hover:text-sidebar-primary-foreground">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-1 font-bold">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h2 className={DISPLAY_SECTION_TITLE}>
                Why Open Source?
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Internationalization is a critical part of any global application. We believe the tools used to manage
                  it should be transparent, auditable, and free from proprietary lock-in.
                </p>
                <p>
                  By building in the open, we benefit from the collective wisdom of developers worldwide, resulting in
                  a more robust, secure, and versatile tool for everyone.
                </p>
                <div className="pt-4">
                  <a
                    href={`${LINKS.github}/blob/main/LICENSE`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-bold text-sidebar-primary hover:underline"
                  >
                    Read the MIT License
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="reveal mt-20 rounded-3xl border border-border bg-gradient-to-b from-sidebar-primary/5 to-transparent p-6 text-center sm:mt-24 sm:p-8 md:p-12">
          <h2 className="mb-4 font-display text-2xl font-bold tracking-tight sm:text-3xl">Need help?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-muted-foreground">
            Ask questions, propose features, or share how you use i18nprune — we use{" "}
            <strong className="text-foreground">GitHub Discussions</strong> as the main community channel.
          </p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            <a
              href={`${LINKS.github}/discussions`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background transition-all hover:opacity-90 sm:w-auto sm:px-8"
            >
              GitHub Discussions
              <ExternalLink className="h-4 w-4 opacity-80" aria-hidden />
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
