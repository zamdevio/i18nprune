import { motion } from "motion/react";
import { 
  ShieldCheck, 
  RefreshCw, 
  Sparkles, 
  Trash2, 
  Stethoscope, 
  FileJson, 
  Search 
} from "lucide-react";
import { DISPLAY_SECTION_TITLE_LG } from "../../../../constants/typography";

const features = [
  {
    title: "Validate",
    description: "Deep scan your codebase for missing, unused, or broken i18n keys before they hit production.",
    icon: ShieldCheck,
    className: "md:col-span-2",
  },
  {
    title: "Sync",
    description: "Keep all locale files in perfect structural harmony automatically.",
    icon: RefreshCw,
    className: "md:col-span-1",
  },
  {
    title: "Generate & Fill",
    description: "Leverage MT and AI to generate missing translations or fill empty keys in seconds.",
    icon: Sparkles,
    className: "md:col-span-1",
  },
  {
    title: "Prune & Cleanup",
    description: "Safely remove dead keys and optimize your locale bundles for performance.",
    icon: Trash2,
    className: "md:col-span-2",
  },
  {
    title: "Doctor",
    description: "Read-only diagnostics for corrupted locale files and structural drift.",
    icon: Stethoscope,
    className: "md:col-span-1",
  },
  {
    title: "Automation",
    description: "Full CLI support with --json output for custom agents and CI pipelines.",
    icon: FileJson,
    className: "md:col-span-1",
  },
  {
    title: "Quality Audit",
    description: "Review translation quality and consistency across all languages.",
    icon: Search,
    className: "md:col-span-1",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-background py-24">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-16 text-center">
          <h2 className={DISPLAY_SECTION_TITLE_LG}>
            Everything you need for <br />
            <span className="stat-highlight">production-grade i18n</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Stop guessing if your translations are complete. i18nprune gives you the tools to maintain a healthy localization pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`group relative overflow-hidden rounded-2xl border border-border bg-card/70 p-8 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-sidebar-primary/50 hover:shadow-[0_8px_32px_hsl(var(--sidebar-primary)/0.12)] ${feature.className}`}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-sidebar-primary transition-colors group-hover:bg-sidebar-primary group-hover:text-sidebar-primary-foreground">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-display text-xl font-bold">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
              
              {/* Decorative background element */}
              <div className="absolute -right-4 -bottom-4 opacity-[0.03] transition-opacity group-hover:opacity-[0.08]">
                <feature.icon className="h-32 w-32" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
