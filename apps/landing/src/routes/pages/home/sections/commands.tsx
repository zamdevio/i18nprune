import { motion } from "motion/react";
import { Terminal, Search, RefreshCw, Sparkles, Trash2, Stethoscope, FileJson, ArrowRight } from "lucide-react";
import { DISPLAY_SECTION_TITLE_LG } from "../../../../constants/typography";
import { docsCommandUrl } from "../../../../constants/links";

const commands = [
  { name: "validate", icon: Search, desc: "Scan codebase for drift & missing keys before they hit production." },
  { name: "sync", icon: RefreshCw, desc: "Align locale structure and auto-merge changes to all targets." },
  { name: "generate", icon: Sparkles, desc: "AI-powered translations to fill missing keys dynamically." },
  { name: "cleanup", icon: Trash2, desc: "Safely remove unused and dead keys to shrink bundle size." },
  { name: "doctor", icon: Stethoscope, desc: "Structural diagnostics and read-only project health checks." },
  { name: "report", icon: FileJson, desc: "Export detailed JSON health data or shareable HTML reports." },
];

export function CommandsSection() {
  return (
    <section className="bg-background py-32 relative overflow-hidden">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/4 h-3/4 bg-primary/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="container relative mx-auto max-w-6xl px-6">
        <div className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className={`${DISPLAY_SECTION_TITLE_LG} mb-6`}>
                Command your <br />
                <span className="stat-highlight">localization lifecycle</span>
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed font-medium">
                A complete CLI toolkit engineered for every stage of your release process. Fast, deterministic, and CI-ready.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {commands.map((cmd, index) => (
            <motion.div
              key={cmd.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="group relative flex flex-col rounded-3xl border border-border/50 bg-card/40 p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_20px_40px_hsl(var(--primary)/0.1)]"
            >
              <div className="mb-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary/50 text-foreground transition-all duration-500 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 group-hover:shadow-lg">
                <cmd.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="mb-3 flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                    i18nprune {cmd.name}
                  </span>
                </div>
                <p className="text-base text-muted-foreground font-medium leading-relaxed mb-6">
                  {cmd.desc}
                </p>
              </div>
              <div className="mt-auto">
                 <a 
                   href={docsCommandUrl(cmd.name)}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors group-hover:text-primary"
                 >
                   Documentation <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                 </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
