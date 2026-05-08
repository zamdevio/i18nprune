import { motion } from "motion/react";
import { CheckCircle2, ChevronRight, Terminal as TerminalIcon } from "lucide-react";
import { getDocsUrl } from "../../../../constants/links";

export function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-start overflow-hidden bg-background pt-36 pb-16 sm:pt-40 lg:pt-48 lg:pb-32">
      {/* Background Treatments */}
      <div className="grid-texture absolute inset-0 z-0" />
      <div className="hero-glow z-0" />
      <div className="noise-overlay z-0" />
      <div className="bg-gradient-to-t from-background via-background/80 to-transparent absolute bottom-0 left-0 w-full h-40 z-10 pointer-events-none" />

      <div className="container relative z-20 mx-auto max-w-5xl px-6 text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 inline-flex items-center gap-3 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-xs font-mono font-semibold text-primary backdrop-blur-md shadow-[0_0_15px_hsl(var(--primary)/0.1)]"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          i18nprune v0.1.0 is live
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 max-w-4xl font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl lg:text-[5rem] text-foreground mx-auto"
        >
          The ESLint for <br className="hidden sm:block" />
          <span className="stat-highlight">production i18n</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed font-medium mx-auto"
        >
          Stop merging broken translations. Validate keys against source code, prune dead strings, and generate AI fallbacks—directly in CI.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row w-full max-w-2xl mx-auto"
        >
          <a
            href={getDocsUrl("onboarding/README")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-glow group flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-bold text-primary-foreground w-full sm:w-auto shadow-[0_0_30px_hsl(var(--primary)/0.25)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.4)]"
          >
            Read the Docs
            <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden />
          </a>
          <div className="relative group flex items-center w-full sm:w-auto overflow-hidden sm:overflow-visible">
             <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-border/50 to-border/10 opacity-0 transition duration-300 group-hover:opacity-100 blur-sm" />
             <div className="relative flex items-center justify-center w-full sm:w-auto gap-3 rounded-xl border border-border/50 bg-secondary/30 px-6 py-4 font-mono text-sm font-medium backdrop-blur-sm transition-colors hover:bg-secondary/50 whitespace-nowrap overflow-x-auto sm:overflow-visible no-scrollbar">
               <span className="text-muted-foreground flex items-center gap-2">
                 <TerminalIcon className="h-4 w-4 text-primary shrink-0" />
                 <span className="text-foreground shrink-0 hidden sm:inline">npm install</span>
                 <span className="text-foreground shrink-0 sm:hidden">npm i</span>
                 <span className="shrink-0">-D i18nprune</span>
               </span>
             </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-xs sm:text-sm font-semibold text-muted-foreground w-full max-w-3xl mx-auto"
        >
          {[
            "Drift detection",
            "Structural sync",
            "Dead key pruning",
            "AI locale filling"
          ].map((feature, i) => (
            <div key={i} className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
