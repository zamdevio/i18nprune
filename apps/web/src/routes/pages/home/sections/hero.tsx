import { motion } from "motion/react";
import { ArrowRight, ExternalLink, Github, CheckCircle2 } from "lucide-react";
import { LINKS, docsUrl } from "../../../../constants/links";
import { HOME_HERO_TITLE } from "../../../../constants/typography";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-background pt-24 pb-20 lg:pt-32 lg:pb-32">
      {/* Background Treatments */}
      <div className="grid-texture absolute inset-0 z-0" />
      <div className="hero-glow z-0" />
      <div className="noise-overlay z-0" />
      <div className="bg-gradient-to-t from-background to-transparent absolute bottom-0 left-0 w-full h-24 z-10" />

      <div className="container relative z-20 mx-auto max-w-7xl px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-sidebar-primary"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sidebar-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sidebar-primary"></span>
          </span>
          ESLint for i18n
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={HOME_HERO_TITLE}
        >
          Validate · sync · generate <br />
          <span className="stat-highlight">quality i18n at scale</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl"
        >
          The production toolkit for locale repair and drift detection. 
          Prune unused keys, fill missing translations with AI, and ensure CI-proof localization.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <a 
            href={docsUrl("README")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-glow group flex items-center gap-2 rounded-full bg-sidebar-primary px-8 py-4 text-base font-bold text-sidebar-primary-foreground"
          >
            Get Started
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </a>
          <a 
            href={LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full border border-border bg-background px-8 py-4 text-base font-bold hover:border-sidebar-primary hover:bg-secondary transition-all"
          >
            <Github className="h-5 w-5" />
            GitHub
            <ExternalLink className="h-4 w-4 opacity-80" aria-hidden />
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-sidebar-primary" />
            Drift detection
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-sidebar-primary" />
            Locale repair
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-sidebar-primary" />
            CI proof
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-sidebar-primary" />
            Automation ready
          </div>
        </motion.div>
      </div>
    </section>
  );
}
