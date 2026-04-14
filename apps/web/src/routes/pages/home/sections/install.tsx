import { motion } from "motion/react";
import { Copy, Check, Terminal, ExternalLink } from "lucide-react";
import { useState } from "react";
import { LINKS } from "../../../../constants/links";
import { DISPLAY_SECTION_TITLE_LG } from "../../../../constants/typography";

export function InstallSection() {
  const [copied, setCopied] = useState(false);
  const command = "npm install -D @zamdevio/i18nprune";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="bg-background py-24">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="rounded-3xl border border-border bg-card/50 p-8 text-center backdrop-blur-sm md:p-12">
          <h2 className={`mb-4 ${DISPLAY_SECTION_TITLE_LG}`}>
            Ready to prune your locales?
          </h2>
          <p className="mb-10 text-lg text-muted-foreground">
            Get started in seconds. No complex configuration required.
          </p>

          <div className="group relative mx-auto max-w-md overflow-hidden rounded-2xl border border-border bg-secondary/50 p-1 transition-all hover:border-sidebar-primary/30">
            <div className="flex items-center justify-between px-4 py-3 font-mono text-sm sm:text-base">
              <div className="flex items-center gap-3 overflow-hidden">
                <Terminal className="h-4 w-4 shrink-0 text-sidebar-primary" />
                <span className="truncate text-foreground">{command}</span>
              </div>
              <button
                onClick={copyToClipboard}
                className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground transition-colors hover:text-sidebar-primary"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <a 
              href={LINKS.npm}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-sidebar-primary transition-colors"
            >
              View on npm <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-4 sm:gap-8">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sidebar-primary">
                1
              </div>
              <div className="text-sm font-bold">Install</div>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sidebar-primary">
                2
              </div>
              <div className="text-sm font-bold">Configure</div>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sidebar-primary">
                3
              </div>
              <div className="text-sm font-bold">Prune</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
