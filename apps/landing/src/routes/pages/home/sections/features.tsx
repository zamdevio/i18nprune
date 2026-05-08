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
    className: "md:col-span-2 md:row-span-2",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    title: "Sync",
    description: "Keep all locale files in perfect structural harmony automatically. Never manually add keys again.",
    icon: RefreshCw,
    className: "md:col-span-1",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    title: "Generate & Fill",
    description: "Leverage MT and AI to generate missing translations or fill empty keys in seconds.",
    icon: Sparkles,
    className: "md:col-span-1",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    title: "Prune & Cleanup",
    description: "Safely remove dead keys and optimize your locale bundles for performance.",
    icon: Trash2,
    className: "md:col-span-1",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    title: "Automation",
    description: "Full CLI support with --json output for custom agents and CI pipelines.",
    icon: FileJson,
    className: "md:col-span-1",
    color: "text-primary",
    bg: "bg-primary/10",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-secondary/20 py-32 relative overflow-hidden">
      <div className="absolute right-0 top-1/4 w-1/3 h-1/2 bg-primary/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="container relative mx-auto max-w-6xl px-6">
        <div className="mb-20 text-center max-w-3xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={DISPLAY_SECTION_TITLE_LG}
          >
            Everything you need for <br />
            <span className="stat-highlight">production-grade i18n</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 text-xl text-muted-foreground font-medium"
          >
            Stop guessing if your translations are complete. i18nprune gives you the tools to maintain a healthy localization pipeline.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:grid-rows-2">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`group relative overflow-hidden rounded-3xl border border-border/50 bg-card/60 p-8 md:p-10 backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_20px_40px_hsl(var(--primary)/0.1)] flex flex-col ${feature.className}`}
            >
              <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${feature.bg} ${feature.color} transition-transform duration-500 group-hover:scale-110`}>
                <feature.icon className="h-7 w-7" />
              </div>
              <h3 className="mb-3 font-display text-2xl font-bold">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-base font-medium flex-1">
                {feature.description}
              </p>
              
              {/* Decorative background element */}
              <div className={`absolute -right-8 -bottom-8 opacity-[0.03] transition-opacity duration-500 group-hover:opacity-[0.08] ${feature.color}`}>
                <feature.icon className="h-48 w-48" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
