import { motion } from "motion/react";
import { Terminal, Search, RefreshCw, Sparkles, Trash2, Stethoscope, FileJson } from "lucide-react";
import { DISPLAY_SECTION_TITLE_LG } from "../../../../constants/typography";

const commands = [
  { name: "validate", icon: Search, desc: "Scan for drift & missing keys" },
  { name: "sync", icon: RefreshCw, desc: "Align locale structure" },
  { name: "generate", icon: Sparkles, desc: "AI-powered translations" },
  { name: "cleanup", icon: Trash2, desc: "Remove unused keys" },
  { name: "doctor", icon: Stethoscope, desc: "Structural diagnostics" },
  { name: "report", icon: FileJson, desc: "Export JSON health data" },
];

export function CommandsSection() {
  return (
    <section className="bg-background py-24">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-16 text-center">
          <h2 className={DISPLAY_SECTION_TITLE_LG}>
            Powerful CLI Commands
          </h2>
          <p className="mt-4 text-muted-foreground">
            A complete toolkit for every stage of your localization lifecycle.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {commands.map((cmd, index) => (
            <motion.div
              key={cmd.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group flex items-start gap-4 rounded-2xl border border-border bg-card/50 p-6 transition-all hover:border-sidebar-primary/30"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-sidebar-primary">
                <cmd.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-foreground">i18nprune {cmd.name}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{cmd.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
