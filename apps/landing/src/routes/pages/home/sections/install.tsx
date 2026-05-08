import { motion } from "motion/react";
import { Copy, Check, Terminal, ExternalLink } from "lucide-react";
import { useState } from "react";
import { LINKS } from "../../../../constants/links";
import { DISPLAY_SECTION_TITLE_LG } from "../../../../constants/typography";

export function InstallSection() {
  const [copied, setCopied] = useState(false);
  const command = "npm install -D i18nprune";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="bg-background py-32 relative overflow-hidden">
      <div className="absolute right-1/4 bottom-1/4 w-96 h-96 bg-primary/10 blur-[150px] pointer-events-none rounded-full" />
      <div className="container relative mx-auto max-w-4xl px-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-[2.5rem] border border-border/50 bg-card/30 p-10 text-center backdrop-blur-2xl md:p-20 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
          
          <div className="relative z-10">
            <h2 className={`${DISPLAY_SECTION_TITLE_LG} mb-6`}>
              Ready to prune your locales?
            </h2>
            <p className="mb-12 text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
              Drop it into any JavaScript or TypeScript project. Zero configuration required to start validating.
            </p>

            <div className="group relative mx-auto max-w-lg">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 opacity-0 blur transition duration-500 group-hover:opacity-100" />
              <div className="relative flex items-center justify-between rounded-xl border border-border/50 bg-background px-6 py-4 shadow-inner transition-all group-hover:border-primary/50">
                <div className="flex items-center gap-4 overflow-hidden">
                  <Terminal className="h-5 w-5 shrink-0 text-primary" />
                  <span className="truncate font-mono text-base text-foreground font-medium">{command}</span>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground transition-all hover:bg-primary hover:text-primary-foreground"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <a 
                href={LINKS.npm}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
              >
                View on npm 
                <ExternalLink className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-3xl mx-auto">
              {[
                { step: 1, title: "Install" },
                { step: 2, title: "Configure" },
                { step: 3, title: "Prune" }
              ].map(({ step, title }) => (
                <div key={step} className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/50 text-foreground font-bold font-mono border border-border/50">
                    {step}
                  </div>
                  <div className="text-base font-bold text-foreground">{title}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
