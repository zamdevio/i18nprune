import { motion } from 'motion/react';
import { ArrowRight, Terminal as TerminalIcon, Sparkles } from 'lucide-react';
import CopyButton from '../components/CopyButton';
import { useMeta } from '../context/MetaContext';

const PIPELINE = ['Source Code', 'AST Scan', 'Validate', 'Sync', 'Ship'];

export default function Hero() {
  const { cliVersion } = useMeta();
  return (
    <section
      id="top"
      className="relative min-h-[100svh] flex items-center pt-24 pb-24 overflow-hidden"
      data-testid="hero-section"
    >
      {/* Layer 0: grid + dots */}
      <div className="absolute inset-0 dot-grid" aria-hidden="true" />
      <div className="absolute inset-0 grid-texture opacity-50" aria-hidden="true" />
      {/* Layer 1: ambient glow */}
      <div className="absolute inset-x-0 top-0 h-[80vh] hero-glow" aria-hidden="true" />
      <div
        className="absolute left-1/2 -translate-x-1/2 top-[18%] w-[680px] h-[680px] rounded-full blur-[140px] opacity-30"
        style={{ background: 'radial-gradient(circle, hsl(160 100% 45% / 0.7) 0%, transparent 65%)' }}
        aria-hidden="true"
      />
      {/* Bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 w-full">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex max-w-[min(100%,20rem)] items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-card/60 backdrop-blur-xl text-xs text-center sm:max-w-none">
            <span className="relative flex w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-primary animate-pulse-dot" />
              <span className="relative rounded-full w-2 h-2 bg-primary" />
            </span>
            <span className="font-mono text-muted-foreground">
              <span className="text-primary">v{cliVersion}</span> · structural sync now stable
            </span>
          </div>
        </motion.div>

        {/* Headline — staggered lines */}
        <motion.h1
          className="font-display font-bold text-balance text-center leading-[1.02] tracking-[-0.04em] text-[2.35rem] min-[400px]:text-5xl sm:text-6xl md:text-7xl lg:text-[5.25rem]"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } } }}
          data-testid="hero-headline"
        >
          {['The ESLint', 'for production', <span key="hl" className="stat-highlight">i18n.</span>].map((line, i) => (
            <motion.span
              key={i}
              className="block"
              variants={{
                hidden: { opacity: 0, y: 32, filter: 'blur(8px)' },
                visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
              }}
            >
              {line}
            </motion.span>
          ))}
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 max-w-2xl mx-auto text-center text-base sm:text-lg text-muted-foreground leading-relaxed text-balance"
        >
          Compiler-grade static analysis for your locale files. Validate, sync, generate, and prune translations across every runtime — in CI, on the edge, before merge.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3"
        >
          <a
            href="#install"
            className="btn-glow inline-flex items-center justify-center gap-2 px-5 h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform"
            data-testid="hero-cta-primary"
          >
            <Sparkles className="w-4 h-4" />
            Get Started
            <ArrowRight className="w-4 h-4" />
          </a>
          <div
            className="inline-flex items-center gap-2 pl-4 pr-1.5 h-11 rounded-xl border border-border/70 bg-card/50 backdrop-blur-xl"
            data-testid="hero-install-command"
          >
            <TerminalIcon className="w-3.5 h-3.5 text-primary" />
            <code className="font-mono text-sm">
              <span className="text-muted-foreground">$</span> npm i -D{' '}
              <span className="text-foreground">i18nprune</span>
            </code>
            <CopyButton text="npm i -D i18nprune" testId="hero-copy-install" />
          </div>
        </motion.div>

        {/* Pipeline strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="mt-20"
          data-testid="hero-pipeline"
        >
          <div className="mx-auto max-w-3xl rounded-2xl glass-panel px-3 sm:px-5 py-4">
            <div className="flex items-center justify-between gap-2 overflow-x-auto">
              {PIPELINE.map((step, i) => (
                <div key={step} className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                    <span className="font-mono text-[11px] sm:text-xs uppercase tracking-wider text-muted-foreground">
                      {step}
                    </span>
                  </div>
                  {i < PIPELINE.length - 1 && (
                    <span className="text-border font-mono text-xs">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
