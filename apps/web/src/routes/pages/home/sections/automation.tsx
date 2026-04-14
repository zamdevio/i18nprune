import { motion } from "motion/react";
import { Bot, Globe, Layout, Share2, Github, Terminal } from "lucide-react";
import { LINKS } from "../../../../constants/links";

const tools = [
  { name: "GitHub Actions", icon: Github },
  { name: "Vercel", icon: Globe },
  { name: "Netlify", icon: Layout },
  { name: "Slack", icon: Share2 },
  { name: "Custom Agents", icon: Bot },
];

export function AutomationSection() {
  return (
    <section className="border-y border-border/60 bg-background py-12">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="text-center md:text-left">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-sidebar-primary">
              Automation First
            </div>
            <h3 className="font-display text-2xl font-bold tracking-tight">
              Built for pipelines & agents
            </h3>
          </div>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            {tools.map((tool) => (
              <motion.div 
                key={tool.name} 
                whileHover={{ y: -2 }}
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-sidebar-primary cursor-default group"
              >
                <tool.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                <span className="text-sm font-semibold tracking-tight">{tool.name}</span>
              </motion.div>
            ))}
          </div>

          <div className="hidden lg:block">
            <a 
              href={LINKS.npm}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 font-mono text-[0.8em] text-sidebar-primary hover:bg-sidebar-primary hover:text-sidebar-primary-foreground transition-all"
            >
              <Terminal className="h-3 w-3 transition-transform group-hover:rotate-12" />
              i18nprune --json
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
