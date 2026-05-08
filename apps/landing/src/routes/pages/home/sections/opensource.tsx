import { motion } from "motion/react";
import { Github, Heart, Users, Star, GitBranch } from "lucide-react";
import { useEffect, useState } from "react";
import { LINKS } from "../../../../constants/links";
import { SITE_DATA } from "../../../../data/site";
import { fetchGithub, formatGithubCount, type GitHubRepoMeta } from "../../../../lib/github";
import { DISPLAY_SECTION_TITLE_LG } from "../../../../constants/typography";

export function OpenSourceSection() {
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
    forks: runtimeGitHub?.forks ?? SITE_DATA.gitHub.forks,
    contributors: runtimeGitHub?.contributors ?? SITE_DATA.gitHub.contributors,
    openIssues: runtimeGitHub?.openIssues ?? SITE_DATA.gitHub.openIssues,
  };

  return (
    <section className="bg-secondary/10 py-32 border-y border-border/40 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />
      <div className="container relative mx-auto max-w-5xl px-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl border border-border/50 bg-background/50 backdrop-blur-xl p-10 text-center md:p-20 shadow-xl"
        >
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary/80 text-foreground shadow-inner border border-border/50">
            <Github className="h-10 w-10" />
          </div>
          <h2 className={`${DISPLAY_SECTION_TITLE_LG} mb-6`}>
            Built in the open
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-xl font-medium leading-relaxed text-muted-foreground">
            i18nprune is MIT licensed and built by the community. Join us on GitHub to contribute, report issues, or suggest new features.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-8 sm:flex-row">
            <a
              href={LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-full bg-foreground px-8 py-4 text-base font-bold text-background transition-all hover:scale-105 hover:shadow-xl hover:shadow-foreground/20"
            >
              <Github className="h-5 w-5" />
              Star on GitHub
            </a>
            <div className="flex flex-wrap justify-center gap-6 text-sm font-semibold text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Community driven</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                <span>MIT Licensed</span>
              </div>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-border/50 pt-12">
            {[
              { icon: Star, label: "Stars", value: formatGithubCount(gh.stars) },
              { icon: GitBranch, label: "Forks", value: formatGithubCount(gh.forks) },
              { icon: Users, label: "Contributors", value: formatGithubCount(gh.contributors) },
              { icon: Github, label: "Issues", value: formatGithubCount(gh.openIssues) },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-xl font-bold font-mono">{stat.value}</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
