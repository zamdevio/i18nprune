import { motion } from "motion/react";
import { Code2, ExternalLink, GitBranch, Terminal } from "lucide-react";
import { docsCommandUrl } from "../../../../constants/links";
import { DISPLAY_SECTION_TITLE_LG } from "../../../../constants/typography";

const steps = [
  {
    title: "Scan Source",
    description: "Extract literal keys and handle dynamic site patterns directly from your codebase.",
    icon: Code2,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    title: "Validate & Sync",
    description: "Detect missing keys, structural drift, and unused translations against source JSON.",
    icon: Terminal,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    title: "CI Enforcement",
    description: "Block PRs with broken i18n and ensure your production build is always localized.",
    icon: GitBranch,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
];

export function WorkflowSection() {
  return (
    <section id="workflow" className="relative overflow-hidden bg-background py-32">
      <div className="container relative z-10 mx-auto max-w-6xl px-6">
        <div className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className={`${DISPLAY_SECTION_TITLE_LG} mb-6`}>
                The workflow your <br />
                <span className="stat-highlight">team will actually use</span>
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed font-medium">
                Integrated into your CLI and CI/CD, i18nprune becomes the source of truth for your localization health.
              </p>
            </motion.div>
          </div>
          <motion.div
             initial={{ opacity: 0, x: 20 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6, delay: 0.2 }}
          >
            <a
              href={docsCommandUrl("report")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/50 px-6 py-3 text-sm font-bold text-foreground transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
            >
              View report docs
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
            </a>
          </motion.div>
        </div>

        <div className="relative grid grid-cols-1 gap-12 md:grid-cols-3">
          {/* Connector Line */}
          <div className="absolute top-10 left-0 hidden h-[2px] w-full bg-gradient-to-r from-transparent via-border to-transparent md:block z-0" />

          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 flex flex-col items-center text-center md:items-start md:text-left group"
            >
              <div className={`mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-border/50 bg-background shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:shadow-xl`}>
                <div className={`absolute inset-0 rounded-2xl ${step.bg} blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <step.icon className={`h-8 w-8 relative z-10 ${step.color}`} />
              </div>
              <h3 className="mb-4 font-display text-2xl font-bold">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-base font-medium">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Inset Copy Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-24 relative overflow-hidden rounded-3xl border border-border/50 bg-card/40 p-10 md:p-14 backdrop-blur-xl shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1 max-w-xl">
              <h4 className="mb-4 font-display text-2xl font-bold">Why i18nprune?</h4>
              <p className="text-base text-muted-foreground leading-relaxed font-medium">
                Traditional i18n tools are reactive. i18nprune is proactive. It doesn't just store keys; it ensures they are used correctly, synchronized across languages, and optimized for your production bundles before they ever reach main.
              </p>
            </div>
            <div className="h-px w-full bg-border/50 md:h-32 md:w-px" />
            <div className="flex-1 w-full md:w-auto">
              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {[
                  "Validate keys vs source",
                  "CI-friendly CLI",
                  "Dynamic key heuristics",
                  "JSON output for agents"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-base font-semibold">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
