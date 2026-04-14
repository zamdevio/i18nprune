import { motion } from "motion/react";
import { Code2, ExternalLink, GitBranch, Terminal } from "lucide-react";
import { docsCommandUrl } from "../../../../constants/links";
import { DISPLAY_SECTION_TITLE_LG } from "../../../../constants/typography";

const steps = [
  {
    title: "Scan Source",
    description: "i18nprune analyzes your codebase to extract literal keys and handle dynamic site patterns.",
    icon: Code2,
  },
  {
    title: "Validate & Sync",
    description: "Detect missing keys, structural drift, and unused translations against source JSON.",
    icon: Terminal,
  },
  {
    title: "CI Enforcement",
    description: "Block PRs with broken i18n and ensure your production build is always localized.",
    icon: GitBranch,
  },
];

export function WorkflowSection() {
  return (
    <section id="workflow" className="relative overflow-hidden bg-secondary/30 py-24">
      <div className="container relative z-10 mx-auto max-w-7xl px-4">
        <div className="mb-16 flex flex-col items-center justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-2xl text-center md:text-left">
            <h2 className={DISPLAY_SECTION_TITLE_LG}>
              The workflow your <br />
              <span className="stat-highlight">team will actually use</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Integrated into your CLI and CI/CD, i18nprune becomes the source of truth for your localization health.
            </p>
          </div>
          <a
            href={docsCommandUrl("report")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-bold transition-all hover:border-sidebar-primary"
          >
            Report command docs
            <ExternalLink className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
          </a>
        </div>

        <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Connector Line */}
          <div className="absolute top-1/2 left-0 hidden h-px w-full bg-gradient-to-r from-transparent via-border to-transparent md:block" />

          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="relative flex flex-col items-center text-center md:items-start md:text-left"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-background shadow-sm transition-transform hover:scale-110">
                <step.icon className="h-8 w-8 text-sidebar-primary" />
              </div>
              <h3 className="mb-3 font-display text-xl font-bold">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Inset Copy Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-20 rounded-2xl border border-border bg-card/70 p-8 backdrop-blur-md"
        >
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex-1">
              <h4 className="mb-2 font-display text-lg font-bold">Why i18nprune?</h4>
              <p className="text-sm text-muted-foreground">
                Traditional i18n tools are reactive. i18nprune is proactive. It doesn't just store keys; it ensures they are used correctly, synchronized across languages, and optimized for your production bundles.
              </p>
            </div>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent md:h-12 md:w-px md:bg-gradient-to-b" />
            <div className="flex-1">
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <li className="flex items-center gap-2 text-sm font-medium">
                  <div className="h-1.5 w-1.5 rounded-full bg-sidebar-primary" />
                  Validate keys vs source
                </li>
                <li className="flex items-center gap-2 text-sm font-medium">
                  <div className="h-1.5 w-1.5 rounded-full bg-sidebar-primary" />
                  CI-friendly CLI
                </li>
                <li className="flex items-center gap-2 text-sm font-medium">
                  <div className="h-1.5 w-1.5 rounded-full bg-sidebar-primary" />
                  Dynamic key heuristics
                </li>
                <li className="flex items-center gap-2 text-sm font-medium">
                  <div className="h-1.5 w-1.5 rounded-full bg-sidebar-primary" />
                  JSON output for agents
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
