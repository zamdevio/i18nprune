import { motion } from "motion/react";
import { Bot, Globe, Layout, Share2, Github, Terminal, ChevronRight, CheckCircle2, CircleDashed } from "lucide-react";
import { LINKS } from "../../../../constants/links";
import { useState, useEffect } from "react";

const tools = [
  { name: "GitHub Actions", icon: Github },
  { name: "Vercel", icon: Globe },
  { name: "Netlify", icon: Layout },
  { name: "Slack", icon: Share2 },
  { name: "Custom Agents", icon: Bot },
];

function CIRunAnimation() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => (s < 4 ? s + 1 : 0));
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  const steps = [
    { label: "Checkout code", time: "1s" },
    { label: "Install dependencies", time: "12s" },
    { label: "i18nprune validate", time: "0.8s", highlight: true },
    { label: "Build project", time: "24s" },
  ];

  return (
    <div className="w-full max-w-sm rounded-xl border border-border/50 bg-card/50 backdrop-blur-md shadow-xl overflow-hidden text-sm">
      <div className="flex items-center gap-2 border-b border-border/50 bg-secondary/30 px-4 py-3">
        <Github className="h-4 w-4 text-foreground" />
        <span className="font-semibold text-foreground">CI / PR Check</span>
        <div className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
          <span className="relative flex h-1.5 w-1.5">
            {step < 4 ? (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            ) : null}
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          {step < 4 ? "Running" : "Passed"}
        </div>
      </div>
      <div className="p-4 space-y-3 font-mono">
        {steps.map((s, i) => {
          const isPast = step > i;
          const isCurrent = step === i;
          const isPending = step < i;
          
          return (
            <div key={i} className={`flex items-center gap-3 transition-opacity duration-300 ${isPending ? 'opacity-40' : 'opacity-100'} ${s.highlight && (isPast || isCurrent) ? 'text-primary' : 'text-muted-foreground'}`}>
              {isPast ? (
                <CheckCircle2 className={`h-4 w-4 ${s.highlight ? 'text-primary' : 'text-emerald-500'}`} />
              ) : isCurrent ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                  <CircleDashed className="h-4 w-4 text-amber-500" />
                </motion.div>
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted" />
              )}
              <span className={s.highlight && isCurrent ? 'font-bold' : ''}>{s.label}</span>
              {isPast && <span className="ml-auto text-xs opacity-50">{s.time}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AutomationSection() {
  return (
    <section className="relative overflow-hidden border-y border-border/40 bg-secondary/10 py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
      <div className="container relative z-10 mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-16 lg:flex-row">
          <div className="text-center lg:text-left flex-1 max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Automation First
            </div>
            <h3 className="font-display text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-6">
              Built for <br className="hidden lg:block" /> pipelines & agents
            </h3>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              i18nprune is designed to run headlessly. Block PRs with missing translations in GitHub Actions, or feed structured JSON output to AI agents to automatically generate fallbacks.
            </p>
            
            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
              {tools.map((tool, index) => (
                <motion.div 
                  key={tool.name} 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center gap-2 text-muted-foreground transition-all group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background border border-border/50 shadow-sm transition-all group-hover:border-primary/50 group-hover:bg-primary/10 group-hover:text-primary group-hover:-translate-y-1">
                    <tool.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex-1 w-full flex justify-center lg:justify-end perspective-1000">
            <motion.div
              initial={{ opacity: 0, rotateY: -10, x: 20 }}
              whileInView={{ opacity: 1, rotateY: 0, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="w-full flex justify-center lg:justify-end"
            >
              <CIRunAnimation />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
